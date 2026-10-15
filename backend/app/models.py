"""
ResQMesh Database Models
All SQLAlchemy ORM models for the disaster response platform
"""
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base
import uuid
import enum

def utcnow():
    return datetime.now(timezone.utc)

def gen_id():
    return str(uuid.uuid4())


class IncidentCategory(str, enum.Enum):
    FLOOD = "flood"
    FIRE = "fire"
    MEDICAL = "medical"
    BLOCKED_ROAD = "blocked_road"
    MISSING_PERSON = "missing_person"
    EARTHQUAKE = "earthquake"
    LANDSLIDE = "landslide"
    OTHER = "other"


class IncidentSeverity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class IncidentStatus(str, enum.Enum):
    REPORTED = "reported"
    VERIFIED = "verified"
    ACTIVE = "active"
    RESPONDING = "responding"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TaskStatus(str, enum.Enum):
    UNASSIGNED = "unassigned"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskPriority(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TransactionType(str, enum.Enum):
    ADDITION = "addition"
    DISTRIBUTION = "distribution"
    ADJUSTMENT = "adjustment"
    TRANSFER = "transfer"


class PeerStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    SYNCING = "syncing"
    RECONNECTING = "reconnecting"


class MessageStatus(str, enum.Enum):
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    ACKNOWLEDGED = "acknowledged"


class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(String, primary_key=True, default=gen_id)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, default="other")
    severity = Column(String(20), nullable=False, default="medium")
    status = Column(String(30), nullable=False, default="reported")
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_label = Column(String(255), nullable=True)
    
    source_device_id = Column(String(100), nullable=False, default="local")
    reported_by = Column(String(100), nullable=True)
    is_verified = Column(Boolean, default=False)
    is_synthetic = Column(Boolean, default=True)
    
    affected_count = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    
    # Version for conflict detection
    version = Column(Integer, default=1)
    origin_device = Column(String(100), nullable=True)
    
    tasks = relationship("RescueTask", back_populates="incident", lazy="selectin")


class RescueTask(Base):
    __tablename__ = "rescue_tasks"
    
    id = Column(String, primary_key=True, default=gen_id)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    status = Column(String(30), nullable=False, default="unassigned")
    priority = Column(String(20), nullable=False, default="medium")
    
    assigned_team = Column(String(100), nullable=True)
    assigned_to = Column(String(100), nullable=True)
    
    estimated_duration_hours = Column(Float, nullable=True)
    
    ai_suggested = Column(Boolean, default=False)
    ai_reasoning = Column(Text, nullable=True)
    human_approved = Column(Boolean, default=False)
    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    version = Column(Integer, default=1)
    source_device_id = Column(String(100), nullable=False, default="local")
    
    incident = relationship("Incident", back_populates="tasks")


class SupplyItem(Base):
    __tablename__ = "supply_items"
    
    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    unit = Column(String(50), nullable=False, default="units")
    location_id = Column(String(100), nullable=True)
    location_label = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    minimum_stock = Column(Float, default=0)
    
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    
    transactions = relationship("InventoryTransaction", back_populates="supply_item", lazy="selectin")


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"
    
    id = Column(String, primary_key=True, default=gen_id)
    supply_item_id = Column(String, ForeignKey("supply_items.id"), nullable=False)
    transaction_type = Column(String(30), nullable=False)
    quantity = Column(Float, nullable=False)
    
    notes = Column(Text, nullable=True)
    performed_by = Column(String(100), nullable=True)
    destination = Column(String(255), nullable=True)
    incident_id = Column(String, nullable=True)
    
    ai_suggested = Column(Boolean, default=False)
    human_approved = Column(Boolean, default=False)
    
    idempotency_key = Column(String(255), unique=True, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utcnow)
    device_id = Column(String(100), nullable=False, default="local")
    
    supply_item = relationship("SupplyItem", back_populates="transactions")


class Peer(Base):
    __tablename__ = "peers"
    
    id = Column(String, primary_key=True, default=gen_id)
    device_id = Column(String(100), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    status = Column(String(30), nullable=False, default="offline")
    
    ip_address = Column(String(100), nullable=True)
    port = Column(Integer, nullable=True)
    
    last_seen = Column(DateTime(timezone=True), nullable=True)
    last_sync = Column(DateTime(timezone=True), nullable=True)
    
    is_simulated = Column(Boolean, default=True)
    description = Column(String(255), nullable=True)
    
    pending_messages = Column(Integer, default=0)
    messages_sent = Column(Integer, default=0)
    messages_received = Column(Integer, default=0)
    battery_level = Column(Integer, default=85)
    sync_status = Column(String(50), default="synced")
    
    created_at = Column(DateTime(timezone=True), default=utcnow)


class SyncMessage(Base):
    __tablename__ = "sync_messages"
    
    id = Column(String, primary_key=True, default=gen_id)
    message_id = Column(String(255), unique=True, nullable=False)
    
    source_device_id = Column(String(100), nullable=False)
    destination_device_id = Column(String(100), nullable=True)
    
    payload_type = Column(String(100), nullable=False)
    payload = Column(Text, nullable=False)
    
    priority = Column(Integer, default=5)
    status = Column(String(30), nullable=False, default="queued")
    
    hop_count = Column(Integer, default=0)
    max_hops = Column(Integer, default=5)
    via_device_ids = Column(Text, nullable=True)
    
    delivery_attempts = Column(Integer, default=0)
    last_attempt_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    
    schema_version = Column(String(20), default="1.0")
    checksum = Column(String(64), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utcnow)
    expires_at = Column(DateTime(timezone=True), nullable=True)


class ConflictRecord(Base):
    __tablename__ = "conflict_records"
    
    id = Column(String, primary_key=True, default=gen_id)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(255), nullable=False)
    
    local_version = Column(Text, nullable=False)
    remote_version = Column(Text, nullable=False)
    
    conflict_type = Column(String(100), nullable=False)
    detected_at = Column(DateTime(timezone=True), default=utcnow)
    
    resolution = Column(String(100), nullable=True)
    resolved_by = Column(String(100), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved = Column(Boolean, default=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=gen_id)
    action = Column(String(255), nullable=False)
    entity_type = Column(String(100), nullable=True)
    entity_id = Column(String(255), nullable=True)
    
    performed_by = Column(String(100), nullable=False, default="system")
    device_id = Column(String(100), nullable=False, default="local")
    
    details = Column(Text, nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    
    ip_address = Column(String(100), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utcnow)


class MapFeature(Base):
    __tablename__ = "map_features"
    
    id = Column(String, primary_key=True, default=gen_id)
    feature_type = Column(String(50), nullable=False)  # incident, shelter, depot, blocked_road, team
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    severity = Column(String(20), nullable=True)
    status = Column(String(30), nullable=True)
    
    entity_id = Column(String(255), nullable=True)
    
    is_synthetic = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    source_device_id = Column(String(100), nullable=False, default="local")
