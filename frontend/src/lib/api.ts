/**
 * ResQMesh API Client
 * Centralized HTTP client with error handling
 */
import axios from 'axios';

const API_ORIGIN = (import.meta.env.VITE_API_URL || '').trim();
const BASE_URL = API_ORIGIN ? `${API_ORIGIN.replace(/\/$/, '')}/api` : '/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.detail || err.message || 'Network error';
    console.error('API Error:', msg);
    return Promise.reject(err);
  }
);

// Health
export const checkHealth = () => api.get('/health');

// Dashboard
export const getDashboardStats = () => api.get('/agents/dashboard/stats');

// Incidents
export const listIncidents = (params?: Record<string, string>) =>
  api.get('/incidents/', { params });
export const createIncident = (data: any) => api.post('/incidents/', data);
export const getIncident = (id: string) => api.get(`/incidents/${id}`);
export const updateIncident = (id: string, data: any) => api.put(`/incidents/${id}`, data);
export const deleteIncident = (id: string) => api.delete(`/incidents/${id}`);
export const verifyIncident = (id: string) => api.post(`/incidents/${id}/verify`);
export const getIncidentStats = () => api.get('/incidents/stats/summary');

// Tasks
export const listTasks = (params?: Record<string, string>) =>
  api.get('/tasks/', { params });
export const createTask = (data: any) => api.post('/tasks/', data);
export const getTask = (id: string) => api.get(`/tasks/${id}`);
export const updateTask = (id: string, data: any) => api.put(`/tasks/${id}`, data);
export const approveTask = (id: string, data: any) => api.post(`/tasks/${id}/approve`, data);
export const startTask = (id: string) => api.post(`/tasks/${id}/start`);
export const completeTask = (id: string) => api.post(`/tasks/${id}/complete`);
export const checkTaskConflicts = () => api.get('/tasks/conflicts/check');

// Inventory
export const listSupplyItems = () => api.get('/inventory/items');
export const createSupplyItem = (data: any) => api.post('/inventory/items', data);
export const getSupplyItem = (id: string) => api.get(`/inventory/items/${id}`);
export const updateSupplyItem = (id: string, data: any) => api.put(`/inventory/items/${id}`, data);
export const createTransaction = (data: any) => api.post('/inventory/transactions', data);
export const listTransactions = (params?: Record<string, string>) =>
  api.get('/inventory/transactions', { params });
export const getInventorySummary = () => api.get('/inventory/summary');

// Peers
export const listPeers = () => api.get('/peers/');
export const createPeer = (data: any) => api.post('/peers/', data);
export const connectPeer = (deviceId: string) => api.post(`/peers/${deviceId}/connect`);
export const disconnectPeer = (deviceId: string) => api.post(`/peers/${deviceId}/disconnect`);
export const syncPeer = (deviceId: string) => api.post(`/peers/${deviceId}/sync`);
export const getNetworkStatus = () => api.get('/peers/network/status');
export const sendPeerMessage = (params: {
  source_device_id: string;
  destination_device_id: string;
  payload_type: string;
  payload: string;
  priority?: number;
}) => api.post('/peers/message/send', null, { params });

// Sync
export const listSyncMessages = (params?: Record<string, string>) =>
  api.get('/sync/messages', { params });
export const getSyncStats = () => api.get('/sync/stats');
export const listConflicts = (params?: Record<string, any>) =>
  api.get('/sync/conflicts', { params });
export const resolveConflict = (id: string, data: any) =>
  api.post(`/sync/conflicts/${id}/resolve`, data);
export const retryFailedMessages = () => api.post('/sync/messages/retry');
export const processQueuedMessages = () => api.post('/sync/process');

// Audit
export const listAuditLogs = (params?: Record<string, string>) =>
  api.get('/audit/', { params });
export const getActionSummary = () => api.get('/audit/actions/summary');

// Agents
export const analyzeIncident = (id: string) => api.get(`/agents/incident/analyze/${id}`);
export const getIncidentSuggestions = () => api.get('/agents/incident/suggestions');
export const getTaskSuggestions = () => api.get('/agents/task/suggestions');
export const suggestTaskForIncident = (incidentId: string) =>
  api.post(`/agents/task/suggest/${incidentId}`);
export const getSupplyAnalysis = () => api.get('/agents/supply/analysis');
export const suggestAllocation = (incidentId: string) =>
  api.post('/agents/supply/suggest-allocation', null, { params: { incident_id: incidentId } });
export const getMapFeatures = () => api.get('/agents/map/features');

// Demo
export const getDemoStatus = () => api.get('/demo/status');
export const loadDemo = () => api.post('/demo/load');
export const resetDemo = () => api.post('/demo/reset');
export const simulateStep = (step: number) => api.post(`/demo/simulate/step/${step}`);
export const getWorkflowDescription = () => api.get('/demo/workflow');
