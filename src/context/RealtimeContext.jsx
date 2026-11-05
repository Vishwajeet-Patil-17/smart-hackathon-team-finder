import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { CheckCircle2, Bell, Mail, ClipboardList, MessageSquare, AlertCircle, X } from 'lucide-react';

const RealtimeContext = createContext(undefined);

export const RealtimeProvider = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const wsRef = useRef(null);
  const listenersRef = useRef(new Map());

  // Subscribe to specific real-time events
  const subscribe = useCallback((eventName, callback) => {
    if (!listenersRef.current.has(eventName)) {
      listenersRef.current.set(eventName, new Set());
    }
    listenersRef.current.get(eventName).add(callback);

    return () => {
      const set = listenersRef.current.get(eventName);
      if (set) {
        set.delete(callback);
        if (set.size === 0) listenersRef.current.delete(eventName);
      }
    };
  }, []);

  const addNotification = useCallback((notif) => {
    const id = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const item = { id, timestamp: new Date(), ...notif };
    setNotifications(prev => [item, ...prev].slice(0, 5));

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 6000);
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    let reconnectTimeout = null;
    let pingInterval = null;
    let isDisposed = false;

    function connect() {
      if (isDisposed) return;
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isDisposed) return;
          setIsConnected(true);

          // Ping heartbeat every 20 seconds
          pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 20000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (!data || !data.event) return;

            setLastEvent(data);

            // Notify registered listeners
            const listeners = listenersRef.current.get(data.event);
            if (listeners) {
              listeners.forEach(cb => {
                try { cb(data.payload); } catch (e) { console.warn('Listener error:', e); }
              });
            }

            // Universal wildcard listeners
            const wildcard = listenersRef.current.get('*');
            if (wildcard) {
              wildcard.forEach(cb => {
                try { cb(data); } catch (e) { console.warn('Wildcard listener error:', e); }
              });
            }

            // Generate contextual toasts based on current user identity
            const currentUserId = user?.id ? String(user.id) : '';
            const currentUserEmail = (user?.email || '').toLowerCase().trim();

            if (data.event === 'task:created') {
              const task = data.payload.task || {};
              const assignedTo = String(data.payload.assignedTo || task.assignedTo || '');
              const assignedEmail = String(data.payload.assignedToEmail || task.assignedToEmail || '').toLowerCase().trim();

              const isForMe = (currentUserId && assignedTo === currentUserId) ||
                              (currentUserEmail && assignedEmail === currentUserEmail);

              if (isForMe) {
                addNotification({
                  title: 'New Sprint Task Assigned',
                  message: `Task "${task.title}" was assigned to you by ${data.payload.leaderName || 'your Team Leader'}.`,
                  type: 'task',
                });
              }
            } else if (data.event === 'task:updated') {
              const task = data.payload.task || {};
              addNotification({
                title: 'Task Status Updated',
                message: `"${task.title}" is now marked as ${data.payload.status}.`,
                type: 'task',
              });
            } else if (data.event === 'invitation:sent') {
              const candidateId = String(data.payload.candidateId || '');
              const candidateEmail = String(data.payload.candidateEmail || '').toLowerCase().trim();

              if ((currentUserId && candidateId === currentUserId) ||
                  (currentUserEmail && candidateEmail === currentUserEmail)) {
                addNotification({
                  title: 'New Project Invitation',
                  message: `You were invited by ${data.payload.leaderName} to join "${data.payload.projectName}"!`,
                  type: 'invite',
                });
              }
            } else if (data.event === 'invitation:accepted') {
              const leaderId = String(data.payload.leaderId || '');
              if (currentUserId && leaderId === currentUserId) {
                addNotification({
                  title: 'Invitation Accepted!',
                  message: `${data.payload.candidateName} has accepted your invitation and joined the team!`,
                  type: 'success',
                });
              }
            } else if (data.event === 'join_request:sent') {
              const leaderId = String(data.payload.leaderId || '');
              const leaderEmail = String(data.payload.leaderEmail || '').toLowerCase().trim();
              if ((currentUserId && leaderId === currentUserId) ||
                  (currentUserEmail && leaderEmail === currentUserEmail)) {
                addNotification({
                  title: 'New Join Request',
                  message: `${data.payload.candidateName} requested to join your project "${data.payload.projectName}".`,
                  type: 'invite',
                });
              }
            } else if (data.event === 'join_request:approved') {
              const candidateId = String(data.payload.candidateId || '');
              if (currentUserId && candidateId === currentUserId) {
                addNotification({
                  title: 'Join Request Approved!',
                  message: `Your request was approved! You are now an active team member.`,
                  type: 'success',
                });
              }
            } else if (data.event === 'discussion:message') {
              const msg = data.payload.message || {};
              if (msg.authorId && String(msg.authorId) !== currentUserId) {
                addNotification({
                  title: `Message from ${msg.authorName}`,
                  message: msg.content.length > 60 ? msg.content.substring(0, 60) + '...' : msg.content,
                  type: 'chat',
                });
              }
            }
          } catch (e) {
            // ignore non-json
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          clearInterval(pingInterval);
          if (!isDisposed) {
            reconnectTimeout = setTimeout(connect, 2000);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        if (!isDisposed) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      }
    }

    connect();

    return () => {
      isDisposed = true;
      clearInterval(pingInterval);
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, addNotification]);

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        lastEvent,
        subscribe,
        addNotification,
      }}
    >
      {children}

      {/* Floating Real-Time Notifications Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {notifications.map(n => (
          <div
            key={n.id}
            className="pointer-events-auto bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl p-3.5 shadow-lg text-xs flex items-start gap-3 transform transition-all animate-in slide-in-from-bottom-3 duration-200"
          >
            <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 mt-0.5 shrink-0">
              {n.type === 'task' && <ClipboardList className="w-4 h-4 text-amber-500" />}
              {n.type === 'invite' && <Mail className="w-4 h-4 text-indigo-600" />}
              {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {n.type === 'chat' && <MessageSquare className="w-4 h-4 text-sky-500" />}
              {!['task', 'invite', 'success', 'chat'].includes(n.type) && <Bell className="w-4 h-4 text-indigo-600" />}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                <span>{n.title}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-gray-600 text-[11px] mt-0.5 leading-relaxed line-clamp-2">
                {n.message}
              </p>
            </div>

            <button
              onClick={() => removeNotification(n.id)}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer shrink-0"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </RealtimeContext.Provider>
  );
};

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return ctx;
}
