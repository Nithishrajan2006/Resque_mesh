"""
ResQMesh Audit Service
Records all important user actions and data changes
"""
import json
import logging
import uuid
from typing import Optional
from sqlalchemy.orm import Session
from app.models import AuditLog

logger = logging.getLogger(__name__)


def log_action(
    db: Session,
    action: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    performed_by: str = "system",
    device_id: str = "local",
    details: Optional[str] = None,
    old_value: Optional[dict] = None,
    new_value: Optional[dict] = None,
):
    """Record an action in the audit log"""
    try:
        log = AuditLog(
            id=str(uuid.uuid4()),
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            performed_by=performed_by,
            device_id=device_id,
            details=details,
            old_value=json.dumps(old_value) if old_value else None,
            new_value=json.dumps(new_value) if new_value else None,
        )
        db.add(log)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to write audit log: {e}")
