"""
ResQMesh Incident Agent
Validates, classifies, and prioritizes incident reports.
Runs fully offline with transparent rule-based logic.
"""
import logging
import re
from typing import Optional, List, Dict, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# Severity weights for scoring
SEVERITY_WEIGHTS = {
    "critical": 100,
    "high": 60,
    "medium": 30,
    "low": 10,
}

# Category urgency multipliers
CATEGORY_URGENCY = {
    "medical": 1.5,
    "fire": 1.4,
    "missing_person": 1.3,
    "flood": 1.2,
    "earthquake": 1.2,
    "landslide": 1.1,
    "blocked_road": 0.9,
    "other": 0.8,
}

# Keywords that escalate severity
CRITICAL_KEYWORDS = [
    "death", "dead", "dying", "trapped", "unconscious", "fire", "explosion",
    "collapse", "critical", "emergency", "urgent", "sos", "mayday",
    "children", "infant", "baby", "multiple casualties", "mass casualty"
]

HIGH_KEYWORDS = [
    "injured", "hurt", "flood", "missing", "stranded", "isolated",
    "rising water", "evacuation", "unstable", "danger"
]


@dataclass
class IncidentAnalysis:
    incident_id: str
    priority_score: float
    suggested_severity: str
    confidence: float
    flags: List[str] = field(default_factory=list)
    reasoning: str = ""
    is_potential_duplicate: bool = False
    duplicate_of: Optional[str] = None
    requires_immediate_response: bool = False
    recommended_actions: List[str] = field(default_factory=list)


class IncidentAgent:
    """
    Validates and classifies incident reports using transparent rule-based logic.
    No external LLM required - fully offline capable.
    """

    def __init__(self):
        self.agent_name = "Incident Agent"
        logger.info(f"{self.agent_name} initialized")

    def analyze_incident(
        self,
        incident_id: str,
        title: str,
        description: Optional[str],
        category: str,
        severity: str,
        affected_count: int,
        latitude: Optional[float],
        longitude: Optional[float],
        created_at: datetime,
        existing_incidents: Optional[List[Dict]] = None,
    ) -> IncidentAnalysis:
        """
        Analyze a single incident and return priority score, severity suggestion,
        flags, and recommended actions.
        """
        analysis = IncidentAnalysis(
            incident_id=incident_id,
            priority_score=0.0,
            suggested_severity=severity,
            confidence=0.7,
        )

        # Step 1: Base score from reported severity
        base_score = SEVERITY_WEIGHTS.get(severity, 30)

        # Step 2: Category urgency multiplier
        urgency_mult = CATEGORY_URGENCY.get(category, 0.8)

        # Step 3: Affected count scaling
        affected_bonus = min(affected_count * 0.5, 30)

        # Step 4: Keyword analysis on title + description
        full_text = f"{title} {description or ''}".lower()
        keyword_score = 0
        found_critical = []
        found_high = []

        for kw in CRITICAL_KEYWORDS:
            if kw in full_text:
                keyword_score += 15
                found_critical.append(kw)

        for kw in HIGH_KEYWORDS:
            if kw in full_text:
                keyword_score += 7
                found_high.append(kw)

        keyword_score = min(keyword_score, 40)

        # Step 5: Time decay (older reports get slight penalty for priority queue)
        if created_at and created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        age_minutes = max(0, (datetime.now(timezone.utc) - created_at).total_seconds() / 60)
        time_penalty = min(age_minutes * 0.1, 20)

        # Calculate final score
        analysis.priority_score = round(
            (base_score + affected_bonus + keyword_score) * urgency_mult - time_penalty,
            2
        )

        # Step 6: Suggest severity adjustment based on keywords
        if found_critical and severity not in ("critical",):
            analysis.suggested_severity = "critical" if len(found_critical) >= 2 else "high"
            analysis.flags.append(f"⚠️ Critical keywords detected: {', '.join(found_critical[:3])}")
            analysis.confidence = 0.85
        elif found_high and severity == "low":
            analysis.suggested_severity = "medium"
            analysis.flags.append(f"⚠️ High-urgency keywords: {', '.join(found_high[:3])}")
            analysis.confidence = 0.75

        # Step 7: Immediate response flag
        if analysis.suggested_severity == "critical" or (
            category in ("medical", "fire") and severity in ("critical", "high")
        ):
            analysis.requires_immediate_response = True
            analysis.flags.append("🚨 IMMEDIATE RESPONSE REQUIRED")

        # Step 8: Duplicate detection
        if existing_incidents:
            analysis.is_potential_duplicate, analysis.duplicate_of = self._check_duplicate(
                title, latitude, longitude, created_at, existing_incidents, incident_id
            )
            if analysis.is_potential_duplicate:
                analysis.flags.append(f"⚠️ Possible duplicate of {analysis.duplicate_of}")

        # Step 9: Recommended actions
        analysis.recommended_actions = self._get_recommended_actions(
            category, analysis.suggested_severity, affected_count
        )

        # Build reasoning string
        reasoning_parts = [
            f"Base severity score: {base_score} (reported: {severity})",
            f"Category urgency multiplier: {urgency_mult}x ({category})",
            f"Affected count bonus: +{affected_bonus:.1f} ({affected_count} people)",
            f"Keyword analysis: +{keyword_score} (critical: {len(found_critical)}, high: {len(found_high)})",
            f"Time penalty: -{time_penalty:.1f} (age: {age_minutes:.0f} min)",
            f"Final priority score: {analysis.priority_score}",
        ]
        if analysis.suggested_severity != severity:
            reasoning_parts.append(
                f"Severity upgrade suggested: {severity} → {analysis.suggested_severity}"
            )
        analysis.reasoning = " | ".join(reasoning_parts)

        logger.info(
            f"Incident {incident_id} analyzed: score={analysis.priority_score}, "
            f"severity={analysis.suggested_severity}, duplicate={analysis.is_potential_duplicate}"
        )
        return analysis

    def _check_duplicate(
        self,
        title: str,
        lat: Optional[float],
        lon: Optional[float],
        created_at: datetime,
        existing_incidents: List[Dict],
        current_id: str,
    ) -> Tuple[bool, Optional[str]]:
        """Check if this incident is likely a duplicate of an existing one."""
        title_words = set(title.lower().split())

        if created_at and created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        for inc in existing_incidents:
            if inc.get("id") == current_id:
                continue

            # Check time proximity (within 2 hours)
            try:
                inc_time = inc.get("created_at")
                if isinstance(inc_time, str):
                    inc_time = datetime.fromisoformat(inc_time.replace("Z", "+00:00"))
                if inc_time:
                    if inc_time.tzinfo is None:
                        inc_time = inc_time.replace(tzinfo=timezone.utc)
                    if abs((created_at - inc_time).total_seconds()) > 7200:
                        continue
            except Exception:
                pass

            # Title similarity (>60% word overlap)
            inc_words = set(inc.get("title", "").lower().split())
            if inc_words and len(title_words & inc_words) / len(title_words | inc_words) > 0.6:
                # Spatial proximity check (within ~500m)
                if lat and lon and inc.get("latitude") and inc.get("longitude"):
                    dlat = abs(lat - inc["latitude"])
                    dlon = abs(lon - inc["longitude"])
                    if dlat < 0.005 and dlon < 0.005:
                        return True, inc["id"]

                # Even without GPS, title match alone is a weak duplicate signal
                return True, inc["id"]

        return False, None

    def _get_recommended_actions(
        self, category: str, severity: str, affected_count: int
    ) -> List[str]:
        """Return context-appropriate response recommendations."""
        actions = []

        if severity == "critical":
            actions.append("Dispatch nearest available rescue team immediately")
            actions.append("Alert regional emergency coordinator")

        if category == "medical":
            actions.append("Contact medical unit / paramedics")
            actions.append("Assess need for triage support")
        elif category == "fire":
            actions.append("Dispatch fire suppression team")
            actions.append("Establish evacuation perimeter")
        elif category == "flood":
            actions.append("Deploy water rescue team if available")
            actions.append("Check shelter capacity at high-ground locations")
        elif category == "missing_person":
            actions.append("Initiate search pattern from last known location")
            actions.append("Alert neighboring teams to expand search radius")
        elif category == "blocked_road":
            actions.append("Reroute incoming supply convoys")
            actions.append("Assess if road clearance is feasible")

        if affected_count > 20:
            actions.append(f"Coordinate mass-casualty resources ({affected_count} affected)")

        return actions[:5]  # Cap at 5 recommendations

    def prioritize_all(self, incidents: List[Dict]) -> List[Dict]:
        """
        Rank a list of incidents by priority score.
        Returns list of dicts with id, score, severity, flags.
        """
        results = []
        for inc in incidents:
            analysis = self.analyze_incident(
                incident_id=inc.get("id", "unknown"),
                title=inc.get("title", ""),
                description=inc.get("description"),
                category=inc.get("category", "other"),
                severity=inc.get("severity", "medium"),
                affected_count=inc.get("affected_count", 0),
                latitude=inc.get("latitude"),
                longitude=inc.get("longitude"),
                created_at=inc.get("created_at", datetime.now(timezone.utc)),
                existing_incidents=incidents,
            )
            results.append({
                "id": inc.get("id"),
                "title": inc.get("title"),
                "priority_score": analysis.priority_score,
                "suggested_severity": analysis.suggested_severity,
                "confidence": analysis.confidence,
                "flags": analysis.flags,
                "reasoning": analysis.reasoning,
                "requires_immediate_response": analysis.requires_immediate_response,
                "recommended_actions": analysis.recommended_actions,
                "is_potential_duplicate": analysis.is_potential_duplicate,
                "duplicate_of": analysis.duplicate_of,
            })

        results.sort(key=lambda x: x["priority_score"], reverse=True)
        return results
