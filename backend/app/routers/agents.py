"""
Agents Router — AI agent endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime, timezone
import logging

from app.database import get_db
from app.models import Incident, RescueTask, SupplyItem, InventoryTransaction, Peer, SyncMessage, ConflictRecord, MapFeature
from app.schemas import AgentSuggestion, DashboardStats
from app.agents.incident_agent import IncidentAgent
from app.agents.task_agent import TaskCoordinationAgent
from app.agents.supply_agent import SupplyAgent
from app.agents.spatial_agent import SpatialMapAgent

logger = logging.getLogger(__name__)
router = APIRouter()


def _incident_to_dict(inc) -> dict:
    return {
        "id": inc.id, "title": inc.title, "description": inc.description,
        "category": inc.category, "severity": inc.severity, "status": inc.status,
        "affected_count": inc.affected_count, "latitude": inc.latitude,
        "longitude": inc.longitude, "created_at": inc.created_at,
        "incident_id": inc.id,
    }


def _task_to_dict(t) -> dict:
    return {
        "id": t.id, "title": t.title, "incident_id": t.incident_id,
        "priority": t.priority, "status": t.status, "assigned_team": t.assigned_team,
        "ai_suggested": t.ai_suggested, "human_approved": t.human_approved,
        "created_at": t.created_at,
    }


def _item_to_dict(item, stock: float) -> dict:
    return {
        "id": item.id, "name": item.name, "category": item.category,
        "unit": item.unit, "current_stock": stock,
        "minimum_stock": item.minimum_stock,
        "location_label": item.location_label,
        "latitude": item.latitude, "longitude": item.longitude,
    }


def _calc_item_stock(item):
    total = 0.0
    for t in item.transactions:
        if t.transaction_type == "addition":
            total += abs(t.quantity)
        elif t.transaction_type in ("distribution", "transfer"):
            total -= abs(t.quantity)
        elif t.transaction_type == "adjustment":
            total += t.quantity
    return round(total, 2)


@router.get("/incident/analyze/{incident_id}")
async def analyze_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.execute(select(Incident).where(Incident.id == incident_id)).scalars().first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    all_result = db.execute(select(Incident)).scalars().all()
    all_incs = [_incident_to_dict(i) for i in all_result]

    agent = IncidentAgent()
    analysis = agent.analyze_incident(
        incident_id=inc.id, title=inc.title, description=inc.description,
        category=inc.category, severity=inc.severity, affected_count=inc.affected_count,
        latitude=inc.latitude, longitude=inc.longitude, created_at=inc.created_at,
        existing_incidents=all_incs,
    )
    return {
        "incident_id": analysis.incident_id,
        "priority_score": analysis.priority_score,
        "suggested_severity": analysis.suggested_severity,
        "confidence": analysis.confidence,
        "flags": analysis.flags,
        "reasoning": analysis.reasoning,
        "requires_immediate_response": analysis.requires_immediate_response,
        "recommended_actions": analysis.recommended_actions,
        "is_potential_duplicate": analysis.is_potential_duplicate,
        "duplicate_of": analysis.duplicate_of,
    }


@router.get("/incident/suggestions")
async def incident_suggestions(db: Session = Depends(get_db)):
    incidents = [_incident_to_dict(i) for i in db.execute(select(Incident)).scalars().all()]
    if not incidents:
        return {"suggestions": []}
    agent = IncidentAgent()
    ranked = agent.prioritize_all(incidents)
    return {"suggestions": ranked[:10]}


@router.get("/task/suggestions")
async def task_suggestions(db: Session = Depends(get_db)):
    tasks = [_task_to_dict(t) for t in db.execute(select(RescueTask)).scalars().all()]
    incidents = [_incident_to_dict(i) for i in db.execute(select(Incident)).scalars().all()]

    agent = TaskCoordinationAgent()
    ranked = agent.rank_tasks(tasks, incidents)
    return {"suggestions": [
        {
            "task_id": r.task_id, "score": r.score,
            "priority_suggestion": r.priority_suggestion,
            "reasoning": r.reasoning,
            "conflict_warnings": r.conflict_warnings,
        }
        for r in ranked[:10]
    ]}


@router.post("/task/suggest/{incident_id}")
async def suggest_task(incident_id: str, db: Session = Depends(get_db)):
    inc = db.execute(select(Incident).where(Incident.id == incident_id)).scalars().first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    existing_tasks = [_task_to_dict(t) for t in db.execute(select(RescueTask).where(RescueTask.incident_id == incident_id)).scalars().all()]

    agent = TaskCoordinationAgent()
    suggestion = agent.suggest_task_for_incident(
        incident=_incident_to_dict(inc),
        existing_tasks=existing_tasks,
        available_teams=["rescue-alpha", "rescue-bravo", "supply-unit"],
    )
    return {
        "title": suggestion.title,
        "description": suggestion.description,
        "priority": suggestion.priority,
        "suggested_team": suggestion.suggested_team,
        "estimated_duration_hours": suggestion.estimated_duration_hours,
        "reasoning": suggestion.reasoning,
        "confidence": suggestion.confidence,
        "conflict_warnings": suggestion.conflict_warnings,
        "requires_human_approval": suggestion.requires_human_approval,
        "incident_id": incident_id,
    }


@router.get("/supply/analysis")
async def supply_analysis(db: Session = Depends(get_db)):
    items = db.execute(select(SupplyItem)).scalars().all()
    items_dicts = [_item_to_dict(i, _calc_item_stock(i)) for i in items]
    agent = SupplyAgent()
    analysis = agent.analyze_stock_levels(items_dicts)
    return {
        "analysis": [
            {
                "supply_item_id": a.supply_item_id, "name": a.name,
                "current_stock": a.current_stock, "unit": a.unit,
                "minimum_stock": a.minimum_stock, "status": a.status,
                "percentage": a.percentage, "warning": a.warning,
            }
            for a in analysis
        ]
    }


@router.post("/supply/suggest-allocation")
async def suggest_allocation(incident_id: str = Query(...), db: Session = Depends(get_db)):
    inc = db.execute(select(Incident).where(Incident.id == incident_id)).scalars().first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    items = db.execute(select(SupplyItem)).scalars().all()
    items_dicts = [_item_to_dict(i, _calc_item_stock(i)) for i in items]
    agent = SupplyAgent()
    suggestions = agent.suggest_allocation(
        incident=_incident_to_dict(inc),
        supply_items=items_dicts,
    )
    return {
        "incident_id": incident_id,
        "incident_title": inc.title,
        "suggestions": [
            {
                "supply_item_id": s.supply_item_id,
                "supply_item_name": s.supply_item_name,
                "suggested_quantity": s.suggested_quantity,
                "unit": s.unit,
                "current_stock": s.current_stock,
                "available_after": s.available_after,
                "reasoning": s.reasoning,
                "confidence": s.confidence,
                "is_feasible": s.is_feasible,
                "warnings": s.warnings,
                "requires_human_approval": s.requires_human_approval,
            }
            for s in suggestions
        ],
    }


@router.get("/map/features")
async def map_features(db: Session = Depends(get_db)):
    features = db.execute(select(MapFeature)).scalars().all()
    features_dicts = [
        {
            "id": f.id, "feature_type": f.feature_type, "name": f.name,
            "description": f.description, "latitude": f.latitude,
            "longitude": f.longitude, "severity": f.severity,
            "status": f.status, "entity_id": f.entity_id,
            "is_synthetic": f.is_synthetic, "source_device_id": f.source_device_id,
            "updated_at": f.updated_at.isoformat() if f.updated_at else None,
        }
        for f in features
    ]
    agent = SpatialMapAgent()
    processed = agent.process_features(features_dicts)
    return {
        "features": [
            {
                "id": p.id, "feature_type": p.feature_type, "name": p.name,
                "description": p.description, "latitude": p.latitude,
                "longitude": p.longitude, "severity": p.severity,
                "status": p.status, "color": p.color, "entity_id": p.entity_id,
                "is_synthetic": p.is_synthetic, "properties": p.properties,
                "distance_from_center": p.distance_from_center,
            }
            for p in processed
        ]
    }


@router.get("/dashboard/stats", response_model=DashboardStats)
async def dashboard_stats(db: Session = Depends(get_db)):
    incidents = db.execute(select(Incident)).scalars().all()
    total_incidents = len(incidents)
    critical_incidents = sum(1 for i in incidents if i.severity == "critical")

    tasks = db.execute(select(RescueTask)).scalars().all()
    active_tasks = sum(1 for t in tasks if t.status in ("assigned", "in_progress", "unassigned"))
    completed_tasks = sum(1 for t in tasks if t.status == "completed")

    items = db.execute(select(SupplyItem)).scalars().all()
    total_supply = round(sum(_calc_item_stock(i) for i in items), 2)

    peers = db.execute(select(Peer)).scalars().all()
    online_peers = sum(1 for p in peers if p.status == "online")

    messages = db.execute(select(SyncMessage)).scalars().all()
    pending_sync = sum(1 for m in messages if m.status == "queued")

    conflicts = sum(1 for c in db.execute(select(ConflictRecord)).scalars().all() if not c.resolved)

    return DashboardStats(
        total_incidents=total_incidents,
        critical_incidents=critical_incidents,
        active_tasks=active_tasks,
        completed_tasks=completed_tasks,
        available_supply_units=total_supply,
        online_peers=online_peers,
        pending_sync=pending_sync,
        conflicts=conflicts,
        last_updated=datetime.now(timezone.utc),
    )
