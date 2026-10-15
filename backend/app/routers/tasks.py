"""
Tasks Router — Rescue task coordination with AI suggestions and human approval
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from typing import Optional, List
from datetime import datetime, timezone
import uuid, logging

from app.database import get_db
from app.models import RescueTask, Incident
from app.schemas import TaskCreate, TaskUpdate, TaskApproval, RescueTaskOut
from app.websocket_manager import websocket_manager
from app.audit_service import log_action

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=List[RescueTaskOut])
async def list_tasks(
    incident_id: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_team: Optional[str] = None,
    db: Session = Depends(get_db),
):
    stmt = select(RescueTask).order_by(desc(RescueTask.created_at))
    if incident_id:
        stmt = stmt.where(RescueTask.incident_id == incident_id)
    if status:
        stmt = stmt.where(RescueTask.status == status)
    if priority:
        stmt = stmt.where(RescueTask.priority == priority)
    if assigned_team:
        stmt = stmt.where(RescueTask.assigned_team == assigned_team)
    return db.execute(stmt).scalars().all()


@router.post("/", response_model=RescueTaskOut, status_code=201)
async def create_task(data: TaskCreate, db: Session = Depends(get_db)):
    # Validate incident exists
    inc = db.execute(select(Incident).where(Incident.id == data.incident_id)).scalars().first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    task = RescueTask(
        id=str(uuid.uuid4()),
        incident_id=data.incident_id,
        title=data.title,
        description=data.description,
        priority=data.priority.value if hasattr(data.priority, 'value') else data.priority,
        assigned_team=data.assigned_team,
        assigned_to=data.assigned_to,
        estimated_duration_hours=data.estimated_duration_hours,
        ai_suggested=data.ai_suggested,
        ai_reasoning=data.ai_reasoning,
        human_approved=False if data.ai_suggested else True,
        status="unassigned" if not data.assigned_team else "assigned",
        source_device_id=data.source_device_id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        version=1,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    log_action(db, "CREATE_TASK", "task", task.id, new_value={"title": task.title, "priority": task.priority})
    await websocket_manager.broadcast_event("task_created", {"id": task.id, "title": task.title, "priority": task.priority, "incident_id": task.incident_id})
    return task


@router.get("/conflicts/check")
async def check_conflicts(db: Session = Depends(get_db)):
    from app.agents.task_agent import TaskCoordinationAgent
    tasks = db.execute(select(RescueTask)).scalars().all()
    tasks_dicts = [{"id": t.id, "assigned_team": t.assigned_team, "priority": t.priority, "status": t.status} for t in tasks]
    agent = TaskCoordinationAgent()
    conflicts = agent.detect_conflicts(tasks_dicts)
    return {"conflicts": conflicts}


@router.get("/{task_id}", response_model=RescueTaskOut)
async def get_task(task_id: str, db: Session = Depends(get_db)):
    task = db.execute(select(RescueTask).where(RescueTask.id == task_id)).scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/{task_id}", response_model=RescueTaskOut)
async def update_task(task_id: str, data: TaskUpdate, db: Session = Depends(get_db)):
    task = db.execute(select(RescueTask).where(RescueTask.id == task_id)).scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Block status changes on unapproved AI tasks
    if data.status and task.ai_suggested and not task.human_approved:
        if data.status.value not in ("cancelled",):
            raise HTTPException(
                status_code=403,
                detail="AI-suggested task requires human approval before status change"
            )

    old = {"status": task.status, "priority": task.priority}
    for field_name, value in data.model_dump(exclude_none=True).items():
        if hasattr(value, 'value'):
            value = value.value
        setattr(task, field_name, value)
    task.updated_at = datetime.now(timezone.utc)
    task.version += 1

    db.commit()
    db.refresh(task)
    log_action(db, "UPDATE_TASK", "task", task.id, old_value=old, new_value={"status": task.status})
    await websocket_manager.broadcast_event("task_updated", {"id": task.id, "status": task.status})
    return task


@router.post("/{task_id}/approve", response_model=RescueTaskOut)
async def approve_task(task_id: str, approval: TaskApproval, db: Session = Depends(get_db)):
    task = db.execute(select(RescueTask).where(RescueTask.id == task_id)).scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.human_approved = approval.approved
    task.approved_by = approval.approved_by
    task.approved_at = datetime.now(timezone.utc)
    task.updated_at = datetime.now(timezone.utc)
    if approval.approved and task.assigned_team:
        task.status = "assigned"
    task.version += 1

    db.commit()
    db.refresh(task)

    action = "APPROVE_TASK" if approval.approved else "REJECT_TASK"
    log_action(db, action, "task", task.id,
               performed_by=approval.approved_by,
               details=approval.notes)
    await websocket_manager.broadcast_event("task_approved", {
        "id": task.id, "approved": approval.approved,
        "approved_by": approval.approved_by
    })
    return task


@router.post("/{task_id}/start", response_model=RescueTaskOut)
async def start_task(task_id: str, db: Session = Depends(get_db)):
    task = db.execute(select(RescueTask).where(RescueTask.id == task_id)).scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.ai_suggested and not task.human_approved:
        raise HTTPException(status_code=403, detail="Requires human approval first")
    task.status = "in_progress"
    task.started_at = datetime.now(timezone.utc)
    task.updated_at = datetime.now(timezone.utc)
    task.version += 1
    db.commit()
    db.refresh(task)
    log_action(db, "START_TASK", "task", task.id)
    await websocket_manager.broadcast_event("task_started", {"id": task.id})
    return task


@router.post("/{task_id}/complete", response_model=RescueTaskOut)
async def complete_task(task_id: str, db: Session = Depends(get_db)):
    task = db.execute(select(RescueTask).where(RescueTask.id == task_id)).scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = "completed"
    task.completed_at = datetime.now(timezone.utc)
    task.updated_at = datetime.now(timezone.utc)
    task.version += 1
    db.commit()
    db.refresh(task)
    log_action(db, "COMPLETE_TASK", "task", task.id)
    await websocket_manager.broadcast_event("task_completed", {"id": task.id})
    return task
