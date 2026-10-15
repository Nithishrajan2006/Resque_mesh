import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';

// Mock Leaflet and Canvas
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="leaflet-map">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: any) => <div data-testid="map-marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="map-popup">{children}</div>,
  Circle: () => <div data-testid="map-circle" />,
  ZoomControl: () => <div data-testid="zoom-control" />,
}));

// Mock API
vi.mock('../lib/api', () => ({
  checkHealth: vi.fn().mockResolvedValue({ data: { status: 'online' } }),
  getDashboardStats: vi.fn().mockResolvedValue({
    data: {
      total_incidents: 5,
      critical_incidents: 2,
      active_tasks: 3,
      completed_tasks: 1,
      available_supply_units: 8250,
      online_peers: 3,
      pending_sync: 0,
      conflicts: 0,
      last_updated: new Date().toISOString(),
    },
  }),
  listIncidents: vi.fn().mockResolvedValue({ data: [] }),
  listTasks: vi.fn().mockResolvedValue({ data: [] }),
  getInventorySummary: vi.fn().mockResolvedValue({ data: { items: [] } }),
  listAuditLogs: vi.fn().mockResolvedValue({ data: [] }),
  listPeers: vi.fn().mockResolvedValue({ data: [] }),
  getNetworkStatus: vi.fn().mockResolvedValue({ data: {} }),
  listSyncMessages: vi.fn().mockResolvedValue({ data: [] }),
  getSyncStats: vi.fn().mockResolvedValue({ data: {} }),
  listConflicts: vi.fn().mockResolvedValue({ data: [] }),
  getMapFeatures: vi.fn().mockResolvedValue({ data: { features: [] } }),
  loadDemo: vi.fn().mockResolvedValue({ data: {} }),
  resetDemo: vi.fn().mockResolvedValue({ data: {} }),
}));

describe('ResQMesh Frontend Core Suite', () => {
  it('renders application brand and navigation elements', async () => {
    render(<App />);
    expect(screen.getByText('ResQMesh')).toBeInTheDocument();
    expect(screen.getByText('Command Center')).toBeInTheDocument();
    expect(screen.getByText('Incident Management')).toBeInTheDocument();
    expect(screen.getByText('Task Coordination')).toBeInTheDocument();
    expect(screen.getByText('Relief Inventory')).toBeInTheDocument();
    expect(screen.getByText('Disaster Map')).toBeInTheDocument();
    expect(screen.getByText('Peer Network')).toBeInTheDocument();
    expect(screen.getByText('Sync Center')).toBeInTheDocument();
  });

  it('renders tactical command center title', async () => {
    render(<App />);
    expect(screen.getByText('DISASTER RESPONSE COMMAND CENTER')).toBeInTheDocument();
  });
});
