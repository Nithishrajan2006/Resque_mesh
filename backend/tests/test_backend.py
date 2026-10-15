"""
ResQMesh Backend Tests
Comprehensive tests for Incidents, Tasks, Inventory, Peers, Agents, Sync Engine, and E2E Demo.
Runs 100% natively on standard SQLite without external dependencies.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid

from app.database import Base, get_db
from main import app

TEST_DB_URL = "sqlite:///./test_resqmesh.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    from app import models  # noqa
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


# ============ Health Check ============

def test_health_check(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "online"
    assert data["service"] == "ResQMesh"


# ============ Incident CRUD & Validation ============

def test_create_incident(client):
    resp = client.post("/api/incidents/", json={
        "title": "Severe Flash Flood — Riverside",
        "category": "flood",
        "severity": "critical",
        "latitude": 40.71,
        "longitude": -74.01,
        "location_label": "Riverside Sector",
        "source_device_id": "rescue-alpha",
        "reported_by": "Officer Ramirez",
        "affected_count": 25,
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Severe Flash Flood — Riverside"
    assert data["severity"] == "critical"
    assert "id" in data


def test_list_incidents(client):
    resp = client.get("/api/incidents/")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


def test_incident_validation_title_too_short(client):
    resp = client.post("/api/incidents/", json={"title": "AB", "category": "other"})
    assert resp.status_code == 422


def test_incident_duplicate_detection(client):
    payload = {
        "title": "Duplicate Check Fire Incident",
        "category": "fire",
        "severity": "high",
        "latitude": 40.73,
        "longitude": -74.03,
        "location_label": "Station 4",
        "source_device_id": "rescue-bravo",
        "affected_count": 4,
    }
    resp1 = client.post("/api/incidents/", json=payload)
    assert resp1.status_code == 201

    resp2 = client.post("/api/incidents/", json=payload)
    assert resp2.status_code == 409
    assert "duplicate" in resp2.json()["detail"]["message"].lower()


def test_verify_incident(client):
    create_resp = client.post("/api/incidents/", json={
        "title": "Unverified Sighting",
        "category": "other",
        "severity": "medium",
        "source_device_id": "local",
        "affected_count": 0,
    })
    inc_id = create_resp.json()["id"]

    resp = client.post(f"/api/incidents/{inc_id}/verify")
    assert resp.status_code == 200
    assert resp.json()["is_verified"] is True
    assert resp.json()["status"] == "verified"


# ============ Rescue Task Coordination ============

def test_create_task_and_approval(client):
    # 1. Create incident
    inc_resp = client.post("/api/incidents/", json={
        "title": "Incident For Task Test",
        "category": "medical",
        "severity": "high",
        "source_device_id": "test",
        "affected_count": 5,
    })
    inc_id = inc_resp.json()["id"]

    # 2. Create AI-suggested task
    task_resp = client.post("/api/tasks/", json={
        "incident_id": inc_id,
        "title": "Deploy Medical Triage Unit",
        "priority": "high",
        "assigned_team": "rescue-alpha",
        "ai_suggested": True,
        "ai_reasoning": "High severity medical incident requires immediate triage.",
    })
    assert task_resp.status_code == 201
    task_id = task_resp.json()["id"]
    assert task_resp.json()["human_approved"] is False

    # 3. Guardrail: Cannot start task without approval
    start_fail = client.post(f"/api/tasks/{task_id}/start")
    assert start_fail.status_code == 403

    # 4. Human Approval
    approve_resp = client.post(f"/api/tasks/{task_id}/approve", json={
        "approved": True,
        "approved_by": "Commander Test",
        "notes": "Verified safety parameters",
    })
    assert approve_resp.status_code == 200
    assert approve_resp.json()["human_approved"] is True

    # 5. Start and Complete
    start_ok = client.post(f"/api/tasks/{task_id}/start")
    assert start_ok.status_code == 200
    assert start_ok.json()["status"] == "in_progress"

    complete_ok = client.post(f"/api/tasks/{task_id}/complete")
    assert complete_ok.status_code == 200
    assert complete_ok.json()["status"] == "completed"


def test_task_conflict_detection():
    from app.agents.task_agent import TaskCoordinationAgent
    agent = TaskCoordinationAgent()
    tasks = [
        {"id": "t1", "assigned_team": "rescue-alpha", "priority": "critical", "status": "in_progress"},
        {"id": "t2", "assigned_team": "rescue-alpha", "priority": "critical", "status": "assigned"},
        {"id": "t3", "assigned_team": "rescue-bravo", "priority": "medium", "status": "assigned"},
    ]
    conflicts = agent.detect_conflicts(tasks)
    assert len(conflicts) == 1
    assert conflicts[0]["team"] == "rescue-alpha"


# ============ Relief Inventory Ledger ============

def test_inventory_ledger_calculation(client):
    # 1. Create item
    item_resp = client.post("/api/inventory/items", json={
        "name": "Emergency Blankets Cache",
        "category": "blankets",
        "unit": "units",
        "minimum_stock": 100,
    })
    item_id = item_resp.json()["id"]

    # 2. Add stock (addition)
    client.post("/api/inventory/transactions", json={
        "supply_item_id": item_id,
        "transaction_type": "addition",
        "quantity": 500,
        "notes": "Initial batch delivery",
    })

    # 3. Distribute stock (distribution)
    client.post("/api/inventory/transactions", json={
        "supply_item_id": item_id,
        "transaction_type": "distribution",
        "quantity": 150,
        "destination": "Shelter Alpha",
    })

    # 4. Check calculated balance
    get_item = client.get(f"/api/inventory/items/{item_id}")
    assert get_item.json()["current_stock"] == 350.0


def test_inventory_prevents_negative_stock(client):
    item_resp = client.post("/api/inventory/items", json={
        "name": "Scarce Medicine",
        "category": "medical",
        "unit": "vials",
        "minimum_stock": 10,
    })
    item_id = item_resp.json()["id"]

    # Stock = 20
    client.post("/api/inventory/transactions", json={
        "supply_item_id": item_id,
        "transaction_type": "addition",
        "quantity": 20,
    })

    # Distribute 50 -> must fail with 400
    fail_resp = client.post("/api/inventory/transactions", json={
        "supply_item_id": item_id,
        "transaction_type": "distribution",
        "quantity": 50,
    })
    assert fail_resp.status_code == 400
    assert "insufficient stock" in fail_resp.json()["detail"].lower()


def test_inventory_idempotency_key(client):
    item_resp = client.post("/api/inventory/items", json={
        "name": "Idempotent Water",
        "category": "water",
        "unit": "liters",
        "minimum_stock": 0,
    })
    item_id = item_resp.json()["id"]
    idem_key = f"key-{uuid.uuid4().hex[:8]}"

    tx1 = client.post("/api/inventory/transactions", json={
        "supply_item_id": item_id, "transaction_type": "addition", "quantity": 100,
        "idempotency_key": idem_key,
    })
    assert tx1.status_code == 201

    tx2 = client.post("/api/inventory/transactions", json={
        "supply_item_id": item_id, "transaction_type": "addition", "quantity": 100,
        "idempotency_key": idem_key,
    })
    assert tx2.status_code == 201
    assert tx1.json()["id"] == tx2.json()["id"]


# ============ Peer Network Simulation ============

def test_peer_connection_and_sync(client):
    device_id = f"peer-{uuid.uuid4().hex[:6]}"
    # Register
    p = client.post("/api/peers/", json={
        "device_id": device_id,
        "name": "Rescue Charlie Test",
        "is_simulated": True,
    })
    assert p.status_code == 201

    # Connect
    c = client.post(f"/api/peers/{device_id}/connect")
    assert c.json()["status"] == "online"

    # Disconnect
    d = client.post(f"/api/peers/{device_id}/disconnect")
    assert d.json()["status"] == "offline"

    # Send message while offline -> must be queued
    msg_resp = client.post("/api/peers/message/send", params={
        "source_device_id": "rescue-alpha",
        "destination_device_id": device_id,
        "payload_type": "alert",
        "payload": '{"alert": "test"}',
    })
    assert msg_resp.status_code == 200
    assert msg_resp.json()["status"] == "queued"

    # Sync on reconnect
    sync_resp = client.post(f"/api/peers/{device_id}/sync")
    assert sync_resp.status_code == 200
    assert sync_resp.json()["messages_delivered"] >= 1


# ============ 10-Step E2E Disaster Demo ============

def test_full_demo_scenario_workflow(client):
    # Load scenario
    load_res = client.post("/api/demo/load")
    assert load_res.status_code == 200
    assert load_res.json()["incidents_created"] == 5
    assert load_res.json()["peers_created"] == 4

    # Step 1: Report flood
    s1 = client.post("/api/demo/simulate/step/1")
    assert s1.status_code == 200
    assert s1.json()["step"] == 1

    # Step 2: Agent evaluation
    s2 = client.post("/api/demo/simulate/step/2")
    assert s2.status_code == 200
    assert s2.json()["analysis"]["priority_score"] > 80

    # Step 3: Propose task
    s3 = client.post("/api/demo/simulate/step/3")
    assert s3.status_code == 200

    # Step 4: Human approval
    s4 = client.post("/api/demo/simulate/step/4")
    assert s4.status_code == 200
    assert "Commander Davis" in s4.json()["approved_by"]

    # Step 5: Supply allocation
    s5 = client.post("/api/demo/simulate/step/5")
    assert s5.status_code == 200

    # Step 6: Disconnect peer & queue message
    s6 = client.post("/api/demo/simulate/step/6")
    assert s6.status_code == 200

    # Step 7: Multi-hop forwarding
    s7 = client.post("/api/demo/simulate/step/7")
    assert s7.status_code == 200

    # Step 8: Reconnect & sync
    s8 = client.post("/api/demo/simulate/step/8")
    assert s8.status_code == 200

    # Step 9: Duplicate detection
    s9 = client.post("/api/demo/simulate/step/9")
    assert s9.status_code == 200

    # Step 10: Complete convergence
    s10 = client.post("/api/demo/simulate/step/10")
    assert s10.status_code == 200
    assert s10.json()["workflow_complete"] is True
