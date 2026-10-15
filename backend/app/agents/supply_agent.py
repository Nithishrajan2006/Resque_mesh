"""
ResQMesh Supply Agent
Calculates inventory from transactions and suggests safe allocations.
Fully offline, rule-based intelligence.
"""
import logging
from typing import Optional, List, Dict
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# Minimum required stock percentages before allocation
MINIMUM_RESERVE_RATIO = 0.15  # Keep at least 15% of max stock

CATEGORY_INCIDENT_MAP = {
    "medical": ["medicines", "medical_kits", "first_aid"],
    "flood": ["water", "food", "blankets", "medicines"],
    "fire": ["medicines", "water", "blankets"],
    "missing_person": ["food", "water", "blankets"],
    "blocked_road": ["fuel", "food", "water"],
    "earthquake": ["medicines", "food", "water", "blankets"],
    "other": ["food", "water"],
}

URGENCY_MULTIPLIERS = {
    "critical": 1.5,
    "high": 1.2,
    "medium": 1.0,
    "low": 0.7,
}


@dataclass
class AllocationSuggestion:
    supply_item_id: str
    supply_item_name: str
    suggested_quantity: float
    unit: str
    current_stock: float
    available_after: float
    reasoning: str
    confidence: float
    is_feasible: bool
    requires_human_approval: bool = True
    warnings: List[str] = field(default_factory=list)


@dataclass
class StockAnalysis:
    supply_item_id: str
    name: str
    current_stock: float
    unit: str
    minimum_stock: float
    status: str  # "adequate", "low", "critical", "empty"
    percentage: float
    warning: Optional[str] = None


class SupplyAgent:
    """
    Analyzes inventory levels and suggests safe allocations.
    Uses transaction-based stock calculation — no overwrite merges.
    """

    def __init__(self):
        self.agent_name = "Supply Agent"
        logger.info(f"{self.agent_name} initialized")

    def calculate_stock(self, transactions: List[Dict]) -> float:
        """
        Calculate current stock from transaction history.
        Additions are positive, distributions/adjustments can be negative.
        This is the ONLY safe way to get stock — never use latest timestamp.
        """
        total = 0.0
        for txn in transactions:
            qty = txn.get("quantity", 0)
            txn_type = txn.get("transaction_type", "addition")
            if txn_type == "addition":
                total += abs(qty)
            elif txn_type in ("distribution", "transfer"):
                total -= abs(qty)
            elif txn_type == "adjustment":
                total += qty  # Can be positive or negative
        return round(total, 2)

    def analyze_stock_levels(self, supply_items: List[Dict]) -> List[StockAnalysis]:
        """Analyze all supply items and flag low/critical levels."""
        results = []
        for item in supply_items:
            current = item.get("current_stock", 0.0)
            minimum = item.get("minimum_stock", 0.0)

            if current <= 0:
                status = "empty"
                pct = 0.0
                warning = f"⚠️ {item['name']} is completely depleted!"
            elif minimum > 0 and current < minimum:
                status = "critical"
                pct = (current / minimum) * 100
                warning = f"⚠️ {item['name']} below minimum stock ({current:.0f} < {minimum:.0f} {item.get('unit', 'units')})"
            elif minimum > 0 and current < minimum * 1.5:
                status = "low"
                pct = (current / minimum) * 100
                warning = f"Low stock: {item['name']} at {pct:.0f}% of minimum"
            else:
                status = "adequate"
                pct = 100.0 if minimum == 0 else min((current / minimum) * 100, 200)
                warning = None

            results.append(StockAnalysis(
                supply_item_id=item["id"],
                name=item["name"],
                current_stock=current,
                unit=item.get("unit", "units"),
                minimum_stock=minimum,
                status=status,
                percentage=round(pct, 1),
                warning=warning,
            ))

        return results

    def suggest_allocation(
        self,
        incident: Dict,
        supply_items: List[Dict],
    ) -> List[AllocationSuggestion]:
        """
        Suggest supply allocations for an incident.
        NEVER automatically commits — returns suggestions requiring human approval.
        """
        category = incident.get("category", "other")
        severity = incident.get("severity", "medium")
        affected_count = incident.get("affected_count", 1)

        relevant_categories = CATEGORY_INCIDENT_MAP.get(category, ["food", "water"])
        urgency_mult = URGENCY_MULTIPLIERS.get(severity, 1.0)

        suggestions = []

        for item in supply_items:
            item_name_lower = item["name"].lower()
            item_cat_lower = item.get("category", "").lower()

            # Check if this item is relevant
            is_relevant = any(
                rel in item_name_lower or rel in item_cat_lower
                for rel in relevant_categories
            )
            if not is_relevant:
                continue

            current_stock = item.get("current_stock", 0.0)
            if current_stock <= 0:
                suggestions.append(AllocationSuggestion(
                    supply_item_id=item["id"],
                    supply_item_name=item["name"],
                    suggested_quantity=0,
                    unit=item.get("unit", "units"),
                    current_stock=0,
                    available_after=0,
                    reasoning=f"Cannot allocate — {item['name']} is depleted",
                    confidence=0.99,
                    is_feasible=False,
                    warnings=["⚠️ Stock depleted — resupply needed"],
                ))
                continue

            # Calculate suggested quantity based on affected people
            base_qty = self._base_quantity(item_name_lower, affected_count)
            suggested_qty = round(base_qty * urgency_mult, 1)

            # Enforce minimum reserve
            max_allocatable = current_stock * (1 - MINIMUM_RESERVE_RATIO)
            warnings = []

            if suggested_qty > max_allocatable:
                suggested_qty = round(max_allocatable * 0.9, 1)
                warnings.append(f"⚠️ Reduced to {suggested_qty} {item.get('unit')} to maintain safety reserve")

            if suggested_qty <= 0:
                is_feasible = False
                warnings.append("⚠️ Insufficient stock for safe allocation")
            else:
                is_feasible = True

            available_after = round(current_stock - suggested_qty, 2)

            reasoning = (
                f"Incident category '{category}' with severity '{severity}' "
                f"affecting ~{affected_count} people. "
                f"Base quantity: {base_qty} {item.get('unit', 'units')}, "
                f"urgency multiplier: {urgency_mult}x. "
                f"Current stock: {current_stock} {item.get('unit', 'units')}, "
                f"remaining after: {available_after} {item.get('unit', 'units')}."
            )

            suggestions.append(AllocationSuggestion(
                supply_item_id=item["id"],
                supply_item_name=item["name"],
                suggested_quantity=suggested_qty,
                unit=item.get("unit", "units"),
                current_stock=current_stock,
                available_after=available_after,
                reasoning=reasoning,
                confidence=0.72,
                is_feasible=is_feasible,
                warnings=warnings,
                requires_human_approval=True,
            ))

        return suggestions

    def _base_quantity(self, item_name: str, affected_count: int) -> float:
        """Calculate base quantity needed per affected person."""
        affected = max(1, affected_count)

        if "water" in item_name:
            return affected * 3.0  # 3 liters/person/day
        elif "food" in item_name or "meal" in item_name:
            return affected * 2.0  # 2 meals/person/day
        elif "blanket" in item_name:
            return affected * 1.2  # 1.2 per person (spare)
        elif "medicine" in item_name or "medical" in item_name or "kit" in item_name:
            return max(5, affected * 0.3)  # 30% needing medical
        elif "fuel" in item_name:
            return 50.0  # Standard vehicle fuel
        else:
            return affected * 0.5
