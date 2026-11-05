import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { CheckCircle2, Clock, Plus, AlertTriangle, UserCheck, Calendar, Edit2 } from 'lucide-react';

export const TaskBoard = ({
  tasks,
  teamMembers = [],
  isLeader,
  currentUserId,
  projectId,
  onTaskCreated,
  onTaskStatusChanged,
  onTaskEdited,
}) => {
  const [filter, setFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Create Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]);

  // Edit Modal State
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editDeadline, setEditDeadline] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState('');

  useEffect(() => {
    if (teamMembers && teamMembers.length > 0) {
      const firstId = teamMembers[0].userId || teamMembers[0].id || teamMembers[0]._id;
      if (!assignedTo || !teamMembers.some(m => String(m.userId || m.id || m._id) === String(assignedTo))) {
        setAssignedTo(firstId || '');
      }
    }
  }, [teamMembers]);

  const filteredTasks = (tasks || []).filter(t => {
    if (filter === 'All') return true;
    return t.status === filter;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    const effectiveAssignedTo = assignedTo || (teamMembers && teamMembers[0] ? (teamMembers[0].userId || teamMembers[0].id || teamMembers[0]._id) : '');
    if (!title.trim() || !effectiveAssignedTo || !deadline) {
      setErrorMsg('Please specify a title, assigned teammate, and sprint deadline.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onTaskCreated({
        projectId,
        title: title.trim(),
        description: description.trim(),
        assignedTo: effectiveAssignedTo,
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

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setEditTitle(task.title || '');
    setEditDescription(task.description || '');
    setEditAssignedTo(task.assignedTo || '');
    setEditPriority(task.priority || 'Medium');
    let formattedDate = '';
    if (task.deadline) {
      try {
        formattedDate = new Date(task.deadline).toISOString().split('T')[0];
      } catch {
        formattedDate = '';
      }
    }
    setEditDeadline(formattedDate);
    setEditErrorMsg('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editAssignedTo || !editDeadline) {
      setEditErrorMsg('Please fill in title, assigned teammate, and deadline.');
      return;
    }

    setIsEditing(true);
    setEditErrorMsg('');
    try {
      await api.updateTask(editingTask.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        assignedTo: editAssignedTo,
        priority: editPriority,
        deadline: editDeadline,
      });

      setEditingTask(null);
      if (onTaskEdited) {
        onTaskEdited();
      }
    } catch (err) {
      setEditErrorMsg(err.message || 'Failed to update task.');
    } finally {
      setIsEditing(false);
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'Urgent':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'High':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Medium':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 p-1 rounded-xl text-xs font-medium">
          {['All', 'Pending', 'In Progress', 'Completed'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filter === tab ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {isLeader && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Assign New Task
          </button>
        )}
      </div>

      {/* Task Cards */}
      {filteredTasks.length === 0 ? (
        <div className="p-8 text-center bg-white border border-dashed border-gray-300 rounded-2xl">
          <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">No tasks in this category.</p>
          <p className="text-xs text-gray-500 mt-1">
            {isLeader ? 'Click "Assign New Task" to delegate milestones to teammates.' : 'Your leader has not created tasks for this status yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTasks.map(task => {
            const isAssignedToMe = Boolean(currentUserId) && (String(task.assignedTo) === String(currentUserId));
            const canUpdateStatus = isAssignedToMe || isLeader;

            return (
              <div
                key={task.id}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-gray-300 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h5 className="font-semibold text-gray-900 text-sm leading-snug">
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
                  <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-200 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 font-medium text-gray-800">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{task.assignedToName || 'Teammate'}</span>
                    {isAssignedToMe && (
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded">You</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-gray-500">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No date'}</span>
                  </div>
                </div>

                {/* Overdue / Ontime Indicator */}
                {task.isOverdue && (
                  <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md text-[11px] font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Task is overdue! Deadline has passed.</span>
                  </div>
                )}

                {task.status === 'Completed' && (
                  <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-[11px] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      Completed {task.completedOnTime ? 'on schedule' : 'with delay'} ({new Date(task.completedAt || task.updatedAt).toLocaleDateString()})
                    </span>
                  </div>
                )}

                {/* Action Buttons: Status Updates + Leader Task Edit */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200">
                  {isLeader ? (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(task)}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-indigo-700 border border-gray-300 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3 h-3 text-indigo-600" />
                      <span>Edit Task</span>
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    {canUpdateStatus && task.status === 'Pending' && (
                      <button
                        onClick={() => onTaskStatusChanged(task.id, 'In Progress')}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium cursor-pointer border border-gray-300 transition-colors"
                      >
                        Start Progress
                      </button>
                    )}
                    {canUpdateStatus && task.status !== 'Completed' && (
                      <button
                        onClick={() => onTaskStatusChanged(task.id, 'Completed')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-gray-200 text-gray-800">
            <h3 className="text-lg font-bold text-gray-900">Assign New Task</h3>
            <p className="text-xs text-gray-500">
              Create a milestone for your hackathon sprint and assign it to a team member.
            </p>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement Dijkstra routing microservice"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Provide technical requirements and expected deliverable..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Assign To *</label>
                  <select
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    {(teamMembers || []).map(m => {
                      const mId = m.userId || m.id || m._id;
                      return (
                        <option key={mId} value={mId} className="bg-white text-gray-900">
                          {m.fullName || m.name} ({m.role || 'Member'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="Low" className="bg-white text-gray-900">Low</option>
                    <option value="Medium" className="bg-white text-gray-900">Medium</option>
                    <option value="High" className="bg-white text-gray-900">High</option>
                    <option value="Urgent" className="bg-white text-gray-900">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Deadline *</label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Creating...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal (Leader Only) */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-gray-200 text-gray-800">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-indigo-600" />
              <span>Edit Task Details</span>
            </h3>
            <p className="text-xs text-gray-500">
              Update task assignment, priority, deliverable details, or sprint deadline.
            </p>

            {editErrorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {editErrorMsg}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Assign To *</label>
                  <select
                    value={editAssignedTo}
                    onChange={e => setEditAssignedTo(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    {(teamMembers || []).map(m => {
                      const mId = m.userId || m.id || m._id;
                      return (
                        <option key={mId} value={mId} className="bg-white text-gray-900">
                          {m.fullName || m.name} ({m.role || 'Member'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={e => setEditPriority(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="Low" className="bg-white text-gray-900">Low</option>
                    <option value="Medium" className="bg-white text-gray-900">Medium</option>
                    <option value="High" className="bg-white text-gray-900">High</option>
                    <option value="Urgent" className="bg-white text-gray-900">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Deadline (YYYY-MM-DD) *</label>
                <input
                  type="date"
                  required
                  value={editDeadline}
                  onChange={e => setEditDeadline(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isEditing ? 'Saving...' : 'Save Task Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
