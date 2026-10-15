import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Plus, 
  UserCheck, 
  Play, 
  CheckCircle, 
  ShieldAlert, 
  Clock, 
  Cpu, 
  AlertTriangle,
  X,
  Users
} from 'lucide-react';
import { 
  listTasks, 
  createTask, 
  updateTask, 
  approveTask, 
  startTask, 
  completeTask, 
  checkTaskConflicts,
  listIncidents,
  suggestTaskForIncident 
} from '../lib/api';
import { RescueTask, Incident, TaskStatus, TaskPriority } from '../types';

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<RescueTask[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New task modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    incident_id: '',
    title: '',
    description: '',
    priority: 'high' as TaskPriority,
    assigned_team: 'rescue-alpha',
    estimated_duration_hours: 3.0,
  });

  // Human approval modal
  const [approvingTask, setApprovingTask] = useState<RescueTask | null>(null);
  const [approvalName, setApprovalName] = useState<string>('Commander Davis');
  const [approvalNotes, setApprovalNotes] = useState<string>('Confirmed mission parameters');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taskRes, incRes, confRes] = await Promise.all([
        listTasks(),
        listIncidents(),
        checkTaskConflicts(),
      ]);
      setTasks(taskRes.data);
      setIncidents(incRes.data);
      setConflicts(confRes.data.conflicts || []);
      if (incRes.data.length > 0 && !formData.incident_id) {
        setFormData((prev) => ({ ...prev, incident_id: incRes.data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching task coordination data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask(formData);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleApprove = async () => {
    if (!approvingTask) return;
    try {
      await approveTask(approvingTask.id, {
        approved: true,
        approved_by: approvalName,
        notes: approvalNotes,
      });
      setApprovingTask(null);
      fetchData();
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await startTask(id);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to start task');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeTask(id);
      fetchData();
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  const handleAISuggest = async (incidentId: string) => {
    try {
      const res = await suggestTaskForIncident(incidentId);
      const sugg = res.data;
      await createTask({
        incident_id: incidentId,
        title: sugg.title,
        description: sugg.description,
        priority: sugg.priority,
        assigned_team: sugg.suggested_team,
        estimated_duration_hours: sugg.estimated_duration_hours,
        ai_suggested: true,
        ai_reasoning: sugg.reasoning,
      });
      fetchData();
    } catch (err) {
      console.error('AI suggestion failed:', err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
            RESCUE TASK COORDINATION
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch rescue teams, review AI task priorities, resolve team overlaps, and verify life-critical orders.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary !text-xs !py-2 !px-4"
        >
          <Plus className="w-4 h-4" />
          <span>Create Mission Task</span>
        </button>
      </div>

      {/* Task Conflict Warnings Banner */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Task Allocation Conflict Detected</span>
          </div>
          <div className="space-y-1">
            {conflicts.map((conf, i) => (
              <p key={i} className="text-xs text-amber-200/90">
                • {conf.message} (Task IDs: {conf.task_ids.join(', ')})
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Tasks Table / Card List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="glass-card p-5 space-y-3 flex flex-col justify-between hover:border-white/20 transition-all duration-200"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`badge-${
                    task.priority === 'critical'
                      ? 'critical'
                      : task.priority === 'high'
                      ? 'high'
                      : task.priority === 'medium'
                      ? 'medium'
                      : 'low'
                  }`}
                >
                  {task.priority.toUpperCase()}
                </span>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    task.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : task.status === 'in_progress'
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      : task.status === 'assigned'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {task.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white line-clamp-1">{task.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                {task.description || 'No operational instructions recorded.'}
              </p>

              {/* AI Suggestion Indicator */}
              {task.ai_suggested && (
                <div className="mt-2.5 p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-violet-300 font-bold flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-violet-400" /> AI Recommendation
                    </span>
                    {task.human_approved ? (
                      <span className="text-emerald-400">✓ Commander Approved</span>
                    ) : (
                      <span className="text-amber-400 animate-pulse">Pending Approval</span>
                    )}
                  </div>
                  {task.ai_reasoning && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                      "{task.ai_reasoning}"
                    </p>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-white/[0.06] mt-3 flex justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-cyan-400" />
                  {task.assigned_team || 'Unassigned'}
                </span>
                <span>Est: {task.estimated_duration_hours || 2}h</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
              {task.ai_suggested && !task.human_approved ? (
                <button
                  onClick={() => setApprovingTask(task)}
                  className="btn-primary !text-[11px] !py-1 !px-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold w-full justify-center"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Review & Approve AI Dispatch</span>
                </button>
              ) : task.status === 'assigned' ? (
                <button
                  onClick={() => handleStart(task.id)}
                  className="btn-primary !text-[11px] !py-1 !px-2.5 w-full justify-center"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Deploy / Start Task</span>
                </button>
              ) : task.status === 'in_progress' ? (
                <button
                  onClick={() => handleComplete(task.id)}
                  className="btn-success !text-[11px] !py-1 !px-2.5 w-full justify-center"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Mark Completed</span>
                </button>
              ) : (
                <span className="text-[11px] font-mono text-emerald-400/80 py-1">
                  ✓ Operation Finalized
                </span>
              )}
            </div>
          </div>
        ))}

        {tasks.length === 0 && !loading && (
          <div className="col-span-full text-center py-16 glass-card text-slate-500 text-xs">
            No rescue tasks active. Use the button above or generate AI suggestions from incidents.
          </div>
        )}
      </div>

      {/* AI Task Generator Quick Action Drawer */}
      <div className="glass-card p-5 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Propose Tasks via AI Task Agent (Incident Matching)
        </h2>
        <div className="flex flex-wrap gap-2">
          {incidents.slice(0, 4).map((inc) => (
            <button
              key={inc.id}
              onClick={() => handleAISuggest(inc.id)}
              className="btn-secondary !text-xs !py-1.5 !px-3 border-cyan-500/20 hover:border-cyan-500/40"
            >
              <span>+ Propose for "{inc.title.substring(0, 24)}..."</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modal: Create Task */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full bg-[#0a1628] border-white/20 p-6 space-y-4 shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-cyan-400" />
                Dispatch New Task
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Target Incident</label>
                <select
                  value={formData.incident_id}
                  onChange={(e) => setFormData({ ...formData, incident_id: e.target.value })}
                  className="select-field"
                  required
                >
                  {incidents.map((inc) => (
                    <option key={inc.id} value={inc.id}>
                      [{inc.severity.toUpperCase()}] {inc.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flood Extraction Operation"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="select-field"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Assigned Team</label>
                  <select
                    value={formData.assigned_team}
                    onChange={(e) => setFormData({ ...formData, assigned_team: e.target.value })}
                    className="select-field"
                  >
                    <option value="rescue-alpha">Rescue Alpha (Water / North)</option>
                    <option value="rescue-bravo">Rescue Bravo (Fire / South)</option>
                    <option value="supply-unit">Supply Unit (Logistics)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Estimated Hours</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={formData.estimated_duration_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_duration_hours: parseFloat(e.target.value) || 2 })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Operational Directives</label>
                <textarea
                  rows={3}
                  placeholder="Gear, frequency, staging zone..."
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
                <button type="submit" className="btn-primary !text-xs">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Human Approval Confirmation for AI Tasks */}
      {approvingTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full bg-[#0a1628] border-amber-500/40 p-6 space-y-4 shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">
                  Human Safety Confirmation Required
                </h2>
              </div>
              <button onClick={() => setApprovingTask(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              ⚠️ In compliance with AI Human-in-the-Loop policy, automated systems cannot dispatch personnel into hazardous zones without authorized human officer confirmation.
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded bg-white/[0.03] space-y-1">
                <div className="font-bold text-white">{approvingTask.title}</div>
                <div className="text-slate-400">{approvingTask.description}</div>
                <div className="text-[11px] text-cyan-400 font-mono pt-1">
                  Assigned: {approvingTask.assigned_team} • Priority: {approvingTask.priority.toUpperCase()}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Authorizing Commander Name *</label>
                <input
                  type="text"
                  required
                  value={approvalName}
                  onChange={(e) => setApprovalName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Approval Notes / Operational Caveats</label>
                <input
                  type="text"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setApprovingTask(null)}
                className="btn-secondary !text-xs"
              >
                Reject / Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="btn-primary !text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
              >
                Authorize Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
