import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.js';
import { Send, MessageSquare, ShieldCheck } from 'lucide-react';

export const TeamDiscussion = ({
  projectId,
  projectName,
  currentUserId,
}) => {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await api.getMessages(projectId);
      setMessages(res.messages || []);
    } catch (e) {
      console.warn('Failed to load discussion:', e);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchMessages().finally(() => setIsLoading(false));
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await api.postMessage(projectId, newMsg.trim());
      setMessages(prev => [...prev, res.discussionMessage]);
      setNewMsg('');
    } catch (err) {
      alert(err.message || 'Could not send message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[460px]">
      {/* Header */}
      <div className="bg-slate-950/80 border-b border-slate-800 p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <h4 className="font-semibold text-white text-sm">
            {projectName} Team Channel
          </h4>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Members Only</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-500">
            Loading team communication...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 space-y-1">
            <MessageSquare className="w-8 h-8 text-slate-600" />
            <p className="text-xs font-medium text-slate-400">No messages in this project yet.</p>
            <p className="text-[11px] text-slate-500">Start the conversation, coordinate milestones, or post sprint updates!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.authorId === currentUserId;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">{msg.authorName}</span>
                  <span className="px-1.5 py-0.2 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded text-[10px]">
                    {msg.authorRole}
                  </span>
                  <span className="text-slate-500">• {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-tr-xs shadow-md'
                      : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-xs shadow-md'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          placeholder="Share progress, ask questions, or link resources..."
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          className="flex-1 text-xs px-3 py-2 bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 rounded-lg focus:outline-hidden focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!newMsg.trim() || isSending}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer shadow-md"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
