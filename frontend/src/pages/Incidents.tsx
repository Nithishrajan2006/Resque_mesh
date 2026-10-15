import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  ShieldAlert, 
  MapPin, 
  Clock, 
  Cpu, 
  X,
  AlertCircle,
  Eye
} from 'lucide-react';
import { 
  listIncidents, 
  createIncident, 
  verifyIncident, 
  analyzeIncident 
} from '../lib/api';
import { Incident, IncidentCategory, IncidentSeverity } from '../types';
import { IncidentIntelligenceModal } from '../components/IncidentIntelligenceModal';

export const Incidents: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  
  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'flood' as IncidentCategory,
    severity: 'medium' as IncidentSeverity,
    latitude: 40.7128,
    longitude: -74.006,
    location_label: '',
    affected_count: 0,
    source_device_id: 'local-operator',
    reported_by: 'Field Officer',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // AI Agent Modal
  const [selectedAnalysis, setSelectedAnalysis] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [selectedDossierIncident, setSelectedDossierIncident] = useState<Incident | null>(null);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filterSeverity) params.severity = filterSeverity;
      if (filterCategory) params.category = filterCategory;
      const res = await listIncidents(params);
      setIncidents(res.data);
    } catch (err) {
      console.error('Error fetching incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [search, filterSeverity, filterCategory]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await createIncident(formData);
      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        category: 'flood',
        severity: 'medium',
        latitude: 40.7128,
        longitude: -74.006,
        location_label: '',
        affected_count: 0,
        source_device_id: 'local-operator',
        reported_by: 'Field Officer',
      });
      fetchIncidents();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'object' && detail?.message) {
        setFormError(`${detail.message} (Existing ID: ${detail.existing_id})`);
      } else {
        setFormError(detail || 'Failed to submit incident');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await verifyIncident(id);
      fetchIncidents();
    } catch (err) {
      console.error('Failed to verify incident:', err);
    }
  };

  const handleAnalyze = async (id: string) => {
    setIsAnalyzing(true);
    try {
      const res = await analyzeIncident(id);
      setSelectedAnalysis(res.data);
    } catch (err) {
      console.error('Failed to analyze incident:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            INCIDENT MANAGEMENT
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Validate, classify, and track emergency field reports across disconnected zones.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary !text-xs !py-2 !px-4"
        >
          <Plus className="w-4 h-4" />
          <span>Report New Incident</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title, description, or landmark..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="select-field"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="select-field"
          >
            <option value="">All Categories</option>
            <option value="flood">Flood</option>
            <option value="fire">Fire</option>
            <option value="medical">Medical</option>
            <option value="blocked_road">Blocked Road</option>
            <option value="missing_person">Missing Person</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Incidents List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {incidents.map((inc) => {
          const isCritical = inc.severity === 'critical';
          const isWarning = inc.severity === 'high' || inc.severity === 'medium';

          return (
            <div
              key={inc.id}
              onClick={() => setSelectedDossierIncident(inc)}
              className={`glass-card rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-[1.01] border flex flex-col justify-between ${
                isCritical
                  ? 'border-red-500/40 hover:border-red-400 shadow-lg shadow-red-500/5'
                  : isWarning
                  ? 'border-amber-500/30 hover:border-amber-400'
                  : 'border-white/[0.08] hover:border-cyan-500/40'
              }`}
            >
              {/* Top Visual Disaster Graphic Banner */}
              <div className="h-32 w-full relative overflow-hidden bg-[#071324] border-b border-white/[0.08]">
                {/* SVG Visual Graphic by category */}
                <svg viewBox="0 0 320 120" className="w-full h-full object-cover">
                  <defs>
                    <linearGradient id={`grad-${inc.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={isCritical ? '#450a0a' : isWarning ? '#451a03' : '#082f49'} />
                      <stop offset="100%" stopColor="#071324" />
                    </linearGradient>
                  </defs>
                  <rect width="320" height="120" fill={`url(#grad-${inc.id})`} />
                  
                  {/* Category-specific geometry */}
                  {inc.category === 'flood' ? (
                    <g>
                      <path d="M 0,70 Q 80,45 160,75 T 320,65 L 320,120 L 0,120 Z" fill="#0284c7" fillOpacity="0.4" />
                      <circle cx="160" cy="70" r="16" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
                      <text x="160" y="74" fill="#ffffff" fontSize="12" textAnchor="middle">🚤</text>
                    </g>
                  ) : inc.category === 'fire' ? (
                    <g>
                      <circle cx="160" cy="60" r="28" fill="#ef4444" fillOpacity="0.3" />
                      <circle cx="160" cy="60" r="14" fill="#f97316" fillOpacity="0.5" />
                      <text x="160" y="65" fill="#ffffff" fontSize="14" textAnchor="middle">🔥</text>
                    </g>
                  ) : inc.category === 'medical' ? (
                    <g>
                      <circle cx="160" cy="60" r="24" fill="#10b981" fillOpacity="0.25" stroke="#10b981" strokeWidth="1" />
                      <text x="160" y="65" fill="#ffffff" fontSize="14" textAnchor="middle">🚑</text>
                    </g>
                  ) : inc.category === 'blocked_road' ? (
                    <g>
                      <line x1="80" y1="40" x2="240" y2="90" stroke="#f59e0b" strokeWidth="4" strokeDasharray="8,4" />
                      <text x="160" y="70" fill="#ffffff" fontSize="14" textAnchor="middle">🚧</text>
                    </g>
                  ) : (
                    <g>
                      <circle cx="160" cy="60" r="20" fill="#8b5cf6" fillOpacity="0.25" />
                      <text x="160" y="65" fill="#ffffff" fontSize="14" textAnchor="middle">📍</text>
                    </g>
                  )}
                  {/* Grid lines */}
                  <line x1="0" y1="30" x2="320" y2="30" stroke="rgba(255,255,255,0.05)" />
                  <line x1="0" y1="60" x2="320" y2="60" stroke="rgba(255,255,255,0.05)" />
                  <line x1="0" y1="90" x2="320" y2="90" stroke="rgba(255,255,255,0.05)" />
                </svg>

                {/* Severity Badge overlay */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black uppercase shadow-lg ${
                      isCritical
                        ? 'bg-red-600 text-white shadow-red-500/30 animate-pulse'
                        : isWarning
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-emerald-500 text-slate-950 font-bold'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-white" />
                    {inc.severity.toUpperCase()}
                  </span>

                  <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-cyan-300 border border-white/10 uppercase">
                    {inc.category.replace('_', ' ')}
                  </span>
                </div>

                {/* AI Priority & Verified overlay */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                  {inc.is_verified ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      VERIFIED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      UNCONFIRMED
                    </span>
                  )}
                </div>

                {/* Bottom Graphic HUD */}
                <div className="absolute bottom-1.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>AI PRIORITY: {inc.severity === 'critical' ? '0.95 URGENT' : 'EVALUATED'}</span>
                  <span className="text-cyan-300 group-hover:underline">Click for Dossier ➔</span>
                </div>
              </div>

              {/* Card Body Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition line-clamp-1">
                    {inc.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {inc.description || 'No description provided.'}
                  </p>
                </div>

                {/* Key Metadata Fields */}
                <div className="space-y-1.5 pt-2 border-t border-white/[0.06] text-xs font-mono text-slate-300">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate text-slate-200">
                      {inc.location_label || `${inc.latitude?.toFixed(4)}, ${inc.longitude?.toFixed(4)}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">People:</span>
                      <strong className="text-amber-400">~{inc.affected_count || 12}</strong>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">Time:</span>
                      <span className="text-slate-300">
                        {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">Device:</span>
                      <span className="text-cyan-300">{inc.source_device_id}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">Reporter:</span>
                      <span className="text-slate-300 truncate">{inc.reported_by || 'Field Unit'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Action Footer */}
              <div className="p-3 border-t border-white/[0.06] bg-black/20 flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDossierIncident(inc);
                  }}
                  className="btn-secondary !text-[11px] !py-1 !px-2.5 text-cyan-300 border-cyan-500/30 hover:border-cyan-400"
                >
                  <Eye className="w-3 h-3 text-cyan-400" />
                  <span>Inspect Intelligence</span>
                </button>

                {!inc.is_verified && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVerify(inc.id);
                    }}
                    className="btn-success !text-[11px] !py-1 !px-2.5"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Confirm</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {incidents.length === 0 && !loading && (
          <div className="col-span-full text-center py-16 glass-card text-slate-500 text-xs">
            No incidents matched your query.
          </div>
        )}
      </div>

      {/* Modal: Report Incident */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full bg-[#0a1628] border-white/20 p-6 space-y-4 shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-cyan-400" />
                Report Field Incident
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Incident Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flash Flood at Elm Bridge"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as IncidentCategory })}
                    className="select-field"
                  >
                    <option value="flood">Flood</option>
                    <option value="fire">Fire</option>
                    <option value="medical">Medical</option>
                    <option value="blocked_road">Blocked Road</option>
                    <option value="missing_person">Missing Person</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Reported Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as IncidentSeverity })}
                    className="select-field"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Location Label</label>
                <input
                  type="text"
                  placeholder="e.g. Mile Marker 14, Riverbend"
                  value={formData.location_label}
                  onChange={(e) => setFormData({ ...formData, location_label: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Affected Count</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.affected_count}
                    onChange={(e) => setFormData({ ...formData, affected_count: parseInt(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  placeholder="Specific details, hazards, trapped people, water speed..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary !text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary !text-xs"
                >
                  {isSubmitting ? 'Submitting...' : 'Transmit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: AI Agent Incident Analysis */}
      {selectedAnalysis && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-xl w-full bg-[#0a1628] border-cyan-500/30 p-6 space-y-4 shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">
                  Incident Agent Evaluation (Offline Rule Engine)
                </h2>
              </div>
              <button onClick={() => setSelectedAnalysis(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-500/[0.08] border border-cyan-500/20">
                <div>
                  <span className="text-[10px] uppercase font-mono text-cyan-400">Calculated Priority Score</span>
                  <div className="text-2xl font-black text-cyan-300">
                    {selectedAnalysis.priority_score}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Recommended Severity</span>
                  <div className="text-base font-bold text-amber-300">
                    {selectedAnalysis.suggested_severity.toUpperCase()}
                  </div>
                </div>
              </div>

              {selectedAnalysis.flags.length > 0 && (
                <div className="space-y-1">
                  <span className="font-semibold text-slate-300">Detected Signals & Flags:</span>
                  <div className="space-y-1">
                    {selectedAnalysis.flags.map((f: string, idx: number) => (
                      <div key={idx} className="p-2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px]">
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <span className="font-semibold text-slate-300">Explainable Reasoning:</span>
                <p className="p-2.5 rounded bg-white/[0.03] border border-white/[0.06] text-slate-300 text-[11px] leading-relaxed">
                  {selectedAnalysis.reasoning}
                </p>
              </div>

              {selectedAnalysis.recommended_actions.length > 0 && (
                <div className="space-y-1">
                  <span className="font-semibold text-slate-300">Actionable Directives:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                    {selectedAnalysis.recommended_actions.map((act: string, idx: number) => (
                      <li key={idx}>{act}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex justify-end">
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="btn-secondary !text-xs"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incident Intelligence Modal */}
      {selectedDossierIncident && (
        <IncidentIntelligenceModal
          incident={selectedDossierIncident}
          onClose={() => setSelectedDossierIncident(null)}
          onUpdated={fetchIncidents}
        />
      )}
    </div>
  );
};
