"""
Peers Router — Peer network simulation and management
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime, timezone
import uuid, hashlib, logging

from app.database import get_db
from app.models import Peer, SyncMessage
from app.schemas import PeerOut, PeerCreate
from app.websocket_manager import websocket_manager
from app.audit_service import log_action

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=List[PeerOut])
async def list_peers(db: Session = Depends(get_db)):
    return db.execute(select(Peer).order_by(Peer.name)).scalars().all()


@router.post("/", response_model=PeerOut, status_code=201)
async def create_peer(data: PeerCreate, db: Session = Depends(get_db)):
    existing = db.execute(select(Peer).where(Peer.device_id == data.device_id)).scalars().first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Peer '{data.device_id}' already exists")

    peer = Peer(
        id=str(uuid.uuid4()),
        device_id=data.device_id,
        name=data.name,
        status="offline",
        ip_address=data.ip_address,
        port=data.port,
        is_simulated=data.is_simulated,
        description=data.description,
        created_at=datetime.now(timezone.utc),
    )
    db.add(peer)
    db.commit()
    db.refresh(peer)
    await websocket_manager.broadcast_event("peer_registered", {"device_id": peer.device_id, "name": peer.name})
    return peer


@router.get("/network/status")
async def network_status(db: Session = Depends(get_db)):
    peers = db.execute(select(Peer)).scalars().all()
    online = [p for p in peers if p.status == "online"]
    messages = db.execute(select(SyncMessage)).scalars().all()
    queued = [m for m in messages if m.status == "queued"]
    failed = [m for m in messages if m.status == "failed"]
    return {
        "total_peers": len(peers),
        "online_peers": len(online),
        "offline_peers": len(peers) - len(online),
        "simulated_peers": sum(1 for p in peers if p.is_simulated),
        "queued_messages": len(queued),
        "failed_messages": len(failed),
        "peers": [{"device_id": p.device_id, "name": p.name, "status": p.status} for p in peers],
        "network_health": "degraded" if len(online) < len(peers) / 2 else "healthy",
    }


@router.get("/{device_id}", response_model=PeerOut)
async def get_peer(device_id: str, db: Session = Depends(get_db)):
    peer = db.execute(select(Peer).where(Peer.device_id == device_id)).scalars().first()
    if not peer:
        raise HTTPException(status_code=404, detail="Peer not found")
    return peer


@router.post("/{device_id}/connect", response_model=PeerOut)
async def connect_peer(device_id: str, db: Session = Depends(get_db)):
    peer = db.execute(select(Peer).where(Peer.device_id == device_id)).scalars().first()
    if not peer:
        raise HTTPException(status_code=404, detail="Peer not found")
    peer.status = "online"
    peer.last_seen = datetime.now(timezone.utc)
    db.commit()
    db.refresh(peer)
    log_action(db, "PEER_CONNECT", "peer", peer.id, performed_by="simulator")
    await websocket_manager.broadcast_event("peer_connected", {"device_id": device_id, "name": peer.name})
    return peer


@router.post("/{device_id}/disconnect", response_model=PeerOut)
async def disconnect_peer(device_id: str, db: Session = Depends(get_db)):
    peer = db.execute(select(Peer).where(Peer.device_id == device_id)).scalars().first()
    if not peer:
        raise HTTPException(status_code=404, detail="Peer not found")
    peer.status = "offline"
    db.commit()
    db.refresh(peer)
    log_action(db, "PEER_DISCONNECT", "peer", peer.id, performed_by="simulator")
    await websocket_manager.broadcast_event("peer_disconnected", {"device_id": device_id, "name": peer.name})
    return peer


@router.post("/{device_id}/sync")
async def sync_peer(device_id: str, db: Session = Depends(get_db)):
    """Deliver queued messages to a peer that just reconnected."""
    peer = db.execute(select(Peer).where(Peer.device_id == device_id)).scalars().first()
    if not peer:
        raise HTTPException(status_code=404, detail="Peer not found")

    messages = db.execute(
        select(SyncMessage).where(
            SyncMessage.destination_device_id == device_id,
            SyncMessage.status.in_(["queued", "sent"])
        )
    ).scalars().all()

    delivered = []
    for msg in messages:
        msg.status = "delivered"
        msg.delivered_at = datetime.now(timezone.utc)
        msg.delivery_attempts += 1
        delivered.append(msg.message_id)

    peer.status = "online"
    peer.last_seen = datetime.now(timezone.utc)
    peer.last_sync = datetime.now(timezone.utc)
    peer.messages_received += len(delivered)
    peer.pending_messages = 0

    db.commit()
    log_action(db, "PEER_SYNC", "peer", peer.id, details=f"Delivered {len(delivered)} queued messages")
    await websocket_manager.broadcast_event("peer_synced", {
        "device_id": device_id, "messages_delivered": len(delivered)
    })
    return {"device_id": device_id, "messages_delivered": len(delivered), "message_ids": delivered}


@router.post("/message/send")
async def send_message(
    source_device_id: str,
    destination_device_id: str,
    payload_type: str,
    payload: str,
    priority: int = 5,
    db: Session = Depends(get_db),
):
    msg_id = str(uuid.uuid4())
    checksum = hashlib.sha256(payload.encode()).hexdigest()

    dest_peer = db.execute(select(Peer).where(Peer.device_id == destination_device_id)).scalars().first()
    initial_status = "sent" if dest_peer and dest_peer.status == "online" else "queued"

    msg = SyncMessage(
        id=str(uuid.uuid4()),
        message_id=msg_id,
        source_device_id=source_device_id,
        destination_device_id=destination_device_id,
        payload_type=payload_type,
        payload=payload,
        priority=priority,
        status=initial_status,
        created_at=datetime.now(timezone.utc),
        checksum=checksum,
        schema_version="1.0",
    )
    db.add(msg)

    src_peer = db.execute(select(Peer).where(Peer.device_id == source_device_id)).scalars().first()
    if src_peer:
        src_peer.messages_sent += 1

    if dest_peer and initial_status == "queued":
        dest_peer.pending_messages += 1

    db.commit()

    await websocket_manager.broadcast_event("message_queued", {
        "message_id": msg_id,
        "source": source_device_id,
        "destination": destination_device_id,
        "status": initial_status,
    })

    return {
        "message_id": msg_id,
        "status": initial_status,
        "destination": destination_device_id,
    }
