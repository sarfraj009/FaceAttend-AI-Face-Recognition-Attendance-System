import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Calendar, Clock, BookOpen, Layers, PlayCircle, History, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function StartAttendance() {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const [formData, setFormData] = useState({
    className: 'B.Tech CSE',
    subject: 'Computer Networks',
    section: 'CSE-A',
    date: todayStr,
    startTime: timeStr,
  });

  const [recentSessions, setRecentSessions] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [classRes, todayRes] = await Promise.all([
        api.get('/classes'),
        api.get('/attendance/today'),
      ]);
      setClasses(classRes.data);
      if (classRes.data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          className: classRes.data[0].course,
          subject: classRes.data[0].subject,
          section: classRes.data[0].section,
        }));
      }
      setRecentSessions(todayRes.data.sessions || []);
    } catch (err) {
      console.error('Error fetching initial session options:', err);
    }
  };

  const handleClassSelect = (classId) => {
    const selected = classes.find((c) => c.id === classId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        className: selected.course,
        subject: selected.subject,
        section: selected.section,
      }));
    }
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/attendance/start', formData);
      const session = res.data;
      addToast(`Attendance session launched for ${session.subject}!`, 'success');
      navigate(`/attendance/session/${session.id}`);
    } catch (err) {
      console.error('Failed to launch attendance session:', err);
      const msg = err.response?.data?.detail || 'Could not start session. Please try again.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Create & Launch Attendance Session
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure class parameters and activate real-time biometric face detection for automatic marking.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form Container */}
        <div className="md:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-6 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Session Parameters
          </div>

          <form onSubmit={handleStartSession} className="space-y-5">
            {/* Quick Template Selector */}
            {classes.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Registered Class
                </label>
                <select
                  onChange={(e) => handleClassSelect(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-xs text-white focus:border-cyan-400 focus:outline-none"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.course} ({c.section}) - {c.subject}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Class / Course *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    placeholder="e.g. B.Tech CSE"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-4 py-3 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Computer Networks"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Section *
                </label>
                <input
                  type="text"
                  required
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  placeholder="e.g. CSE-A"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-3 py-3 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Start Time
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Clock className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    placeholder="09:30 AM"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-3 py-3 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-cyan-500/25 hover:from-cyan-400 hover:to-indigo-500 transition active:scale-98 disabled:opacity-50"
              >
                <Camera className="w-5 h-5" />
                {loading ? 'Initializing Session...' : 'Start Attendance'}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Info & Active Sessions */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl">
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              Active Today Sessions
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Switch or re-open ongoing camera sessions from today.
            </p>

            <div className="space-y-2">
              {recentSessions.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No active sessions yet today.</p>
              ) : (
                recentSessions.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => navigate(`/attendance/session/${s.id}`)}
                    className="w-full text-left p-3 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 hover:border-cyan-500/40 transition group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{s.subject}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        {s.presentCount} Present
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      {s.className} ({s.section}) • {s.startTime}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 to-slate-900/80 p-6 backdrop-blur-xl text-xs text-slate-300 space-y-2">
            <h5 className="font-bold text-cyan-300">Tips for Facial Accuracy</h5>
            <p className="text-slate-400 leading-relaxed">
              • Mount or angle the camera at eye level facing students entering the classroom.
            </p>
            <p className="text-slate-400 leading-relaxed">
              • Maintain even classroom lighting avoiding harsh backlighting behind heads.
            </p>
            <p className="text-slate-400 leading-relaxed">
              • The anti-duplicate algorithm automatically prevents multi-marking for the same student.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
