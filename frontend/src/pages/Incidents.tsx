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
  AlertCircle
} from 'lucide-react';
import { 
  listIncidents, 
  createIncident, 
  verifyIncident, 
  analyzeIncident 
} from '../lib/api';
import { Incident, IncidentCategory, IncidentSeverity } from '../types';

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {incidents.map((inc) => (
          <div
            key={inc.id}
            className="glass-card p-5 space-y-3 relative overflow-hidden flex flex-col justify-between hover:border-white/20 transition-all duration-200"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span
                  className={`badge-${
                    inc.severity === 'critical'
                      ? 'critical'
                      : inc.severity === 'high'
                      ? 'high'
                      : inc.severity === 'medium'
                      ? 'medium'
                      : 'low'
                  }`}
                >
                  {inc.severity.toUpperCase()}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-300">
                    {inc.category.replace('_', ' ').toUpperCase()}
                  </span>
                  {inc.is_verified ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ✓ VERIFIED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      UNVERIFIED
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-sm font-bold text-white line-clamp-1">{inc.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                {inc.description || 'No description provided.'}
              </p>

              <div className="pt-3 border-t border-white/[0.06] mt-3 space-y-1 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{inc.location_label || `${inc.latitude?.toFixed(4)}, ${inc.longitude?.toFixed(4)}`}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Victims: ~{inc.affected_count}</span>
                  <span>Origin: {inc.source_device_id}</span>
                </div>
              </div>
            </div>

            {/* Incident Action Buttons */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
              <button
                onClick={() => handleAnalyze(inc.id)}
                className="btn-secondary !text-[11px] !py-1 !px-2.5 text-cyan-300 border-cyan-500/30 hover:border-cyan-400"
              >
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>AI Agent Review</span>
              </button>

              {!inc.is_verified && (
                <button
                  onClick={() => handleVerify(inc.id)}
                  className="btn-success !text-[11px] !py-1 !px-2.5"
                >
                  <CheckCircle className="w-3 h-3" />
                  <span>Verify</span>
                </button>
              )}
            </div>
          </div>
        ))}

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
    </div>
  );
};
