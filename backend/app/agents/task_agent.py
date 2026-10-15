"""
ResQMesh Task Coordination Agent
Ranks tasks, suggests assignments, detects conflicts.
Fully offline rule-based intelligence.
"""
import logging
from typing import Optional, List, Dict, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

PRIORITY_WEIGHTS = {
    "critical": 100,
    "high": 70,
    "medium": 40,
    "low": 15,
}

SEVERITY_WEIGHTS = {
    "critical": 100,
    "high": 70,
    "medium": 40,
    "low": 15,
}

TEAM_CAPABILITIES = {
    "rescue-alpha": ["rescue", "water_rescue", "medical_support", "search"],
    "rescue-bravo": ["rescue", "fire_suppression", "evacuation", "search"],
    "supply-unit": ["logistics", "supply_delivery", "shelter_setup"],
    "medical-team": ["medical", "triage", "first_aid"],
}

CATEGORY_TEAM_PREFERENCE = {
    "flood": ["rescue-alpha"],
    "fire": ["rescue-bravo"],
    "medical": ["medical-team", "rescue-alpha"],
    "missing_person": ["rescue-alpha", "rescue-bravo"],
    "blocked_road": ["rescue-bravo", "supply-unit"],
    "other": ["rescue-alpha", "rescue-bravo"],
}


@dataclass
class TaskSuggestion:
    title: str
    description: str
    priority: str
    suggested_team: Optional[str]
    estimated_duration_hours: float
    reasoning: str
    confidence: float
    conflict_warnings: List[str] = field(default_factory=list)
    requires_human_approval: bool = True


@dataclass
class TaskRanking:
    task_id: str
    score: float
    priority_suggestion: str
    reasoning: str
    conflict_warnings: List[str] = field(default_factory=list)


class TaskCoordinationAgent:
    """
    Ranks tasks by urgency, suggests team assignments, and detects conflicts.
    No external LLM required.
    """

    def __init__(self):
        self.agent_name = "Task Coordination Agent"
        logger.info(f"{self.agent_name} initialized")

    def rank_tasks(self, tasks: List[Dict], incidents: Optional[List[Dict]] = None) -> List[TaskRanking]:
        """Rank tasks by priority score considering incident severity and wait time."""
        incident_map = {i["id"]: i for i in (incidents or [])}
        results = []

        for task in tasks:
            if task.get("status") in ("completed", "cancelled"):
                continue

            score = 0.0
            reasoning_parts = []
            warnings = []

            # Task priority weight
            prio_score = PRIORITY_WEIGHTS.get(task.get("priority", "medium"), 40)
            score += prio_score
            reasoning_parts.append(f"Task priority={task.get('priority')}: +{prio_score}")

            # Incident severity boost
            incident = incident_map.get(task.get("incident_id", ""))
            if incident:
                inc_score = SEVERITY_WEIGHTS.get(incident.get("severity", "medium"), 40)
                score += inc_score * 0.5
                reasoning_parts.append(f"Incident severity={incident.get('severity')}: +{inc_score * 0.5:.0f}")

            # Wait time bonus (unassigned tasks get priority boost)
            if task.get("status") == "unassigned":
                score += 20
                reasoning_parts.append("Unassigned status bonus: +20")

                # Additional bonus for long-waiting unassigned tasks
                try:
                    created = task.get("created_at")
                    if isinstance(created, str):
                        created = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    if created:
                        if created.tzinfo is None:
                            created = created.replace(tzinfo=timezone.utc)
                        wait_hours = (datetime.now(timezone.utc) - created).total_seconds() / 3600
                        wait_bonus = min(wait_hours * 5, 30)
                        score += wait_bonus
                        reasoning_parts.append(f"Wait time ({wait_hours:.1f}h): +{wait_bonus:.1f}")
                except Exception:
                    pass

            # AI-suggested but not approved — flag for human review
            if task.get("ai_suggested") and not task.get("human_approved"):
                warnings.append("⚠️ AI-suggested task awaiting human approval")
                score -= 10  # Slight penalty until approved

            results.append(TaskRanking(
                task_id=task.get("id", ""),
                score=round(score, 2),
                priority_suggestion=self._score_to_priority(score),
                reasoning=" | ".join(reasoning_parts),
                conflict_warnings=warnings,
            ))

        results.sort(key=lambda x: x.score, reverse=True)
        return results

    def suggest_task_for_incident(
        self,
        incident: Dict,
        existing_tasks: Optional[List[Dict]] = None,
        available_teams: Optional[List[str]] = None,
    ) -> TaskSuggestion:
        """Generate a task suggestion for an incident."""
        category = incident.get("category", "other")
        severity = incident.get("severity", "medium")
        title = incident.get("title", "Unknown incident")
        affected = incident.get("affected_count", 0)

        # Determine task type from category
        task_templates = {
            "flood": ("Flood Rescue Operation", "Deploy water rescue team to extract trapped individuals", 4.0),
            "fire": ("Fire Suppression and Evacuation", "Control fire and evacuate nearby residents", 3.0),
            "medical": ("Medical Emergency Response", "Provide first aid and arrange transport to medical facility", 2.0),
            "missing_person": ("Search and Rescue Operation", "Initiate systematic search for missing individual(s)", 6.0),
            "blocked_road": ("Road Clearance Operation", "Clear blocked road to restore supply routes", 3.0),
            "earthquake": ("Structural Search and Rescue", "Search collapsed structures for survivors", 8.0),
            "landslide": ("Landslide Recovery Operation", "Clear debris and rescue trapped individuals", 6.0),
            "other": ("Emergency Response", "Respond to reported emergency", 3.0),
        }

        task_title_base, task_desc_base, est_hours = task_templates.get(
            category, task_templates["other"]
        )

        # Adjust for severity
        priority = severity if severity in PRIORITY_WEIGHTS else "medium"
        if severity == "critical":
            est_hours = max(1.5, est_hours * 0.75)  # Faster response for critical

        # Select team
        preferred = CATEGORY_TEAM_PREFERENCE.get(category, ["rescue-alpha"])
        selected_team = None
        conflict_warnings = []

        if available_teams:
            for team in preferred:
                if team in available_teams:
                    selected_team = team
                    break
            if not selected_team and available_teams:
                selected_team = available_teams[0]
                conflict_warnings.append(f"⚠️ Preferred team not available, assigned {selected_team}")
        else:
            selected_team = preferred[0] if preferred else None

        # Check for existing tasks on same incident
        if existing_tasks:
            active_on_incident = [
                t for t in existing_tasks
                if t.get("incident_id") == incident.get("id")
                and t.get("status") not in ("completed", "cancelled")
            ]
            if active_on_incident:
                conflict_warnings.append(
                    f"⚠️ {len(active_on_incident)} existing active task(s) for this incident"
                )

        reasoning = (
            f"Incident category '{category}' with severity '{severity}' requires {task_title_base}. "
            f"Estimated {est_hours}h based on typical response time. "
            f"Team '{selected_team}' selected based on capability match. "
            f"Priority set to '{priority}' matching incident severity."
        )

        return TaskSuggestion(
            title=f"{task_title_base} — {title[:50]}",
            description=task_desc_base + (
                f" Approximately {affected} people affected." if affected > 0 else ""
            ),
            priority=priority,
            suggested_team=selected_team,
            estimated_duration_hours=est_hours,
            reasoning=reasoning,
            confidence=0.78,
            conflict_warnings=conflict_warnings,
            requires_human_approval=True,
        )

    def detect_conflicts(self, tasks: List[Dict]) -> List[Dict]:
        """Detect team assignment conflicts (same team on multiple critical tasks)."""
        conflicts = []
        team_tasks: Dict[str, List[Dict]] = {}

        for task in tasks:
            if task.get("status") in ("completed", "cancelled"):
                continue
            team = task.get("assigned_team")
            if team:
                team_tasks.setdefault(team, []).append(task)

        for team, team_task_list in team_tasks.items():
            critical_tasks = [t for t in team_task_list if t.get("priority") == "critical"]
            if len(critical_tasks) >= 2:
                conflicts.append({
                    "type": "team_overload",
                    "team": team,
                    "task_ids": [t["id"] for t in critical_tasks],
                    "message": f"Team '{team}' assigned to {len(critical_tasks)} simultaneous critical tasks",
                    "severity": "high",
                })

        return conflicts

    def _score_to_priority(self, score: float) -> str:
        if score >= 130:
            return "critical"
        elif score >= 80:
            return "high"
        elif score >= 40:
            return "medium"
        return "low"
