"""
Inventory Router — Supply management with transaction-based stock calculation
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from typing import Optional, List
from datetime import datetime, timezone
import uuid, logging

from app.database import get_db
from app.models import SupplyItem, InventoryTransaction
from app.schemas import (
    SupplyItemCreate, SupplyItemUpdate, SupplyItemOut,
    TransactionCreate, TransactionOut
)
from app.websocket_manager import websocket_manager
from app.audit_service import log_action

logger = logging.getLogger(__name__)
router = APIRouter()


def _calc_stock(transactions) -> float:
    total = 0.0
    for t in transactions:
        if t.transaction_type == "addition":
            total += abs(t.quantity)
        elif t.transaction_type in ("distribution", "transfer"):
            total -= abs(t.quantity)
        elif t.transaction_type == "adjustment":
            total += t.quantity
    return round(total, 2)


def _item_to_out(item: SupplyItem) -> dict:
    stock = _calc_stock(item.transactions)
    return {
        "id": item.id, "name": item.name, "category": item.category,
        "unit": item.unit, "location_id": item.location_id,
        "location_label": item.location_label, "latitude": item.latitude,
        "longitude": item.longitude, "minimum_stock": item.minimum_stock,
        "current_stock": stock, "created_at": item.created_at,
        "updated_at": item.updated_at,
        "transactions": [
            {
                "id": t.id, "supply_item_id": t.supply_item_id,
                "transaction_type": t.transaction_type, "quantity": t.quantity,
                "notes": t.notes, "performed_by": t.performed_by,
                "destination": t.destination, "incident_id": t.incident_id,
                "ai_suggested": t.ai_suggested, "human_approved": t.human_approved,
                "idempotency_key": t.idempotency_key,
                "created_at": t.created_at, "device_id": t.device_id,
            }
            for t in item.transactions
        ]
    }


@router.get("/items", response_model=List[SupplyItemOut])
async def list_items(db: Session = Depends(get_db)):
    items = db.execute(select(SupplyItem).order_by(SupplyItem.name)).scalars().all()
    return [_item_to_out(i) for i in items]


@router.post("/items", response_model=SupplyItemOut, status_code=201)
async def create_item(data: SupplyItemCreate, db: Session = Depends(get_db)):
    item = SupplyItem(
        id=str(uuid.uuid4()),
        name=data.name, category=data.category, unit=data.unit,
        location_id=data.location_id, location_label=data.location_label,
        latitude=data.latitude, longitude=data.longitude,
        minimum_stock=data.minimum_stock,
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    log_action(db, "CREATE_SUPPLY_ITEM", "supply_item", item.id, new_value={"name": item.name})
    await websocket_manager.broadcast_event("supply_item_created", {"id": item.id, "name": item.name})
    return _item_to_out(item)


@router.get("/items/{item_id}", response_model=SupplyItemOut)
async def get_item(item_id: str, db: Session = Depends(get_db)):
    item = db.execute(select(SupplyItem).where(SupplyItem.id == item_id)).scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Supply item not found")
    return _item_to_out(item)


@router.put("/items/{item_id}", response_model=SupplyItemOut)
async def update_item(item_id: str, data: SupplyItemUpdate, db: Session = Depends(get_db)):
    item = db.execute(select(SupplyItem).where(SupplyItem.id == item_id)).scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Supply item not found")
    for field_name, value in data.model_dump(exclude_none=True).items():
        setattr(item, field_name, value)
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return _item_to_out(item)


@router.get("/items/{item_id}/transactions", response_model=List[TransactionOut])
async def item_transactions(item_id: str, db: Session = Depends(get_db)):
    txns = db.execute(
        select(InventoryTransaction)
        .where(InventoryTransaction.supply_item_id == item_id)
        .order_by(desc(InventoryTransaction.created_at))
    ).scalars().all()
    return txns


@router.get("/transactions", response_model=List[TransactionOut])
async def list_transactions(
    supply_item_id: Optional[str] = None,
    transaction_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    stmt = select(InventoryTransaction).order_by(desc(InventoryTransaction.created_at))
    if supply_item_id:
        stmt = stmt.where(InventoryTransaction.supply_item_id == supply_item_id)
    if transaction_type:
        stmt = stmt.where(InventoryTransaction.transaction_type == transaction_type)
    return db.execute(stmt).scalars().all()


@router.post("/transactions", response_model=TransactionOut, status_code=201)
async def create_transaction(data: TransactionCreate, db: Session = Depends(get_db)):
    # Idempotency check
    if data.idempotency_key:
        existing = db.execute(
            select(InventoryTransaction).where(
                InventoryTransaction.idempotency_key == data.idempotency_key
            )
        ).scalars().first()
        if existing:
            return existing

    # Get item
    item = db.execute(select(SupplyItem).where(SupplyItem.id == data.supply_item_id)).scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Supply item not found")

    # Stock check for distributions
    txn_type = data.transaction_type.value if hasattr(data.transaction_type, 'value') else data.transaction_type
    if txn_type in ("distribution", "transfer"):
        current = _calc_stock(item.transactions)
        if current - abs(data.quantity) < 0:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock: {current:.1f} {item.unit} available, {abs(data.quantity):.1f} requested"
            )

    txn = InventoryTransaction(
        id=str(uuid.uuid4()),
        supply_item_id=data.supply_item_id,
        transaction_type=txn_type,
        quantity=data.quantity,
        notes=data.notes,
        performed_by=data.performed_by,
        destination=data.destination,
        incident_id=data.incident_id,
        ai_suggested=data.ai_suggested,
        human_approved=data.human_approved,
        idempotency_key=data.idempotency_key,
        device_id=data.device_id,
        created_at=datetime.now(timezone.utc),
    )
    db.add(txn)
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(txn)

    log_action(db, "CREATE_TRANSACTION", "transaction", txn.id,
               new_value={"type": txn_type, "quantity": data.quantity, "item": item.name})
    await websocket_manager.broadcast_event("inventory_updated", {
        "item_id": item.id, "item_name": item.name, "transaction_type": txn_type
    })
    return txn


@router.get("/summary")
async def inventory_summary(db: Session = Depends(get_db)):
    items = db.execute(select(SupplyItem)).scalars().all()
    summary = []
    low_stock_count = 0
    for item in items:
        stock = _calc_stock(item.transactions)
        is_low = item.minimum_stock > 0 and stock < item.minimum_stock
        if is_low:
            low_stock_count += 1
        summary.append({
            "id": item.id, "name": item.name, "category": item.category,
            "unit": item.unit, "current_stock": stock,
            "minimum_stock": item.minimum_stock, "is_low": is_low,
            "location_label": item.location_label,
        })
    return {
        "total_items": len(items),
        "low_stock_count": low_stock_count,
        "items": summary
    }
