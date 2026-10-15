"""Audit log router"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import logging

from app.database import get_db
from app.models import AuditLog
from app.schemas import AuditLogOut

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=List[AuditLogOut])
async def list_audit_logs(
    entity_type: Optional[str] = None,
    performed_by: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(100, le=1000),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    stmt = select(AuditLog).order_by(desc(AuditLog.created_at)).offset(offset).limit(limit)
    if entity_type:
        stmt = stmt.where(AuditLog.entity_type == entity_type)
    if performed_by:
        stmt = stmt.where(AuditLog.performed_by == performed_by)
    if action:
        stmt = stmt.where(AuditLog.action.ilike(f"%{action}%"))
    return db.execute(stmt).scalars().all()


@router.get("/{log_id}", response_model=AuditLogOut)
async def get_audit_log(log_id: str, db: Session = Depends(get_db)):
    log = db.execute(select(AuditLog).where(AuditLog.id == log_id)).scalars().first()
    if not log:
        raise HTTPException(status_code=404, detail="Audit log not found")
    return log


@router.get("/actions/summary")
async def action_summary(db: Session = Depends(get_db)):
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    logs = db.execute(select(AuditLog).where(AuditLog.created_at >= since)).scalars().all()
    summary = {}
    for log in logs:
        summary[log.action] = summary.get(log.action, 0) + 1
    return {"since": since.isoformat(), "actions": summary, "total": len(logs)}
