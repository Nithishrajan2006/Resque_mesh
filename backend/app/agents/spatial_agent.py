"""
ResQMesh Spatial Map Agent
Processes location updates and maintains map feature data.
Fully offline, no external geocoding required.
"""
import logging
import math
from typing import Optional, List, Dict, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# Feature type definitions
FEATURE_TYPES = ["incident", "shelter", "depot", "blocked_road", "team", "evacuation_route"]

# Severity colors for visualization
SEVERITY_COLORS = {
    "critical": "#ef4444",
    "high": "#f97316",
    "medium": "#eab308",
    "low": "#22c55e",
}

STATUS_COLORS = {
    "reported": "#60a5fa",
    "verified": "#818cf8",
    "active": "#ef4444",
    "responding": "#f97316",
    "resolved": "#22c55e",
    "closed": "#6b7280",
}


@dataclass
class ProcessedFeature:
    id: str
    feature_type: str
    name: str
    description: Optional[str]
    latitude: float
    longitude: float
    severity: Optional[str]
    status: Optional[str]
    color: str
    entity_id: Optional[str]
    is_synthetic: bool
    properties: Dict = field(default_factory=dict)
    distance_from_center: Optional[float] = None


@dataclass
class SpatialAnalysis:
    total_features: int
    incident_clusters: List[Dict]
    coverage_radius_km: float
    high_density_zones: List[Dict]
    nearest_shelter: Optional[Dict]
    nearest_depot: Optional[Dict]
    blocked_routes: List[Dict]


class SpatialMapAgent:
    """
    Processes location data and maintains map features.
    Uses locally stored coordinates — no online geocoding required.
    All coordinates for demo are synthetic (clearly labeled).
    """

    # Demo center point (fictional Millbrook Valley)
    DEFAULT_CENTER = (40.7128, -74.0060)

    def __init__(self):
        self.agent_name = "Spatial Map Agent"
        logger.info(f"{self.agent_name} initialized")

    def process_features(self, raw_features: List[Dict]) -> List[ProcessedFeature]:
        """Convert raw map features into display-ready processed features."""
        processed = []
        for feat in raw_features:
            color = self._get_feature_color(feat)
            distance = self._haversine_distance(
                self.DEFAULT_CENTER[0], self.DEFAULT_CENTER[1],
                feat.get("latitude", 0), feat.get("longitude", 0)
            )
            processed.append(ProcessedFeature(
                id=feat.get("id", ""),
                feature_type=feat.get("feature_type", "other"),
                name=feat.get("name", "Unknown"),
                description=feat.get("description"),
                latitude=feat.get("latitude", 0),
                longitude=feat.get("longitude", 0),
                severity=feat.get("severity"),
                status=feat.get("status"),
                color=color,
                entity_id=feat.get("entity_id"),
                is_synthetic=feat.get("is_synthetic", True),
                properties={
                    "source_device": feat.get("source_device_id", "local"),
                    "last_updated": feat.get("updated_at", ""),
                },
                distance_from_center=round(distance, 2),
            ))
        return processed

    def analyze_spatial_situation(
        self,
        features: List[ProcessedFeature],
        incidents: Optional[List[Dict]] = None,
    ) -> SpatialAnalysis:
        """Perform spatial analysis on the current feature set."""
        incident_features = [f for f in features if f.feature_type == "incident"]
        shelter_features = [f for f in features if f.feature_type == "shelter"]
        depot_features = [f for f in features if f.feature_type == "depot"]
        blocked_features = [f for f in features if f.feature_type == "blocked_road"]

        clusters = self._find_clusters(incident_features)
        coverage = self._calculate_coverage_radius(features)
        high_density = self._find_high_density_zones(incident_features)

        # Find nearest shelter to center
        nearest_shelter = None
        if shelter_features:
            shelter_features.sort(key=lambda f: f.distance_from_center or 999)
            nearest_shelter = {
                "name": shelter_features[0].name,
                "distance_km": shelter_features[0].distance_from_center,
                "latitude": shelter_features[0].latitude,
                "longitude": shelter_features[0].longitude,
            }

        # Find nearest depot
        nearest_depot = None
        if depot_features:
            depot_features.sort(key=lambda f: f.distance_from_center or 999)
            nearest_depot = {
                "name": depot_features[0].name,
                "distance_km": depot_features[0].distance_from_center,
                "latitude": depot_features[0].latitude,
                "longitude": depot_features[0].longitude,
            }

        return SpatialAnalysis(
            total_features=len(features),
            incident_clusters=clusters,
            coverage_radius_km=coverage,
            high_density_zones=high_density,
            nearest_shelter=nearest_shelter,
            nearest_depot=nearest_depot,
            blocked_routes=[{"name": f.name, "lat": f.latitude, "lon": f.longitude} for f in blocked_features],
        )

    def generate_demo_features(self) -> List[Dict]:
        """
        Generate synthetic map features for the Millbrook Valley demo scenario.
        All coordinates are clearly marked as synthetic/fictional.
        """
        base_lat, base_lon = 40.7128, -74.0060

        return [
            {
                "feature_type": "shelter",
                "name": "Millbrook Community Center",
                "description": "Primary emergency shelter — capacity 250",
                "latitude": base_lat + 0.015,
                "longitude": base_lon + 0.010,
                "severity": None,
                "status": "active",
                "is_synthetic": True,
            },
            {
                "feature_type": "shelter",
                "name": "Westside High School Gym",
                "description": "Secondary shelter — capacity 150",
                "latitude": base_lat - 0.012,
                "longitude": base_lon - 0.018,
                "severity": None,
                "status": "active",
                "is_synthetic": True,
            },
            {
                "feature_type": "depot",
                "name": "Central Supply Depot",
                "description": "Main supply storage and distribution point",
                "latitude": base_lat + 0.005,
                "longitude": base_lon - 0.012,
                "severity": None,
                "status": "active",
                "is_synthetic": True,
            },
            {
                "feature_type": "depot",
                "name": "North Medical Cache",
                "description": "Medical supply cache — priority distribution",
                "latitude": base_lat + 0.022,
                "longitude": base_lon + 0.005,
                "severity": None,
                "status": "active",
                "is_synthetic": True,
            },
            {
                "feature_type": "blocked_road",
                "name": "Route 7 Washout",
                "description": "Road flooded and impassable — use alternate Route 12",
                "latitude": base_lat - 0.008,
                "longitude": base_lon + 0.015,
                "severity": "high",
                "status": "active",
                "is_synthetic": True,
            },
            {
                "feature_type": "blocked_road",
                "name": "Bridge Street Closure",
                "description": "Bridge structural damage — closed to all traffic",
                "latitude": base_lat + 0.003,
                "longitude": base_lon + 0.022,
                "severity": "critical",
                "status": "active",
                "is_synthetic": True,
            },
            {
                "feature_type": "team",
                "name": "Rescue Alpha Position",
                "description": "Rescue Alpha team — currently at north flood zone",
                "latitude": base_lat + 0.009,
                "longitude": base_lon - 0.005,
                "severity": None,
                "status": "active",
                "is_synthetic": True,
            },
            {
                "feature_type": "team",
                "name": "Rescue Bravo Position",
                "description": "Rescue Bravo team — staged at community center",
                "latitude": base_lat + 0.016,
                "longitude": base_lon + 0.011,
                "severity": None,
                "status": "active",
                "is_synthetic": True,
            },
        ]

    def _get_feature_color(self, feature: Dict) -> str:
        if feature.get("feature_type") == "shelter":
            return "#06b6d4"  # cyan
        elif feature.get("feature_type") == "depot":
            return "#8b5cf6"  # violet
        elif feature.get("feature_type") == "blocked_road":
            return "#f97316"  # orange
        elif feature.get("feature_type") == "team":
            return "#10b981"  # emerald
        elif feature.get("feature_type") == "incident":
            return SEVERITY_COLORS.get(feature.get("severity", "medium"), "#eab308")
        return "#60a5fa"

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance in km between two lat/lon points."""
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    def _find_clusters(self, features: List[ProcessedFeature]) -> List[Dict]:
        """Find geographic clusters of incidents (simplified DBSCAN)."""
        clusters = []
        radius_km = 0.5
        visited = set()

        for i, feat in enumerate(features):
            if i in visited:
                continue
            cluster_members = [feat]
            for j, other in enumerate(features):
                if j != i and j not in visited:
                    dist = self._haversine_distance(feat.latitude, feat.longitude, other.latitude, other.longitude)
                    if dist <= radius_km:
                        cluster_members.append(other)
                        visited.add(j)

            if len(cluster_members) >= 2:
                center_lat = sum(f.latitude for f in cluster_members) / len(cluster_members)
                center_lon = sum(f.longitude for f in cluster_members) / len(cluster_members)
                clusters.append({
                    "size": len(cluster_members),
                    "center_lat": center_lat,
                    "center_lon": center_lon,
                    "feature_ids": [f.id for f in cluster_members],
                    "has_critical": any(f.severity == "critical" for f in cluster_members),
                })
            visited.add(i)

        return clusters

    def _calculate_coverage_radius(self, features: List[ProcessedFeature]) -> float:
        """Calculate radius covering all features."""
        if not features:
            return 0.0
        max_dist = max((f.distance_from_center or 0) for f in features)
        return round(max_dist, 2)

    def _find_high_density_zones(self, features: List[ProcessedFeature]) -> List[Dict]:
        """Identify zones with 3+ incidents within 1km."""
        zones = []
        for feat in features:
            nearby = [
                f for f in features
                if f.id != feat.id and
                self._haversine_distance(feat.latitude, feat.longitude, f.latitude, f.longitude) <= 1.0
            ]
            if len(nearby) >= 2:
                zones.append({
                    "center_lat": feat.latitude,
                    "center_lon": feat.longitude,
                    "incident_count": len(nearby) + 1,
                    "severity": "critical" if any(f.severity == "critical" for f in nearby) else "high",
                })

        # Deduplicate by proximity
        unique_zones = []
        for zone in zones:
            if not any(
                self._haversine_distance(zone["center_lat"], zone["center_lon"], z["center_lat"], z["center_lon"]) < 1.0
                for z in unique_zones
            ):
                unique_zones.append(zone)

        return unique_zones[:5]
