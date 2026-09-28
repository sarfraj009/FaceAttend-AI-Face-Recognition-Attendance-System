import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Camera,
  StopCircle,
  Users,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Clock,
  ArrowLeft,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import CameraAttendanceView from '../components/CameraAttendanceView';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function AttendanceSession() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [session, setSession] = useState(null);
  const [presentRecords, setPresentRecords] = useState([]);
  const [absentStudents, setAbsentStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(false);
  const [activeTab, setActiveTab] = useState('present'); // 'present' | 'absent'

  useEffect(() => {
    fetchSessionDetails();
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      const res = await api.get(`/attendance/session/${sessionId}`);
      setSession(res.data.session);
      setPresentRecords(res.data.presentRecords || []);
      setAbsentStudents(res.data.absentStudents || []);
    } catch (err) {
      console.error('Failed to load attendance session:', err);
      addToast('Error loading session details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStopSession = async () => {
    if (!window.confirm('Are you sure you want to stop this attendance session? Camera tracking will end.')) {
      return;
    }

    setStopping(true);
    try {
      const res = await api.post('/attendance/stop', { sessionId });
      addToast(`Session concluded! Total Present: ${res.data.presentCount}`, 'success');
      navigate('/reports');
    } catch (err) {
      console.error('Failed to stop session:', err);
      addToast('Error stopping attendance session.', 'error');
    } finally {
      setStopping(false);
    }
  };

  const handleManualMark = async (studentId) => {
    try {
      const res = await api.post('/attendance/mark', {
        studentId,
        sessionId,
        confidence: 100.0,
        status: 'Present',
      });

      if (res.data.marked) {
        addToast(res.data.message || 'Student marked present manually.', 'success');
        fetchSessionDetails();
      } else if (res.data.alreadyMarked) {
        addToast(res.data.message, 'warning');
      }
    } catch (err) {
      addToast('Error marking attendance manually.', 'error');
    }
  };

  const handleMarkAllPresent = async () => {
    if (!absentStudents.length) return;
    try {
      for (const st of absentStudents) {
        await api.post('/attendance/mark', {
          studentId: st.studentId,
          sessionId,
          confidence: 100.0,
          status: 'Present',
        });
      }
      addToast(`Marked ${absentStudents.length} student(s) present!`, 'success');
      fetchSessionDetails();
    } catch (err) {
      console.error(err);
      addToast('Error marking all students present.', 'error');
    }
  };

  const onFaceAttendanceMarked = (recognizedData) => {
    // Refresh student lists dynamically
    fetchSessionDetails();
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const totalClass = presentRecords.length + absentStudents.length;

  return (
    <div className="space-y-6">
      {/* Session Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link
            to="/teacher"
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {session?.subject || 'Attendance Session'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                {session?.className} ({session?.section})
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
              <span>Date: <strong className="text-slate-200">{session?.date}</strong></span>
              <span>Started: <strong className="text-slate-200">{session?.startTime}</strong></span>
              <span>Instructor: <strong className="text-slate-200">{session?.teacherName}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-mono">Present Count</span>
            <div className="text-xl font-extrabold text-emerald-400">
              {presentRecords.length} <span className="text-xs text-slate-400">/ {totalClass || 60}</span>
            </div>
          </div>

          <button
            onClick={handleStopSession}
            disabled={stopping}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-5 py-3 text-xs font-bold text-white shadow-xl shadow-rose-600/30 hover:from-rose-500 hover:to-red-500 transition active:scale-95 disabled:opacity-50"
          >
            <StopCircle className="w-4 h-4" />
            {stopping ? 'Stopping...' : 'Stop Attendance'}
          </button>
        </div>
      </div>

      {/* Real-Time Live Camera Attendance View (Section 16 & 18) */}
      <CameraAttendanceView sessionId={sessionId} onAttendanceMarked={onFaceAttendanceMarked} />

      {/* Tabs & Attendance Rosters */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('present')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'present'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Present Students ({presentRecords.length})
            </button>

            <button
              onClick={() => setActiveTab('absent')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'absent'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              Not Yet Scanned ({absentStudents.length})
            </button>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'absent' && absentStudents.length > 0 && (
              <button
                onClick={handleMarkAllPresent}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark All Present ({absentStudents.length})
              </button>
            )}

            <Link
              to="/reports"
              className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Full Roster Report
            </Link>
          </div>
        </div>

        {/* Tab 1: Present Records */}
        {activeTab === 'present' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3 font-semibold">Student Name</th>
                  <th className="py-2.5 px-3 font-semibold">Roll Number</th>
                  <th className="py-2.5 px-3 font-semibold">Scanned Time</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {presentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No students marked present yet. Faces recognized on camera will appear here.
                    </td>
                  </tr>
                ) : (
                  presentRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-3 font-bold text-white">{rec.studentName}</td>
                      <td className="py-2.5 px-3 font-mono text-cyan-400">{rec.rollNumber}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{rec.time}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right text-emerald-400 font-bold">
                        {rec.confidence}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Absent / Pending Records */}
        {activeTab === 'absent' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3 font-semibold">Student Name</th>
                  <th className="py-2.5 px-3 font-semibold">Roll Number</th>
                  <th className="py-2.5 px-3 font-semibold">Current Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {absentStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-emerald-400 font-semibold">
                      🎉 100% Attendance! All registered students in this class have scanned their face.
                    </td>
                  </tr>
                ) : (
                  absentStudents.map((st) => (
                    <tr key={st.studentId} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-3 font-bold text-white">{st.studentName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{st.rollNumber}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Absent
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleManualMark(st.studentId)}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white border border-slate-700 text-slate-300 text-xs font-bold transition"
                        >
                          Mark Present
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
