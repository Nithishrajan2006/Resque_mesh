"""
Incidents Router — CRUD + validation + duplicate detection
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid, logging

from app.database import get_db
from app.models import Incident, MapFeature
from app.schemas import IncidentCreate, IncidentUpdate, IncidentOut
from app.websocket_manager import websocket_manager
from app.audit_service import log_action

logger = logging.getLogger(__name__)
router = APIRouter()

SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}


def _severity_sort_key(inc):
    return (SEVERITY_ORDER.get(inc.severity, 4), -inc.created_at.timestamp() if inc.created_at else 0)


@router.get("/", response_model=List[IncidentOut])
async def list_incidents(
    category: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    stmt = select(Incident)
    if category:
        stmt = stmt.where(Incident.category == category)
    if severity:
        stmt = stmt.where(Incident.severity == severity)
    if status:
        stmt = stmt.where(Incident.status == status)
    if search:
        term = f"%{search}%"
        stmt = stmt.where(
            or_(
                Incident.title.ilike(term),
                Incident.description.ilike(term),
                Incident.location_label.ilike(term),
            )
        )
    stmt = stmt.offset(offset).limit(limit)
    incidents = db.execute(stmt).scalars().all()
    incidents = sorted(incidents, key=_severity_sort_key)
    return incidents


@router.post("/", response_model=IncidentOut, status_code=201)
async def create_incident(data: IncidentCreate, db: Session = Depends(get_db)):
    # Duplicate detection: same title + location within 1 hour
    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
    dup_stmt = select(Incident).where(
        Incident.title == data.title,
        Incident.created_at >= one_hour_ago,
    )
    if data.latitude and data.longitude:
        dup_stmt = dup_stmt.where(
            func.abs(Incident.latitude - data.latitude) < 0.005,
            func.abs(Incident.longitude - data.longitude) < 0.005,
        )
    existing = db.execute(dup_stmt).scalars().first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "Possible duplicate incident detected",
                "existing_id": existing.id,
                "existing_title": existing.title,
            },
        )

    inc = Incident(
        id=str(uuid.uuid4()),
        title=data.title,
        description=data.description,
        category=data.category.value if hasattr(data.category, 'value') else data.category,
        severity=data.severity.value if hasattr(data.severity, 'value') else data.severity,
        status=data.status.value if hasattr(data.status, 'value') else data.status,
        latitude=data.latitude,
        longitude=data.longitude,
        location_label=data.location_label,
        source_device_id=data.source_device_id,
        reported_by=data.reported_by,
        affected_count=data.affected_count,
        notes=data.notes,
        is_synthetic=data.is_synthetic,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        version=1,
    )
    db.add(inc)

    # Add map feature if coordinates provided
    if data.latitude and data.longitude:
        mf = MapFeature(
            id=str(uuid.uuid4()),
            feature_type="incident",
            name=data.title,
            description=data.description,
            latitude=data.latitude,
            longitude=data.longitude,
            severity=inc.severity,
            status=inc.status,
            entity_id=inc.id,
            is_synthetic=data.is_synthetic,
            source_device_id=data.source_device_id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(mf)

    db.commit()
    db.refresh(inc)

    log_action(db, "CREATE_INCIDENT", "incident", inc.id,
               performed_by=data.reported_by or "user",
               new_value={"title": inc.title, "severity": inc.severity})
    await websocket_manager.broadcast_event("incident_created", {"id": inc.id, "title": inc.title, "severity": inc.severity})
    return inc


@router.get("/stats/summary")
async def incident_stats(db: Session = Depends(get_db)):
    all_incs = db.execute(select(Incident)).scalars().all()
    by_severity = {}
    by_status = {}
    by_category = {}
    for inc in all_incs:
        by_severity[inc.severity] = by_severity.get(inc.severity, 0) + 1
        by_status[inc.status] = by_status.get(inc.status, 0) + 1
        by_category[inc.category] = by_category.get(inc.category, 0) + 1
    return {
        "total": len(all_incs),
        "by_severity": by_severity,
        "by_status": by_status,
        "by_category": by_category,
    }


@router.get("/{incident_id}", response_model=IncidentOut)
async def get_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.execute(select(Incident).where(Incident.id == incident_id)).scalars().first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc


@router.put("/{incident_id}", response_model=IncidentOut)
async def update_incident(incident_id: str, data: IncidentUpdate, db: Session = Depends(get_db)):
    inc = db.execute(select(Incident).where(Incident.id == incident_id)).scalars().first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    old = {"severity": inc.severity, "status": inc.status}
    for field_name, value in data.model_dump(exclude_none=True).items():
        if hasattr(value, 'value'):
            value = value.value
        setattr(inc, field_name, value)
    inc.updated_at = datetime.now(timezone.utc)
    inc.version += 1

    # Update map feature
    mf = db.execute(select(MapFeature).where(MapFeature.entity_id == incident_id)).scalars().first()
    if mf:
        mf.severity = inc.severity
        mf.status = inc.status
        mf.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(inc)
    log_action(db, "UPDATE_INCIDENT", "incident", inc.id, old_value=old, new_value={"severity": inc.severity, "status": inc.status})
    await websocket_manager.broadcast_event("incident_updated", {"id": inc.id, "severity": inc.severity, "status": inc.status})
    return inc


@router.delete("/{incident_id}", status_code=204)
async def delete_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.execute(select(Incident).where(Incident.id == incident_id)).scalars().first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    db.delete(inc)
    # Remove map feature
    mf = db.execute(select(MapFeature).where(MapFeature.entity_id == incident_id)).scalars().first()
    if mf:
        db.delete(mf)
    db.commit()
    log_action(db, "DELETE_INCIDENT", "incident", incident_id)
    await websocket_manager.broadcast_event("incident_deleted", {"id": incident_id})


@router.post("/{incident_id}/verify", response_model=IncidentOut)
async def verify_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.execute(select(Incident).where(Incident.id == incident_id)).scalars().first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    inc.is_verified = True
    inc.status = "verified"
    inc.updated_at = datetime.now(timezone.utc)
    inc.version += 1
    db.commit()
    db.refresh(inc)
    log_action(db, "VERIFY_INCIDENT", "incident", inc.id)
    await websocket_manager.broadcast_event("incident_verified", {"id": inc.id})
    return inc
