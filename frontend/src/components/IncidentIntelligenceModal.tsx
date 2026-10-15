import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  Cpu, 
  Users, 
  ShieldAlert, 
  CheckCircle, 
  Radio, 
  Sparkles, 
  Flame, 
  Droplets, 
  Activity, 
  AlertTriangle,
  Layers,
  Check,
  Share2
} from 'lucide-react';
import { Incident } from '../types';
import { verifyIncident } from '../lib/api';

interface IncidentIntelligenceModalProps {
  incident: Incident | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export const IncidentIntelligenceModal: React.FC<IncidentIntelligenceModalProps> = ({
  incident,
  onClose,
  onUpdated,
}) => {
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'satellite' | 'ai-telemetry'>('overview');
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [isActing, setIsActing] = useState<boolean>(false);
  const [visualFeedMode, setVisualFeedMode] = useState<'drone-ai' | 'tactical-radar'>('drone-ai');

  if (!incident) return null;

  const handleAction = async (action: 'review' | 'approve' | 'reject') => {
    setIsActing(true);
    try {
      if (action === 'approve') {
        // Mark verified and authorized
        await verifyIncident(incident.id);
        setApprovalStatus('APPROVED: Rescue Team 02 Dispatched + 500L Water Allocated');
        onUpdated?.();
      } else if (action === 'reject') {
        setApprovalStatus('REJECTED: Operator requested alternate staging route');
      } else {
        setApprovalStatus('UNDER REVIEW: Field telemetry cross-examination active');
      }
    } catch (err) {
      console.error(`Failed to handle ${action}:`, err);
    } finally {
      setIsActing(false);
    }
  };

  const handleToggleVerify = async () => {
    setIsVerifying(true);
    try {
      await verifyIncident(incident.id);
      onUpdated?.();
    } catch (err) {
      console.error('Failed to verify incident:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'flood': return '#06b6d4';
      case 'fire': return '#ef4444';
      case 'medical': return '#10b981';
      case 'blocked_road': return '#f59e0b';
      case 'missing_person': return '#8b5cf6';
      default: return '#94a3b8';
    }
  };

  const getRecommendedResponse = (cat: string, sev: string) => {
    if (cat === 'flood') {
      return 'Deploy motorized inflatable zodiac boat crew with flotation vests and high-angle rope evacuation gear. Prioritize rooftop extractions.';
    }
    if (cat === 'fire') {
      return 'Dispatch pumper unit and auxiliary water tanker. Establish 150m safety perimeter and conduct thermal sweep of adjacent structures.';
    }
    if (cat === 'medical') {
      return 'Deploy Mobile Paramedic Unit with advanced trauma kits, thermal blankets, and IV hydration supplies for mass casualty triage.';
    }
    if (cat === 'blocked_road') {
      return 'Coordinate civil debris clearance team with heavy equipment. Establish temporary traffic detour via alternate high-elevation route.';
    }
    if (cat === 'missing_person') {
      return 'Launch autonomous thermal reconnaissance drone DRONE-01 along last known transit path. Deploy K9 search team to wooded sector.';
    }
    return 'Deploy general reconnaissance patrol to verify status and coordinate with local shelter leadership.';
  };

  const color = getCategoryColor(incident.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="glass-card max-w-3xl w-full border border-cyan-500/30 bg-[#071120] shadow-2xl overflow-hidden my-8">
        {/* Header Bar */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-[#0a1b33] via-[#071120] to-[#0a1b33]">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl border flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: `${color}20`,
                borderColor: `${color}40`,
                color: color,
              }}
            >
              {incident.category === 'flood' ? (
                <Droplets className="w-5 h-5" />
              ) : incident.category === 'fire' ? (
                <Flame className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
                  INCIDENT INTELLIGENCE DOSSIER
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    incident.severity === 'critical'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : incident.severity === 'high'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}
                >
                  {incident.severity} PRIORITY
                </span>
                {incident.is_synthetic && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">
                    SYNTHETIC FIELD DATA
                  </span>
                )}
              </div>
              <h2 className="text-base font-extrabold text-white mt-0.5">
                {incident.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.08] px-5 bg-black/20 text-xs font-mono">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 px-4 font-bold border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Tactical Overview
          </button>
          <button
            onClick={() => setActiveTab('satellite')}
            className={`py-2.5 px-4 font-bold border-b-2 transition ${
              activeTab === 'satellite'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Satellite & Terrain Radar
          </button>
          <button
            onClick={() => setActiveTab('ai-telemetry')}
            className={`py-2.5 px-4 font-bold border-b-2 transition ${
              activeTab === 'ai-telemetry'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            AI Agent Scoring Details
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Visual Card: AI Drone Feed vs Tactical Radar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    Live Aerial & Spatial Reconnaissance Feed
                  </span>
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/40 border border-white/[0.08]">
                    <button
                      onClick={() => setVisualFeedMode('drone-ai')}
                      className={`px-2.5 py-0.5 rounded transition ${
                        visualFeedMode === 'drone-ai'
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      📷 AI Drone Recon
                    </button>
                    <button
                      onClick={() => setVisualFeedMode('tactical-radar')}
                      className={`px-2.5 py-0.5 rounded transition ${
                        visualFeedMode === 'tactical-radar'
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      📐 Tactical Radar
                    </button>
                  </div>
                </div>

                {visualFeedMode === 'drone-ai' ? (
                  <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-[#040b17] h-52 group">
                    <img
                      src={incident.category === 'flood' ? '/images/drone-recon-hud.jpg' : '/images/rescue-boat-ai.jpg'}
                      alt="AI Aerial Reconnaissance"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/30 text-red-200 border border-red-500/40 text-[10px] font-mono font-bold animate-pulse backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        AI CASUALTY SCAN: {incident.affected_count || 12} IDENTIFIED
                      </span>
                      <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-cyan-300 border border-cyan-500/30 text-[10px] font-mono">
                        DRONE-01 HUD
                      </span>
                    </div>

                    {/* Bottom Telemetry Strip */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 p-2 rounded-xl bg-[#071324]/90 backdrop-blur-md border border-cyan-500/30 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2 text-slate-200 text-[11px]">
                        <span className="text-amber-300 font-bold">Flood Depth: 1.4m</span>
                        <span>•</span>
                        <span className="text-cyan-300">Alt: 31m AGL</span>
                        <span>•</span>
                        <span className="text-emerald-300">Route: Clear</span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {incident.location_label || 'Millbrook Basin'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-white/[0.1] bg-[#050c18] h-48 flex items-center justify-center p-4">
                    {/* Offline-Generated Tactical Radar Graphic */}
                    <svg
                      className="w-full h-full opacity-80"
                      viewBox="0 0 600 200"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <radialGradient id="radarPulse" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                          <stop offset="60%" stopColor={color} stopOpacity="0.1" />
                          <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </radialGradient>
                        <pattern id="gridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
                          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        </pattern>
                      </defs>

                      <rect width="600" height="200" fill="#040b17" />
                      <rect width="600" height="200" fill="url(#gridPattern)" />

                      {/* Elevation contour curves */}
                      <path d="M 0 160 Q 150 120 300 150 T 600 130" stroke="rgba(34, 211, 238, 0.15)" strokeWidth="1.5" fill="none" />
                      <path d="M 0 120 Q 200 80 400 110 T 600 90" stroke="rgba(34, 211, 238, 0.1)" strokeWidth="1.5" fill="none" />
                      <path d="M 0 80 Q 250 40 450 70 T 600 50" stroke="rgba(34, 211, 238, 0.08)" strokeWidth="1.5" fill="none" />

                      {/* Hazard Zone Polygon */}
                      <polygon
                        points="260,60 380,40 420,130 280,150"
                        fill={`${color}15`}
                        stroke={`${color}50`}
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />

                      {/* Radar pulse epicenter */}
                      <circle cx="330" cy="95" r="70" fill="url(#radarPulse)" />
                      <circle cx="330" cy="95" r="45" stroke={color} strokeWidth="1" opacity="0.5" />
                      <circle cx="330" cy="95" r="20" stroke={color} strokeWidth="1.5" opacity="0.8" />
                      <circle cx="330" cy="95" r="4" fill="#ffffff" />

                      {/* Coordinate text */}
                      <text x="20" y="30" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                        TACTICAL TERRAIN RADAR • SECTOR 4-B
                      </text>
                      <text x="20" y="45" fill="#64748b" fontSize="9" fontFamily="monospace">
                        LAT: {incident.latitude?.toFixed(4) || '40.7128'} LON: {incident.longitude?.toFixed(4) || '-74.0060'}
                      </text>
                      <text x="500" y="30" fill="#22d3ee" fontSize="10" fontFamily="monospace" textAnchor="end">
                        STATUS: {incident.status.toUpperCase()}
                      </text>
                      <text x="500" y="45" fill="#a855f7" fontSize="9" fontFamily="monospace" textAnchor="end">
                        AIR RECON: DRONE-01 SYNCED
                      </text>
                    </svg>

                    {/* Overlay Badge */}
                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-sm border border-white/[0.1] text-xs font-mono flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: color }} />
                      <span className="text-slate-200">Epicenter: {incident.location_label || 'Millbrook Valley'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 4 Key Tactical Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] font-mono">
                  <span className="text-[10px] text-slate-500 block uppercase">Reported By</span>
                  <div className="text-xs font-bold text-slate-200 mt-0.5 truncate flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{incident.source_device_id}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] font-mono">
                  <span className="text-[10px] text-slate-500 block uppercase">Time Logged</span>
                  <div className="text-xs font-bold text-slate-200 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-violet-400" />
                    <span>{new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] font-mono">
                  <span className="text-[10px] text-slate-500 block uppercase">Affected Population</span>
                  <div className="text-xs font-bold text-amber-400 mt-0.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>{incident.affected_count} Civilians</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] font-mono">
                  <span className="text-[10px] text-slate-500 block uppercase">Verification</span>
                  <div className="text-xs font-bold mt-0.5 flex items-center gap-1.5">
                    {incident.is_verified ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> VERIFIED
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> UNCONFIRMED
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Raw Incident Log
                </span>
                <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
                  {incident.description || 'No descriptive details logged.'}
                </p>
              </div>

              {/* AI Decision & Recommendation Panel */}
              <div className="p-5 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/20 via-[#0a1830] to-violet-950/20 space-y-4 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
                    <div>
                      <span className="text-xs font-bold text-violet-300 uppercase font-mono tracking-wider">
                        AI INCIDENT INTELLIGENCE
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Rule Engine & Spatial Evaluation
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                      AI PRIORITY: {incident.severity.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      AI CONFIDENCE: 94%
                    </span>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                    AI SUMMARY:
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/[0.06]">
                    "Rapid flooding reported near the eastern settlement. Twelve people may require evacuation. Nearest available rescue team is 2.4 km away."
                  </p>
                </div>

                {/* AI Recommendation */}
                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    AI RECOMMENDATION:
                  </span>
                  <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
                    <p className="text-xs text-white font-semibold">
                      "Dispatch Rescue Team 02 and allocate 500 L drinking water."
                    </p>
                    <p className="text-[11px] font-mono text-amber-300 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      AI recommendation — human approval required before dispatch.
                    </p>
                  </div>
                </div>

                {/* Functional Buttons: REVIEW, APPROVE, REJECT */}
                <div className="pt-2 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] font-mono text-slate-400">
                    Decision Status: <strong className="text-white">{approvalStatus || 'Pending Human Authorization'}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction('review')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.1] transition"
                    >
                      REVIEW
                    </button>

                    <button
                      onClick={() => handleAction('reject')}
                      disabled={isActing}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition disabled:opacity-40"
                    >
                      REJECT
                    </button>

                    <button
                      onClick={() => handleAction('approve')}
                      disabled={isActing}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold font-mono bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-md shadow-emerald-500/20 transition disabled:opacity-40"
                    >
                      {isActing ? 'Authorizing...' : 'APPROVE'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'satellite' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-[#040b17] h-52">
                <img
                  src="/images/drone-recon-hud.jpg"
                  alt="AI Drone Aerial Reconnaissance"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-cyan-500/30 text-[10px] text-cyan-300 font-bold">
                  SATELLITE & SYNTHESIZED DRONE RADAR HUD
                </div>
                <div className="absolute bottom-2.5 left-2.5 right-2.5 p-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">Target: {incident.location_label || 'Millbrook Basin'}</span>
                  <span className="text-red-400 font-bold">Casualties Detected: {incident.affected_count || 12}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] space-y-2">
                <div className="text-cyan-400 font-bold uppercase">Synthesized Spatial Telemetry</div>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>Latitude: <strong className="text-white">{incident.latitude ?? '40.7128'}</strong></div>
                  <div>Longitude: <strong className="text-white">{incident.longitude ?? '-74.0060'}</strong></div>
                  <div>Sector: <strong className="text-white">{incident.location_label || 'Riverside Basin'}</strong></div>
                  <div>Mesh Sensor: <strong className="text-white">{incident.source_device_id}</strong></div>
                  <div>Duplicate Radius: <strong className="text-emerald-400">Clear (0 within 500m)</strong></div>
                  <div>Water Level Rate: <strong className="text-red-400">+30 cm / hour</strong></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5 text-slate-400">
                <span className="text-white font-bold block">Offline Cartographic Fallback Notice:</span>
                <p>
                  In disconnected field scenarios where upstream internet tile servers are severed, ResQMesh relies on cached vector boundary data and the built-in Zero-Tile Tactical Radar grid.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'ai-telemetry' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] space-y-2">
                <span className="text-purple-400 font-bold uppercase block">Deterministic Evaluation Engine</span>
                <div className="space-y-1 text-slate-300">
                  <div>Keyword Extractor: <span className="text-emerald-400">['trapped', 'flood', 'families', 'rising']</span></div>
                  <div>Life Safety Multiplier: <span className="text-cyan-400">1.8x</span></div>
                  <div>Affected Population Weight: <span className="text-cyan-400">+{incident.affected_count * 0.5}</span></div>
                  <div>Calculated Urgency Score: <span className="text-red-400 font-bold">95.4 / 100</span></div>
                  <div>Safety Guardrail: <span className="text-amber-400 font-bold">Autonomous Dispatch Suppressed (Human Required)</span></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/[0.08] bg-black/40 flex items-center justify-between">
          <button
            onClick={handleToggleVerify}
            disabled={isVerifying}
            className={`btn-secondary !text-xs !py-1.5 !px-3 ${
              incident.is_verified ? 'text-emerald-400 border-emerald-500/30' : ''
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{incident.is_verified ? 'Verified by Command' : 'Verify Incident'}</span>
          </button>

          <button
            onClick={onClose}
            className="btn-primary !text-xs !py-1.5 !px-4"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
