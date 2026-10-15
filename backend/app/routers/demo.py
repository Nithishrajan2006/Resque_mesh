"""
Demo Router — Loads and manages the Millbrook Valley disaster scenario
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import delete, select
from typing import List
from datetime import datetime, timezone, timedelta
import uuid, json, hashlib, logging

from app.database import get_db
from app.models import (
    Incident, RescueTask, SupplyItem, InventoryTransaction,
    Peer, SyncMessage, AuditLog, MapFeature, ConflictRecord
)
from app.websocket_manager import websocket_manager

logger = logging.getLogger(__name__)
router = APIRouter()

BASE_LAT = 40.7128
BASE_LON = -74.0060


def uid():
    return str(uuid.uuid4())


def now():
    return datetime.now(timezone.utc)


def hours_ago(h):
    return now() - timedelta(hours=h)


def msg_id():
    return f"msg-{uuid.uuid4().hex[:12]}"


DEMO_INCIDENTS = [
    {
        "title": "Critical Flash Flood — Riverside District",
        "description": "Rapid flooding in the Riverside District. Multiple families trapped on rooftops. Water levels rising at approximately 30cm/hour. 3 vehicles submerged.",
        "category": "flood", "severity": "critical", "status": "active",
        "latitude": BASE_LAT + 0.008, "longitude": BASE_LON - 0.005,
        "location_label": "Riverside District, Millbrook Valley",
        "source_device_id": "rescue-alpha", "reported_by": "Sgt. Rivera",
        "affected_count": 35, "is_synthetic": True, "is_verified": True,
    },
    {
        "title": "Structure Fire — 42 Maple Avenue",
        "description": "Two-story residential structure fully engulfed. Possible occupants still inside. Adjacent structures at risk.",
        "category": "fire", "severity": "high", "status": "responding",
        "latitude": BASE_LAT + 0.014, "longitude": BASE_LON + 0.008,
        "location_label": "42 Maple Avenue, North Millbrook",
        "source_device_id": "rescue-bravo", "reported_by": "Cpl. James",
        "affected_count": 8, "is_synthetic": True, "is_verified": True,
    },
    {
        "title": "Medical Emergency — Valley Road Shelter",
        "description": "Multiple elderly evacuees at Valley Road shelter showing symptoms of hypothermia and dehydration. Medical team requested urgently.",
        "category": "medical", "severity": "high", "status": "active",
        "latitude": BASE_LAT - 0.006, "longitude": BASE_LON + 0.012,
        "location_label": "Valley Road Emergency Shelter",
        "source_device_id": "supply-unit", "reported_by": "Nurse Chen",
        "affected_count": 18, "is_synthetic": True, "is_verified": True,
    },
    {
        "title": "Road Washout — Route 7 Northbound",
        "description": "Route 7 northbound is completely washed out at mile marker 12. Supply convoy rerouting needed. Alternative: Route 12 via Westside.",
        "category": "blocked_road", "severity": "medium", "status": "verified",
        "latitude": BASE_LAT - 0.008, "longitude": BASE_LON + 0.015,
        "location_label": "Route 7, Mile Marker 12",
        "source_device_id": "rescue-alpha", "reported_by": "Lt. Park",
        "affected_count": 0, "is_synthetic": True, "is_verified": True,
    },
    {
        "title": "Missing Person — Elderly Resident",
        "description": "75-year-old male, last seen near Elm Street before flood waters rose. Family reports he may have tried to reach the community center on foot.",
        "category": "missing_person", "severity": "high", "status": "active",
        "latitude": BASE_LAT + 0.018, "longitude": BASE_LON - 0.009,
        "location_label": "Elm Street area, East Millbrook",
        "source_device_id": "rescue-bravo", "reported_by": "Family Member",
        "affected_count": 1, "is_synthetic": True, "is_verified": False,
    },
]

DEMO_PEERS = [
    {
        "device_id": "RESCUE-A",
        "name": "Rescue Alpha (Search & Rescue)",
        "status": "online",
        "is_simulated": True,
        "description": "Tactical water rescue & extraction unit — North Sector",
        "messages_sent": 28,
        "messages_received": 19,
        "battery_level": 94,
        "sync_status": "synced"
    },
    {
        "device_id": "RESCUE-B",
        "name": "Rescue Bravo (Mobile Paramedics)",
        "status": "online",
        "is_simulated": True,
        "description": "Paramedic triage & ambulance unit — South Sector",
        "messages_sent": 16,
        "messages_received": 14,
        "battery_level": 82,
        "sync_status": "synced"
    },
    {
        "device_id": "DRONE-01",
        "name": "Drone Recon-01 (Aerial Mesh)",
        "status": "online",
        "is_simulated": True,
        "description": "Autonomous aerial mesh relay & thermal sensor drone",
        "messages_sent": 42,
        "messages_received": 8,
        "battery_level": 68,
        "sync_status": "synced"
    },
    {
        "device_id": "SUPPLY-C",
        "name": "Supply Depot Charlie",
        "status": "online",
        "is_simulated": True,
        "description": "Regional emergency supply staging depot & dispensary",
        "messages_sent": 11,
        "messages_received": 31,
        "battery_level": 99,
        "sync_status": "synced"
    },
]

DEMO_MAP_FEATURES = [
    {"feature_type": "shelter", "name": "Millbrook Community Center", "description": "Primary shelter — capacity 250", "latitude": BASE_LAT + 0.015, "longitude": BASE_LON + 0.010, "status": "active"},
    {"feature_type": "shelter", "name": "Westside High School Gym", "description": "Secondary shelter — capacity 150", "latitude": BASE_LAT - 0.012, "longitude": BASE_LON - 0.018, "status": "active"},
    {"feature_type": "depot", "name": "Central Supply Depot", "description": "Main supply distribution point", "latitude": BASE_LAT + 0.005, "longitude": BASE_LON - 0.012, "status": "active"},
    {"feature_type": "depot", "name": "North Medical Cache", "description": "Medical supply cache", "latitude": BASE_LAT + 0.022, "longitude": BASE_LON + 0.005, "status": "active"},
    {"feature_type": "blocked_road", "name": "Route 7 Washout", "description": "Impassable — use Route 12", "latitude": BASE_LAT - 0.008, "longitude": BASE_LON + 0.015, "severity": "high", "status": "active"},
    {"feature_type": "blocked_road", "name": "Bridge Street Closure", "description": "Structural damage — closed", "latitude": BASE_LAT + 0.003, "longitude": BASE_LON + 0.022, "severity": "critical", "status": "active"},
    {"feature_type": "team", "name": "Rescue Alpha Position", "description": "Currently at north flood zone", "latitude": BASE_LAT + 0.009, "longitude": BASE_LON - 0.005, "status": "active"},
    {"feature_type": "team", "name": "Rescue Bravo Position", "description": "Staged at community center", "latitude": BASE_LAT + 0.016, "longitude": BASE_LON + 0.011, "status": "active"},
    {"feature_type": "drone", "name": "Drone Recon-01 Aerial Position", "description": "High-altitude relay & thermal reconnaissance over sector", "latitude": BASE_LAT + 0.011, "longitude": BASE_LON + 0.002, "status": "active"},
]

DEMO_SUPPLIES = [
    {"name": "Drinking Water", "category": "water", "unit": "liters", "minimum_stock": 1000, "location_label": "Central Depot", "initial_stock": 5000},
    {"name": "Emergency Food Packs", "category": "food", "unit": "meals", "minimum_stock": 500, "location_label": "Central Depot", "initial_stock": 2000},
    {"name": "Medical Kits", "category": "medical", "unit": "kits", "minimum_stock": 50, "location_label": "North Medical Cache", "initial_stock": 150},
    {"name": "Emergency Blankets", "category": "blankets", "unit": "units", "minimum_stock": 200, "location_label": "Central Depot", "initial_stock": 500},
    {"name": "Generator Fuel", "category": "fuel", "unit": "liters", "minimum_stock": 200, "location_label": "Central Depot", "initial_stock": 800},
]


@router.get("/status")
async def demo_status(db: Session = Depends(get_db)):
    count = len(db.execute(select(Incident)).scalars().all())
    return {"demo_loaded": count > 0, "incident_count": count}


@router.get("/workflow")
async def workflow_description():
    return {
        "steps": [
            {"step": 1, "title": "Report Critical Flood Incident", "description": "Rescue Alpha device reports a critical flood incident in the Riverside District"},
            {"step": 2, "title": "Incident Agent Analysis", "description": "The Incident Agent validates the report, scores priority, and flags keywords"},
            {"step": 3, "title": "Propose Rescue Task", "description": "Task Agent generates an AI-suggested rescue task (requires human approval)"},
            {"step": 4, "title": "Human Approves Task", "description": "Coordinator reviews and approves the AI-suggested task assignment"},
            {"step": 5, "title": "Supply Agent Proposes Allocation", "description": "Supply Agent suggests resource allocation based on incident severity"},
            {"step": 6, "title": "Disconnect Peer & Queue Message", "description": "Rescue Bravo disconnects; an incident update is queued for delivery"},
            {"step": 7, "title": "Multi-hop Forwarding", "description": "Message is forwarded via Rescue Alpha (multi-hop through available peer)"},
            {"step": 8, "title": "Peer Reconnects & Syncs", "description": "Rescue Bravo reconnects and receives all queued messages"},
            {"step": 9, "title": "Duplicate Detection", "description": "A duplicate message is rejected (idempotent processing demonstrated)"},
            {"step": 10, "title": "Dashboard Update", "description": "All panels update: dashboard, map, audit log, and network status"},
        ]
    }


@router.post("/reset")
async def reset_demo(db: Session = Depends(get_db)):
    """Clear all data."""
    for model in [AuditLog, ConflictRecord, SyncMessage, InventoryTransaction, RescueTask, MapFeature, Incident, SupplyItem, Peer]:
        db.execute(delete(model))
    db.commit()
    await websocket_manager.broadcast_event("demo_reset", {"message": "All data cleared"})
    return {"status": "reset", "message": "All data cleared successfully"}


@router.post("/load")
async def load_demo(db: Session = Depends(get_db)):
    """Load the complete Millbrook Valley disaster scenario."""
    # Clear existing data
    for model in [AuditLog, ConflictRecord, SyncMessage, InventoryTransaction, RescueTask, MapFeature, Incident, SupplyItem, Peer]:
        db.execute(delete(model))
    db.commit()

    # Create peers
    peer_ids = {}
    for p_data in DEMO_PEERS:
        p = Peer(
            id=uid(), device_id=p_data["device_id"], name=p_data["name"],
            status=p_data["status"], is_simulated=p_data["is_simulated"],
            description=p_data["description"],
            messages_sent=p_data.get("messages_sent", 0),
            messages_received=p_data.get("messages_received", 0),
            battery_level=p_data.get("battery_level", 85),
            sync_status=p_data.get("sync_status", "synced"),
            last_seen=now(), last_sync=hours_ago(0.5),
            created_at=hours_ago(2),
        )
        db.add(p)
        peer_ids[p_data["device_id"]] = p.id
    db.flush()

    # Create map features
    for mf_data in DEMO_MAP_FEATURES:
        mf = MapFeature(
            id=uid(), feature_type=mf_data["feature_type"],
            name=mf_data["name"], description=mf_data.get("description"),
            latitude=mf_data["latitude"], longitude=mf_data["longitude"],
            severity=mf_data.get("severity"), status=mf_data.get("status"),
            is_synthetic=True, source_device_id="system",
            created_at=hours_ago(3), updated_at=hours_ago(1),
        )
        db.add(mf)
    db.flush()

    # Create incidents and their map features
    incident_ids = []
    for i_data in DEMO_INCIDENTS:
        inc_id = uid()
        inc = Incident(
            id=inc_id, title=i_data["title"], description=i_data["description"],
            category=i_data["category"], severity=i_data["severity"],
            status=i_data["status"], latitude=i_data["latitude"],
            longitude=i_data["longitude"], location_label=i_data["location_label"],
            source_device_id=i_data["source_device_id"],
            reported_by=i_data["reported_by"],
            affected_count=i_data["affected_count"],
            is_synthetic=i_data["is_synthetic"],
            is_verified=i_data.get("is_verified", False),
            created_at=hours_ago(2 + len(incident_ids) * 0.3),
            updated_at=hours_ago(0.5),
            version=1,
        )
        db.add(inc)
        incident_ids.append(inc_id)

        # Map feature for incident
        mf = MapFeature(
            id=uid(), feature_type="incident",
            name=i_data["title"][:80],
            description=i_data["description"][:200] if i_data.get("description") else None,
            latitude=i_data["latitude"], longitude=i_data["longitude"],
            severity=i_data["severity"], status=i_data["status"],
            entity_id=inc_id, is_synthetic=True,
            source_device_id=i_data["source_device_id"],
            created_at=hours_ago(2), updated_at=hours_ago(0.5),
        )
        db.add(mf)

    db.flush()

    # Create rescue tasks
    task_templates = [
        {"incident_idx": 0, "title": "Water Rescue — Riverside Rooftops", "priority": "critical",
         "assigned_team": "rescue-alpha", "status": "in_progress", "ai_suggested": False,
         "human_approved": True, "estimated_duration_hours": 4.0,
         "description": "Extract families trapped on rooftops in the Riverside District. Use inflatable rescue boat."},
        {"incident_idx": 1, "title": "Fire Suppression — 42 Maple Ave", "priority": "high",
         "assigned_team": "rescue-bravo", "status": "in_progress", "ai_suggested": False,
         "human_approved": True, "estimated_duration_hours": 3.0,
         "description": "Control structure fire and perform interior search for occupants."},
        {"incident_idx": 2, "title": "Medical Triage — Valley Road Shelter", "priority": "high",
         "assigned_team": "rescue-alpha", "status": "assigned", "ai_suggested": True,
         "human_approved": True, "approved_by": "Command Center",
         "estimated_duration_hours": 2.0,
         "description": "AI-suggested: Deploy medical personnel to shelter for triage of hypothermia cases."},
        {"incident_idx": 3, "title": "Route 7 Traffic Management", "priority": "medium",
         "assigned_team": "supply-unit", "status": "assigned", "ai_suggested": False,
         "human_approved": True, "estimated_duration_hours": 1.0,
         "description": "Set up detour signs and reroute supply convoy via Route 12."},
        {"incident_idx": 4, "title": "Search Pattern — Elm Street Area", "priority": "high",
         "assigned_team": "rescue-bravo", "status": "unassigned", "ai_suggested": True,
         "human_approved": False,
         "estimated_duration_hours": 6.0,
         "description": "AI-suggested: Systematic search for missing elderly resident. Requires human approval before dispatch."},
        {"incident_idx": 0, "title": "Evacuation Support — North Riverside", "priority": "high",
         "assigned_team": None, "status": "unassigned", "ai_suggested": False,
         "human_approved": False, "estimated_duration_hours": 3.0,
         "description": "Evacuate remaining residents from north section of Riverside District."},
    ]

    for t_data in task_templates:
        inc_id = incident_ids[t_data["incident_idx"]]
        task = RescueTask(
            id=uid(), incident_id=inc_id,
            title=t_data["title"], description=t_data["description"],
            priority=t_data["priority"], status=t_data["status"],
            assigned_team=t_data.get("assigned_team"),
            ai_suggested=t_data.get("ai_suggested", False),
            ai_reasoning=t_data["description"] if t_data.get("ai_suggested") else None,
            human_approved=t_data.get("human_approved", False),
            approved_by=t_data.get("approved_by"),
            approved_at=hours_ago(1) if t_data.get("approved_by") else None,
            estimated_duration_hours=t_data.get("estimated_duration_hours"),
            source_device_id="system",
            created_at=hours_ago(1.5), updated_at=hours_ago(0.3),
            started_at=hours_ago(0.5) if t_data["status"] == "in_progress" else None,
            version=1,
        )
        db.add(task)

    db.flush()

    # Create supply items
    supply_ids = {}
    for s_data in DEMO_SUPPLIES:
        item = SupplyItem(
            id=uid(), name=s_data["name"], category=s_data["category"],
            unit=s_data["unit"], minimum_stock=s_data["minimum_stock"],
            location_label=s_data["location_label"],
            latitude=BASE_LAT + 0.005, longitude=BASE_LON - 0.012,
            created_at=hours_ago(4), updated_at=hours_ago(1),
        )
        db.add(item)
        supply_ids[s_data["name"]] = (item.id, s_data["initial_stock"], s_data["unit"])

    db.flush()

    # Create transactions
    for name, (item_id, initial, unit) in supply_ids.items():
        db.add(InventoryTransaction(
            id=uid(), supply_item_id=item_id, transaction_type="addition",
            quantity=initial, notes="Initial scenario stock", performed_by="Logistics",
            device_id="supply-unit", created_at=hours_ago(4),
        ))
        if name == "Drinking Water":
            db.add(InventoryTransaction(
                id=uid(), supply_item_id=item_id, transaction_type="distribution",
                quantity=300, notes="Distributed to Valley Road shelter",
                performed_by="Sgt. Rivera", destination="Valley Road Shelter",
                device_id="supply-unit", created_at=hours_ago(1),
            ))
        elif name == "Emergency Food Packs":
            db.add(InventoryTransaction(
                id=uid(), supply_item_id=item_id, transaction_type="distribution",
                quantity=120, notes="Distributed to community center",
                performed_by="Supply Unit", destination="Community Center",
                device_id="supply-unit", created_at=hours_ago(0.8),
            ))
        elif name == "Medical Kits":
            db.add(InventoryTransaction(
                id=uid(), supply_item_id=item_id, transaction_type="distribution",
                quantity=25, notes="Deployed with Rescue Alpha",
                performed_by="Nurse Chen", destination="Field Team Alpha",
                device_id="supply-unit", created_at=hours_ago(1.2),
            ))

    db.flush()

    # Create demo sync messages
    demo_messages = [
        {"source": "rescue-alpha", "dest": "rescue-bravo", "status": "delivered",
         "type": "incident_update", "payload": json.dumps({"incident": "flood_riverside", "status": "active"})},
        {"source": "supply-unit", "dest": "rescue-alpha", "status": "delivered",
         "type": "supply_status", "payload": json.dumps({"water": 4700, "food": 1880})},
        {"source": "rescue-bravo", "dest": "supply-unit", "status": "queued",
         "type": "supply_request", "payload": json.dumps({"item": "blankets", "quantity": 50, "location": "Shelter B"})},
        {"source": "rescue-alpha", "dest": "rescue-bravo", "status": "delivered",
         "type": "task_update", "payload": json.dumps({"task": "water_rescue", "status": "in_progress"})},
        {"source": "system", "dest": "rescue-bravo", "status": "queued",
         "type": "incident_alert", "payload": json.dumps({"alert": "new_critical_incident", "priority": 1})},
    ]

    for msg_data in demo_messages:
        payload_bytes = msg_data["payload"].encode()
        chk = hashlib.sha256(payload_bytes).hexdigest()
        db.add(SyncMessage(
            id=uid(), message_id=msg_id(),
            source_device_id=msg_data["source"],
            destination_device_id=msg_data["dest"],
            payload_type=msg_data["type"],
            payload=msg_data["payload"],
            status=msg_data["status"],
            priority=3 if "critical" in msg_data["payload"] or "alert" in msg_data["type"] else 5,
            delivery_attempts=1 if msg_data["status"] != "queued" else 0,
            delivered_at=hours_ago(0.3) if msg_data["status"] == "delivered" else None,
            checksum=chk, schema_version="1.0",
            created_at=hours_ago(1),
        ))

    # Conflict record
    db.add(ConflictRecord(
        id=uid(),
        entity_type="incident",
        entity_id=incident_ids[0],
        local_version=json.dumps({"status": "active", "severity": "critical", "version": 2}),
        remote_version=json.dumps({"status": "responding", "severity": "critical", "version": 2}),
        conflict_type="concurrent_status_update",
        detected_at=hours_ago(0.2),
        resolved=False,
    ))

    # Audit logs
    audit_entries = [
        ("LOAD_DEMO_SCENARIO", "system", "system", "Millbrook Valley disaster scenario loaded"),
        ("CREATE_INCIDENT", "incident", incident_ids[0], "Critical flood reported by Rescue Alpha"),
        ("VERIFY_INCIDENT", "incident", incident_ids[0], "Incident verified by Command Center"),
        ("CREATE_TASK", "task", None, "Water rescue task assigned to Rescue Alpha"),
        ("APPROVE_TASK", "task", None, "Task approved by Command Center"),
        ("PEER_CONNECT", "peer", None, "Rescue Alpha connected to mesh network"),
        ("PEER_DISCONNECT", "peer", None, "Rescue Bravo temporarily disconnected"),
        ("PEER_SYNC", "peer", None, "Rescue Bravo reconnected — 2 queued messages delivered"),
    ]
    for action, etype, eid, details in audit_entries:
        db.add(AuditLog(
            id=uid(), action=action, entity_type=etype, entity_id=eid,
            performed_by="system", device_id="local", details=details,
            created_at=hours_ago(2 - audit_entries.index((action, etype, eid, details)) * 0.2),
        ))

    db.commit()
    await websocket_manager.broadcast_event("demo_loaded", {
        "message": "Millbrook Valley scenario loaded",
        "incidents": len(DEMO_INCIDENTS),
        "peers": len(DEMO_PEERS),
    })

    return {
        "status": "loaded",
        "scenario": "Millbrook Valley Disaster",
        "incidents_created": len(DEMO_INCIDENTS),
        "tasks_created": len(task_templates),
        "supply_items_created": len(DEMO_SUPPLIES),
        "peers_created": len(DEMO_PEERS),
        "map_features_created": len(DEMO_MAP_FEATURES) + len(DEMO_INCIDENTS),
        "message": "Demo scenario ready. Use /api/demo/simulate/step/1 to begin E2E workflow.",
    }


# E2E demo step state
_demo_state = {"step": 0, "demo_incident_id": None, "demo_task_id": None}


@router.post("/simulate/step/{step_number}")
async def simulate_step(step_number: int, db: Session = Depends(get_db)):
    if step_number < 1 or step_number > 10:
        raise HTTPException(status_code=400, detail="Step must be 1-10")

    _demo_state["step"] = step_number

    if step_number == 1:
        inc = Incident(
            id=uid(), title="DEMO: Critical Flood — East Riverside (Step 1)",
            description="Flash flood reported by Rescue Alpha. Water level rising rapidly. Families stranded.",
            category="flood", severity="critical", status="reported",
            latitude=BASE_LAT + 0.010, longitude=BASE_LON - 0.003,
            location_label="East Riverside, Millbrook Valley",
            source_device_id="rescue-alpha", reported_by="Sgt. Rivera",
            affected_count=42, is_synthetic=True, is_verified=False,
            created_at=now(), updated_at=now(), version=1,
        )
        db.add(inc)
        db.commit()
        db.refresh(inc)
        _demo_state["demo_incident_id"] = inc.id
        await websocket_manager.broadcast_event("demo_step", {"step": 1, "message": "Critical flood reported by Rescue Alpha", "incident_id": inc.id})
        return {"step": 1, "status": "ok", "incident_id": inc.id, "message": "Critical flood incident created"}

    elif step_number == 2:
        from app.agents.incident_agent import IncidentAgent
        inc_id = _demo_state.get("demo_incident_id")
        if not inc_id:
            raise HTTPException(status_code=400, detail="Run step 1 first")
        inc = db.execute(select(Incident).where(Incident.id == inc_id)).scalars().first()
        agent = IncidentAgent()
        analysis = agent.analyze_incident(
            incident_id=inc.id, title=inc.title, description=inc.description,
            category=inc.category, severity=inc.severity, affected_count=inc.affected_count,
            latitude=inc.latitude, longitude=inc.longitude, created_at=inc.created_at,
        )
        inc.is_verified = True
        inc.status = "verified"
        inc.updated_at = now()
        db.commit()
        db.add(AuditLog(id=uid(), action="AGENT_INCIDENT_ANALYSIS", entity_type="incident",
                        entity_id=inc_id, performed_by="incident_agent", device_id="local",
                        details=f"Priority: {analysis.priority_score}, Severity: {analysis.suggested_severity}",
                        created_at=now()))
        db.commit()
        await websocket_manager.broadcast_event("demo_step", {"step": 2, "analysis": {"score": analysis.priority_score, "flags": analysis.flags}})
        return {"step": 2, "status": "ok", "analysis": {"priority_score": analysis.priority_score, "suggested_severity": analysis.suggested_severity, "flags": analysis.flags, "reasoning": analysis.reasoning}}

    elif step_number == 3:
        inc_id = _demo_state.get("demo_incident_id")
        if not inc_id:
            raise HTTPException(status_code=400, detail="Run steps 1-2 first")
        task = RescueTask(
            id=uid(), incident_id=inc_id,
            title="DEMO: Water Rescue — East Riverside",
            description="AI-suggested: Deploy water rescue team to extract stranded families. Use inflatable boat.",
            priority="critical", status="unassigned",
            assigned_team="rescue-alpha",
            ai_suggested=True, human_approved=False,
            ai_reasoning="Critical flood with 42 affected people requires immediate water rescue. Rescue Alpha is nearest available team with water rescue capability.",
            estimated_duration_hours=3.0,
            source_device_id="incident_agent",
            created_at=now(), updated_at=now(), version=1,
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        _demo_state["demo_task_id"] = task.id
        db.add(AuditLog(id=uid(), action="AI_TASK_PROPOSED", entity_type="task",
                        entity_id=task.id, performed_by="task_agent", device_id="local",
                        details="AI proposed water rescue task — awaiting human approval",
                        created_at=now()))
        db.commit()
        await websocket_manager.broadcast_event("demo_step", {"step": 3, "task_id": task.id, "message": "AI proposed rescue task — AWAITING HUMAN APPROVAL"})
        return {"step": 3, "status": "ok", "task_id": task.id, "message": "AI task proposed. Human approval required before dispatch."}

    elif step_number == 4:
        task_id = _demo_state.get("demo_task_id")
        if not task_id:
            raise HTTPException(status_code=400, detail="Run step 3 first")
        task = db.execute(select(RescueTask).where(RescueTask.id == task_id)).scalars().first()
        task.human_approved = True
        task.approved_by = "Commander Davis"
        task.approved_at = now()
        task.status = "assigned"
        task.updated_at = now()
        task.version += 1
        db.commit()
        db.add(AuditLog(id=uid(), action="HUMAN_APPROVED_TASK", entity_type="task",
                        entity_id=task_id, performed_by="Commander Davis", device_id="local",
                        details="Commander Davis approved AI-suggested water rescue task",
                        created_at=now()))
        db.commit()
        await websocket_manager.broadcast_event("demo_step", {"step": 4, "task_id": task_id, "approved_by": "Commander Davis"})
        return {"step": 4, "status": "ok", "approved_by": "Commander Davis", "message": "Task approved and assigned to Rescue Alpha"}

    elif step_number == 5:
        inc_id = _demo_state.get("demo_incident_id")
        from app.agents.supply_agent import SupplyAgent
        items = db.execute(select(SupplyItem)).scalars().all()

        def calc(item):
            total = 0.0
            for t in item.transactions:
                if t.transaction_type == "addition": total += abs(t.quantity)
                elif t.transaction_type in ("distribution", "transfer"): total -= abs(t.quantity)
                elif t.transaction_type == "adjustment": total += t.quantity
            return round(total, 2)

        items_dicts = [{"id": i.id, "name": i.name, "category": i.category, "unit": i.unit, "current_stock": calc(i), "minimum_stock": i.minimum_stock} for i in items]
        inc = db.execute(select(Incident).where(Incident.id == inc_id)).scalars().first()
        agent = SupplyAgent()
        suggestions = agent.suggest_allocation(
            incident={"id": inc.id, "category": inc.category, "severity": inc.severity, "affected_count": inc.affected_count},
            supply_items=items_dicts,
        )
        applied = []
        for s in suggestions[:2]:
            if s.is_feasible and s.suggested_quantity > 0:
                txn = InventoryTransaction(
                    id=uid(), supply_item_id=s.supply_item_id,
                    transaction_type="distribution",
                    quantity=s.suggested_quantity,
                    notes="AI-suggested allocation for flood response. Human approved.",
                    performed_by="Commander Davis", destination="East Riverside Response",
                    incident_id=inc_id, ai_suggested=True, human_approved=True,
                    device_id="local", created_at=now(),
                )
                db.add(txn)
                applied.append({"item": s.supply_item_name, "qty": s.suggested_quantity, "unit": s.unit})
        db.commit()
        await websocket_manager.broadcast_event("demo_step", {"step": 5, "allocations": applied})
        return {"step": 5, "status": "ok", "allocations": applied, "message": "Supply agent allocation applied with human approval"}

    elif step_number == 6:
        peer = db.execute(select(Peer).where(Peer.device_id.in_(["RESCUE-B", "rescue-bravo"]))).scalars().first()
        target_device = peer.device_id if peer else "RESCUE-B"
        if peer:
            peer.status = "offline"
            peer.sync_status = "pending"
            db.commit()

        payload = json.dumps({"type": "incident_alert", "incident_id": _demo_state.get("demo_incident_id"), "priority": "critical"})
        msg = SyncMessage(
            id=uid(), message_id=msg_id(),
            source_device_id="RESCUE-A",
            destination_device_id=target_device,
            payload_type="incident_alert", payload=payload,
            priority=1, status="queued",
            created_at=now(), schema_version="1.0",
            checksum=hashlib.sha256(payload.encode()).hexdigest(),
        )
        db.add(msg)
        if peer:
            peer.pending_messages += 1
        db.commit()
        await websocket_manager.broadcast_event("demo_step", {"step": 6, "message": f"{target_device} disconnected — message queued", "peer_status": "offline"})
        return {"step": 6, "status": "ok", "message": f"{target_device} disconnected. Critical alert queued for delivery.", "message_id": msg.message_id}

    elif step_number == 7:
        queued_msgs = db.execute(select(SyncMessage).where(
            SyncMessage.destination_device_id.in_(["RESCUE-B", "rescue-bravo"]),
            SyncMessage.status == "queued"
        )).scalars().all()
        forwarded = []
        for msg in queued_msgs:
            msg.hop_count += 1
            msg.via_device_ids = "RESCUE-A"
            forwarded.append(msg.message_id)
        db.commit()
        db.add(AuditLog(id=uid(), action="MESSAGE_HOP_FORWARDED", entity_type="sync_message",
                        entity_id=None, performed_by="sync_engine", device_id="RESCUE-A",
                        details=f"{len(forwarded)} messages forwarded via RESCUE-A (multi-hop)", created_at=now()))
        db.commit()
        await websocket_manager.broadcast_event("demo_step", {"step": 7, "forwarded": len(forwarded), "via": "RESCUE-A"})
        return {"step": 7, "status": "ok", "forwarded": len(forwarded), "message": "Messages forwarded via RESCUE-A (hop count incremented)"}

    elif step_number == 8:
        peer = db.execute(select(Peer).where(Peer.device_id.in_(["RESCUE-B", "rescue-bravo"]))).scalars().first()
        target_device = peer.device_id if peer else "RESCUE-B"
        if peer:
            peer.status = "online"
            peer.sync_status = "synced"
            peer.last_seen = now()
            peer.last_sync = now()

        msgs = db.execute(select(SyncMessage).where(
            SyncMessage.destination_device_id.in_(["RESCUE-B", "rescue-bravo"]),
            SyncMessage.status == "queued"
        )).scalars().all()
        delivered = []
        for msg in msgs:
            msg.status = "delivered"
            msg.delivered_at = now()
            msg.delivery_attempts += 1
            delivered.append(msg.message_id)

        if peer:
            peer.messages_received += len(delivered)
            peer.pending_messages = 0
        db.commit()
        db.add(AuditLog(id=uid(), action="PEER_SYNC_RECONNECT", entity_type="peer",
                        entity_id=None, performed_by="sync_engine", device_id=target_device,
                        details=f"{target_device} reconnected — {len(delivered)} queued messages delivered", created_at=now()))
        db.commit()
        await websocket_manager.broadcast_event("demo_step", {"step": 8, "delivered": len(delivered), "peer": target_device, "status": "online"})
        return {"step": 8, "status": "ok", "delivered": len(delivered), "message": f"{target_device} reconnected and synced"}

    elif step_number == 9:
        inc_id = _demo_state.get("demo_incident_id")
        payload = json.dumps({"type": "incident_update", "incident_id": inc_id})
        first_existing = db.execute(select(SyncMessage).where(SyncMessage.checksum == hashlib.sha256(payload.encode()).hexdigest())).scalars().first()

        if first_existing:
            await websocket_manager.broadcast_event("demo_step", {"step": 9, "duplicate_rejected": True, "message_id": first_existing.message_id})
            return {"step": 9, "status": "ok", "duplicate_rejected": True, "message": "Duplicate message detected and rejected (idempotent processing)"}

        msg = SyncMessage(
            id=uid(), message_id=msg_id(),
            source_device_id="rescue-alpha", destination_device_id="rescue-bravo",
            payload_type="incident_update", payload=payload,
            status="delivered", priority=3, delivery_attempts=1,
            delivered_at=now(), created_at=now(), schema_version="1.0",
            checksum=hashlib.sha256(payload.encode()).hexdigest(),
        )
        db.add(msg)
        db.commit()
        await websocket_manager.broadcast_event("demo_step", {"step": 9, "message": "Duplicate prevention demonstrated"})
        return {"step": 9, "status": "ok", "message": "Duplicate prevention demonstrated — same checksum would be rejected"}

    elif step_number == 10:
        await websocket_manager.broadcast_event("demo_step", {
            "step": 10, "message": "E2E demo complete! Dashboard, map, audit log, and network panel all updated.",
            "workflow_complete": True,
        })
        await websocket_manager.broadcast_event("dashboard_refresh", {"trigger": "demo_complete"})
        db.add(AuditLog(id=uid(), action="DEMO_WORKFLOW_COMPLETE", entity_type="system",
                        entity_id=None, performed_by="demo_controller", device_id="local",
                        details="End-to-end demo workflow completed successfully", created_at=now()))
        db.commit()
        return {"step": 10, "status": "ok", "message": "E2E demo workflow complete!", "workflow_complete": True}
