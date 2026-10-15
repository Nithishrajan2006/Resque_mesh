"""
ResQMesh Pydantic Schemas
Request/Response models for the API
"""
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum
import re


class IncidentCategory(str, Enum):
    FLOOD = "flood"
    FIRE = "fire"
    MEDICAL = "medical"
    BLOCKED_ROAD = "blocked_road"
    MISSING_PERSON = "missing_person"
    EARTHQUAKE = "earthquake"
    LANDSLIDE = "landslide"
    OTHER = "other"


class IncidentSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class IncidentStatus(str, Enum):
    REPORTED = "reported"
    VERIFIED = "verified"
    ACTIVE = "active"
    RESPONDING = "responding"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TaskStatus(str, Enum):
    UNASSIGNED = "unassigned"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TransactionType(str, Enum):
    ADDITION = "addition"
    DISTRIBUTION = "distribution"
    ADJUSTMENT = "adjustment"
    TRANSFER = "transfer"


# --- Incident Schemas ---

class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    category: IncidentCategory = IncidentCategory.OTHER
    severity: IncidentSeverity = IncidentSeverity.MEDIUM
    status: IncidentStatus = IncidentStatus.REPORTED
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    location_label: Optional[str] = Field(None, max_length=255)
    source_device_id: str = "local"
    reported_by: Optional[str] = None
    affected_count: int = Field(0, ge=0)
    notes: Optional[str] = None
    is_synthetic: bool = True


class IncidentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    category: Optional[IncidentCategory] = None
    severity: Optional[IncidentSeverity] = None
    status: Optional[IncidentStatus] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    location_label: Optional[str] = None
    is_verified: Optional[bool] = None
    affected_count: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None


class RescueTaskOut(BaseModel):
    id: str
    incident_id: str
    title: str
    description: Optional[str]
    status: str
    priority: str
    assigned_team: Optional[str]
    assigned_to: Optional[str]
    ai_suggested: bool
    ai_reasoning: Optional[str]
    human_approved: bool
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    estimated_duration_hours: Optional[float]
    source_device_id: str
    version: int

    model_config = ConfigDict(from_attributes=True)


class IncidentOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    category: str
    severity: str
    status: str
    latitude: Optional[float]
    longitude: Optional[float]
    location_label: Optional[str]
    source_device_id: str
    reported_by: Optional[str]
    is_verified: bool
    is_synthetic: bool
    affected_count: int
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    version: int
    tasks: List[RescueTaskOut] = []

    model_config = ConfigDict(from_attributes=True)


# --- Task Schemas ---

class TaskCreate(BaseModel):
    incident_id: str
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    assigned_team: Optional[str] = None
    assigned_to: Optional[str] = None
    estimated_duration_hours: Optional[float] = Field(None, gt=0)
    ai_suggested: bool = False
    ai_reasoning: Optional[str] = None
    source_device_id: str = "local"


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assigned_team: Optional[str] = None
    assigned_to: Optional[str] = None
    estimated_duration_hours: Optional[float] = None


class TaskApproval(BaseModel):
    approved: bool
    approved_by: str = Field(..., min_length=2)
    notes: Optional[str] = None


# --- Inventory Schemas ---

class SupplyItemCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    category: str
    unit: str = "units"
    location_id: Optional[str] = None
    location_label: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    minimum_stock: float = Field(0, ge=0)


class SupplyItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    location_label: Optional[str] = None
    minimum_stock: Optional[float] = None


class TransactionCreate(BaseModel):
    supply_item_id: str
    transaction_type: TransactionType
    quantity: float
    notes: Optional[str] = None
    performed_by: Optional[str] = None
    destination: Optional[str] = None
    incident_id: Optional[str] = None
    ai_suggested: bool = False
    human_approved: bool = False
    idempotency_key: Optional[str] = None
    device_id: str = "local"

    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v):
        if v == 0:
            raise ValueError("Quantity cannot be zero")
        return v


class TransactionOut(BaseModel):
    id: str
    supply_item_id: str
    transaction_type: str
    quantity: float
    notes: Optional[str]
    performed_by: Optional[str]
    destination: Optional[str]
    incident_id: Optional[str]
    ai_suggested: bool
    human_approved: bool
    idempotency_key: Optional[str]
    created_at: datetime
    device_id: str

    model_config = ConfigDict(from_attributes=True)


class SupplyItemOut(BaseModel):
    id: str
    name: str
    category: str
    unit: str
    location_id: Optional[str]
    location_label: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    minimum_stock: float
    current_stock: float = 0
    created_at: datetime
    updated_at: datetime
    transactions: List[TransactionOut] = []

    model_config = ConfigDict(from_attributes=True)


# --- Peer Schemas ---

class PeerOut(BaseModel):
    id: str
    device_id: str
    name: str
    status: str
    ip_address: Optional[str]
    port: Optional[int]
    last_seen: Optional[datetime]
    last_sync: Optional[datetime]
    is_simulated: bool
    description: Optional[str]
    pending_messages: int
    messages_sent: int
    messages_received: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PeerCreate(BaseModel):
    device_id: str
    name: str
    ip_address: Optional[str] = None
    port: Optional[int] = None
    is_simulated: bool = True
    description: Optional[str] = None


# --- Sync Message Schemas ---

class SyncMessageOut(BaseModel):
    id: str
    message_id: str
    source_device_id: str
    destination_device_id: Optional[str]
    payload_type: str
    priority: int
    status: str
    hop_count: int
    delivery_attempts: int
    last_attempt_at: Optional[datetime]
    delivered_at: Optional[datetime]
    acknowledged_at: Optional[datetime]
    created_at: datetime
    schema_version: str

    model_config = ConfigDict(from_attributes=True)


# --- Conflict Schema ---

class ConflictOut(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    local_version: str
    remote_version: str
    conflict_type: str
    detected_at: datetime
    resolution: Optional[str]
    resolved_by: Optional[str]
    resolved_at: Optional[datetime]
    resolved: bool

    model_config = ConfigDict(from_attributes=True)


class ConflictResolve(BaseModel):
    resolution: str
    resolved_by: str


# --- Audit Schema ---

class AuditLogOut(BaseModel):
    id: str
    action: str
    entity_type: Optional[str]
    entity_id: Optional[str]
    performed_by: str
    device_id: str
    details: Optional[str]
    old_value: Optional[str]
    new_value: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Map Feature Schema ---

class MapFeatureOut(BaseModel):
    id: str
    feature_type: str
    name: str
    description: Optional[str]
    latitude: float
    longitude: float
    severity: Optional[str]
    status: Optional[str]
    entity_id: Optional[str]
    is_synthetic: bool
    created_at: datetime
    updated_at: datetime
    source_device_id: str

    model_config = ConfigDict(from_attributes=True)


# --- Agent Schemas ---

class AgentSuggestion(BaseModel):
    agent: str
    suggestion_type: str
    title: str
    reasoning: str
    confidence: float = Field(..., ge=0, le=1)
    data: dict = {}
    requires_human_approval: bool = True


# --- Dashboard Stats ---

class DashboardStats(BaseModel):
    total_incidents: int
    critical_incidents: int
    active_tasks: int
    completed_tasks: int
    available_supply_units: float
    online_peers: int
    pending_sync: int
    conflicts: int
    last_updated: datetime
