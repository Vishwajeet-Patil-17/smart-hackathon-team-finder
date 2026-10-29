import React, { useState } from 'react';
import { CheckCircle2, Clock, Plus, AlertTriangle, UserCheck, Calendar } from 'lucide-react';

export const TaskBoard = ({
  tasks,
  teamMembers,
  isLeader,
  currentUserId,
  projectId,
  onTaskCreated,
  onTaskStatusChanged,
}) => {
  const [filter, setFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState(teamMembers[0]?.userId || '');
  const [priority, setPriority] = useState('Medium');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]);

  const filteredTasks = (tasks || []).filter(t => {
    if (filter === 'All') return true;
    return t.status === filter;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !assignedTo || !deadline) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onTaskCreated({
        projectId,
        title: title.trim(),
        description: description.trim(),
        assignedTo,
        priority,
        deadline,
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'Urgent':
        return 'bg-rose-950/60 text-rose-300 border-rose-800';
      case 'High':
        return 'bg-amber-950/60 text-amber-300 border-amber-800';
      case 'Medium':
        return 'bg-blue-950/60 text-blue-300 border-blue-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'Completed':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800';
      case 'In Progress':
        return 'bg-indigo-950/60 text-indigo-300 border-indigo-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs font-medium">
          {['All', 'Pending', 'In Progress', 'Completed'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filter === tab ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {isLeader && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Assign New Task
          </button>
        )}
      </div>

      {/* Task Cards */}
      {filteredTasks.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 border border-dashed border-slate-800 rounded-2xl">
          <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-white">No tasks in this category.</p>
          <p className="text-xs text-slate-400 mt-1">
            {isLeader ? 'Click "Assign New Task" to delegate milestones to teammates.' : 'Your leader has not created tasks for this status yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTasks.map(task => {
            const isAssignedToMe = task.assignedTo === currentUserId;
            const canUpdateStatus = isAssignedToMe || isLeader;

            return (
              <div
                key={task.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h5 className="font-semibold text-white text-sm leading-snug">
                    {task.title}
                  </h5>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getPriorityBadge(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                </div>

                {task.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 font-medium text-slate-300">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{task.assignedToName}</span>
                    {isAssignedToMe && (
                      <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.2 rounded">You</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Overdue / Ontime Indicator */}
                {task.isOverdue && (
                  <div className="flex items-center gap-1.5 text-rose-300 bg-rose-950/60 border border-rose-800 px-2.5 py-1 rounded-md text-[11px] font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Task is overdue! Deadline has passed.</span>
                  </div>
                )}

                {task.status === 'Completed' && (
                  <div className="flex items-center gap-1.5 text-emerald-300 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-md text-[11px] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      Completed {task.completedOnTime ? 'on schedule' : 'with delay'} ({new Date(task.completedAt || task.updatedAt).toLocaleDateString()})
                    </span>
                  </div>
                )}

                {/* Status Update Actions */}
                {canUpdateStatus && task.status !== 'Completed' && (
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    {task.status === 'Pending' && (
                      <button
                        onClick={() => onTaskStatusChanged(task.id, 'In Progress')}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer border border-slate-700"
                      >
                        Start Progress
                      </button>
                    )}
                    <button
                      onClick={() => onTaskStatusChanged(task.id, 'Completed')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Mark Completed
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-800 text-slate-200">
            <h3 className="text-lg font-bold text-white">Assign New Task</h3>
            <p className="text-xs text-slate-400">
              Create a milestone for your hackathon sprint and assign it to a team member.
            </p>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement Dijkstra routing microservice"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Provide technical requirements and expected deliverable..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Assign To *</label>
                  <select
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg focus:outline-hidden focus:border-indigo-500"
                  >
                    {(teamMembers || []).map(m => (
                      <option key={m.userId} value={m.userId} className="bg-slate-900 text-white">
                        {m.fullName} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Low" className="bg-slate-900 text-white">Low</option>
                    <option value="Medium" className="bg-slate-900 text-white">Medium</option>
                    <option value="High" className="bg-slate-900 text-white">High</option>
                    <option value="Urgent" className="bg-slate-900 text-white">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deadline *</label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isSubmitting ? 'Creating...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
