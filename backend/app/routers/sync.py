"""
Sync Router — Message sync center with conflict resolution
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from typing import List, Optional
from datetime import datetime, timezone
import logging

from app.database import get_db
from app.models import SyncMessage, ConflictRecord, Peer
from app.schemas import SyncMessageOut, ConflictOut, ConflictResolve
from app.websocket_manager import websocket_manager
from app.audit_service import log_action

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/messages", response_model=List[SyncMessageOut])
async def list_messages(
    status: Optional[str] = None,
    source_device: Optional[str] = None,
    destination_device: Optional[str] = None,
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
):
    stmt = select(SyncMessage).order_by(desc(SyncMessage.created_at)).limit(limit)
    if status:
        stmt = stmt.where(SyncMessage.status == status)
    if source_device:
        stmt = stmt.where(SyncMessage.source_device_id == source_device)
    if destination_device:
        stmt = stmt.where(SyncMessage.destination_device_id == destination_device)
    return db.execute(stmt).scalars().all()


@router.get("/messages/{msg_id}", response_model=SyncMessageOut)
async def get_message(msg_id: str, db: Session = Depends(get_db)):
    msg = db.execute(select(SyncMessage).where(SyncMessage.id == msg_id)).scalars().first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    return msg


@router.post("/messages/retry")
async def retry_failed_messages(db: Session = Depends(get_db)):
    messages = db.execute(select(SyncMessage).where(SyncMessage.status == "failed")).scalars().all()
    retried = []
    for msg in messages:
        msg.status = "queued"
        msg.delivery_attempts += 1
        msg.last_attempt_at = datetime.now(timezone.utc)
        retried.append(msg.message_id)
    db.commit()
    return {"retried": len(retried), "message_ids": retried}


@router.post("/process")
async def process_queued_messages(db: Session = Depends(get_db)):
    messages = db.execute(select(SyncMessage).where(SyncMessage.status == "queued")).scalars().all()
    peers = {p.device_id: p for p in db.execute(select(Peer)).scalars().all()}

    sent = []
    kept_queued = []

    for msg in messages:
        msg.delivery_attempts += 1
        msg.last_attempt_at = datetime.now(timezone.utc)

        dest_peer = peers.get(msg.destination_device_id)
        if dest_peer and dest_peer.status == "online":
            msg.status = "delivered"
            msg.delivered_at = datetime.now(timezone.utc)
            dest_peer.messages_received += 1
            dest_peer.pending_messages = max(0, dest_peer.pending_messages - 1)
            sent.append(msg.message_id)
        else:
            if msg.delivery_attempts >= 5:
                msg.status = "failed"
            kept_queued.append(msg.message_id)

    db.commit()
    await websocket_manager.broadcast_event("sync_processed", {
        "delivered": len(sent), "still_queued": len(kept_queued)
    })
    return {"delivered": len(sent), "still_queued": len(kept_queued)}


@router.get("/conflicts", response_model=List[ConflictOut])
async def list_conflicts(
    resolved: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    stmt = select(ConflictRecord).order_by(desc(ConflictRecord.detected_at))
    if resolved is not None:
        stmt = stmt.where(ConflictRecord.resolved == resolved)
    return db.execute(stmt).scalars().all()


@router.get("/conflicts/{conflict_id}", response_model=ConflictOut)
async def get_conflict(conflict_id: str, db: Session = Depends(get_db)):
    conflict = db.execute(select(ConflictRecord).where(ConflictRecord.id == conflict_id)).scalars().first()
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")
    return conflict


@router.post("/conflicts/{conflict_id}/resolve", response_model=ConflictOut)
async def resolve_conflict(conflict_id: str, data: ConflictResolve, db: Session = Depends(get_db)):
    conflict = db.execute(select(ConflictRecord).where(ConflictRecord.id == conflict_id)).scalars().first()
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")
    if conflict.resolved:
        raise HTTPException(status_code=400, detail="Conflict already resolved")

    conflict.resolution = data.resolution
    conflict.resolved_by = data.resolved_by
    conflict.resolved_at = datetime.now(timezone.utc)
    conflict.resolved = True
    db.commit()
    db.refresh(conflict)

    log_action(db, "RESOLVE_CONFLICT", "conflict", conflict_id,
               performed_by=data.resolved_by,
               details=f"Resolution: {data.resolution}")
    await websocket_manager.broadcast_event("conflict_resolved", {"conflict_id": conflict_id})
    return conflict


@router.get("/stats")
async def sync_stats(db: Session = Depends(get_db)):
    messages = db.execute(select(SyncMessage)).scalars().all()
    by_status = {}
    for msg in messages:
        by_status[msg.status] = by_status.get(msg.status, 0) + 1

    conflicts = db.execute(select(ConflictRecord)).scalars().all()
    unresolved = sum(1 for c in conflicts if not c.resolved)

    return {
        "total_messages": len(messages),
        "by_status": by_status,
        "total_conflicts": len(conflicts),
        "unresolved_conflicts": unresolved,
        "queued": by_status.get("queued", 0),
        "delivered": by_status.get("delivered", 0),
        "failed": by_status.get("failed", 0),
    }
