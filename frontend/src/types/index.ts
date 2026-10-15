export type IncidentCategory =
  | 'flood'
  | 'fire'
  | 'medical'
  | 'blocked_road'
  | 'missing_person'
  | 'earthquake'
  | 'landslide'
  | 'other';

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

export type IncidentStatus =
  | 'reported'
  | 'verified'
  | 'active'
  | 'responding'
  | 'resolved'
  | 'closed';

export type TaskStatus =
  | 'unassigned'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type TransactionType =
  | 'addition'
  | 'distribution'
  | 'adjustment'
  | 'transfer';

export type PeerStatus = 'online' | 'offline' | 'syncing' | 'reconnecting';

export type MessageStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'acknowledged';

export interface RescueTask {
  id: string;
  incident_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_team?: string;
  assigned_to?: string;
  estimated_duration_hours?: number;
  ai_suggested: boolean;
  ai_reasoning?: string;
  human_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  source_device_id: string;
  version: number;
}

export interface Incident {
  id: string;
  title: string;
  description?: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  latitude?: number;
  longitude?: number;
  location_label?: string;
  source_device_id: string;
  reported_by?: string;
  is_verified: boolean;
  is_synthetic: boolean;
  affected_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  version: number;
  tasks: RescueTask[];
}

export interface InventoryTransaction {
  id: string;
  supply_item_id: string;
  transaction_type: TransactionType;
  quantity: number;
  notes?: string;
  performed_by?: string;
  destination?: string;
  incident_id?: string;
  ai_suggested: boolean;
  human_approved: boolean;
  idempotency_key?: string;
  created_at: string;
  device_id: string;
}

export interface SupplyItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  location_id?: string;
  location_label?: string;
  latitude?: number;
  longitude?: number;
  minimum_stock: number;
  current_stock: number;
  created_at: string;
  updated_at: string;
  transactions: InventoryTransaction[];
}

export interface Peer {
  id: string;
  device_id: string;
  name: string;
  status: PeerStatus;
  ip_address?: string;
  port?: number;
  last_seen?: string;
  last_sync?: string;
  is_simulated: boolean;
  description?: string;
  pending_messages: number;
  messages_sent: number;
  messages_received: number;
  battery_level?: number;
  sync_status?: string;
  created_at: string;
}

export interface SyncMessage {
  id: string;
  message_id: string;
  source_device_id: string;
  destination_device_id?: string;
  payload_type: string;
  payload?: string;
  priority: number;
  status: MessageStatus;
  hop_count: number;
  delivery_attempts: number;
  last_attempt_at?: string;
  delivered_at?: string;
  acknowledged_at?: string;
  created_at: string;
  schema_version: string;
}

export interface ConflictRecord {
  id: string;
  entity_type: string;
  entity_id: string;
  local_version: string;
  remote_version: string;
  conflict_type: string;
  detected_at: string;
  resolution?: string;
  resolved_by?: string;
  resolved_at?: string;
  resolved: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  performed_by: string;
  device_id: string;
  details?: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

export interface MapFeature {
  id: string;
  feature_type: 'incident' | 'shelter' | 'depot' | 'blocked_road' | 'team' | 'drone';
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  severity?: string;
  status?: string;
  color?: string;
  entity_id?: string;
  is_synthetic: boolean;
  properties?: Record<string, any>;
  distance_from_center?: number;
}

export interface DashboardStats {
  total_incidents: number;
  critical_incidents: number;
  active_tasks: number;
  completed_tasks: number;
  available_supply_units: number;
  online_peers: number;
  pending_sync: number;
  conflicts: number;
  last_updated: string;
}
