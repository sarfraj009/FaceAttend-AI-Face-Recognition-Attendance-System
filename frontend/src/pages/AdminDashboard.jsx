import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck2,
  Percent,
  TrendingUp,
  Camera,
  FileSpreadsheet,
  PlusCircle,
  RefreshCw,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import StatCard from '../components/StatCard';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function AdminDashboard() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    todayPresent: 0,
    todayAbsent: 0,
    attendancePercentage: 0,
    dailyTrends: [],
    subjectStats: [],
  });
  const [todayData, setTodayData] = useState({ sessions: [], recentAttendance: [] });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, todayRes] = await Promise.all([
        api.get('/attendance/analytics'),
        api.get('/attendance/today'),
      ]);
      setStats(analyticsRes.data);
      setTodayData(todayRes.data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      addToast('Error fetching dashboard analytics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: 'Present', value: stats.todayPresent || 1, color: '#10b981' },
    { name: 'Absent', value: stats.todayAbsent || 0, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Administrator Command Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time biometric attendance metrics, faculty overview, and institutional analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <Link
            to="/attendance/start"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/25 hover:from-cyan-500 hover:to-blue-500 transition"
          >
            <Camera className="w-3.5 h-3.5" />
            Launch Live Camera
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          subtitle="Enrolled learners"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Teachers"
          value={stats.totalTeachers}
          subtitle="Faculty members"
          icon={GraduationCap}
          color="purple"
        />
        <StatCard
          title="Active Classes"
          value={stats.totalClasses}
          subtitle="Registered courses"
          icon={BookOpen}
          color="amber"
        />
        <StatCard
          title="Today's Present"
          value={stats.todayPresent}
          subtitle={`${stats.todayAbsent} marked absent`}
          icon={CalendarCheck2}
          color="emerald"
        />
        <StatCard
          title="Average Attendance"
          value={`${stats.attendancePercentage}%`}
          subtitle="Overall rate"
          icon={Percent}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-white">Recent attendance activity</h4>
              <p className="text-xs text-slate-400">Latest biometric check-ins across the campus</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {(todayData.recentAttendance || []).slice(0, 6).map((record) => (
              <div key={record.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">{record.studentName || 'Unknown Student'}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{record.rollNumber || 'N/A'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${record.status === 'Present' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'}`}>
                    {record.status}
                  </span>
                </div>
                <div className="mt-3 text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between"><span>Subject</span><span className="text-slate-200">{record.subject || 'General'}</span></div>
                  <div className="flex justify-between"><span>Time</span><span className="text-slate-200">{record.time || '--:--'}</span></div>
                </div>
              </div>
            ))}

            {(!todayData.recentAttendance || todayData.recentAttendance.length === 0) && (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-center text-sm text-slate-400">
                No attendance activity recorded yet today.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Attendance Trend AreaChart */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-white">Attendance Weekly Trend</h4>
              <p className="text-xs text-slate-400">Daily present count over the last 7 days</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="h-2 w-2 rounded-full bg-cyan-400" /> Present
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="h-2 w-2 rounded-full bg-rose-400" /> Absent
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="present"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPresent)"
                />
                <Area
                  type="monotone"
                  dataKey="absent"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAbsent)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Ratio Donut */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h4 className="text-base font-bold text-white">Today's Ratio</h4>
            <p className="text-xs text-slate-400">Classroom attendance split</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-center text-xs">
            <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/20">
              <span className="text-emerald-400 font-bold text-sm">{stats.todayPresent}</span>
              <p className="text-slate-400 text-[10px]">Present Today</p>
            </div>
            <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/20">
              <span className="text-rose-400 font-bold text-sm">{stats.todayAbsent}</span>
              <p className="text-slate-400 text-[10px]">Absent Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subject-Wise Attendance BarChart & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject-Wise BarChart */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-white">Subject-Wise Attendance Distribution</h4>
              <p className="text-xs text-slate-400">Average student attendance percentage per module</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.subjectStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="subject" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [`${val}%`, 'Attendance Rate']}
                />
                <Bar dataKey="percentage" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Administrative Quick Actions */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl space-y-3">
          <h4 className="text-base font-bold text-white mb-4">Quick Management</h4>

          <Link
            to="/students"
            className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-cyan-500/40 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">Manage Students</h5>
                <p className="text-[11px] text-slate-400">Add, edit, enroll face biometrics</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
          </Link>

          <Link
            to="/teachers"
            className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-purple-500/40 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">Manage Teachers</h5>
                <p className="text-[11px] text-slate-400">Faculty directory & assignments</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition" />
          </Link>

          <Link
            to="/classes"
            className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-amber-500/40 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">Manage Classes & Subjects</h5>
                <p className="text-[11px] text-slate-400">Courses, branches, sections</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
          </Link>

          <Link
            to="/reports"
            className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-emerald-500/40 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">Export Official Reports</h5>
                <p className="text-[11px] text-slate-400">Download CSV & PDF dossiers</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
          </Link>
        </div>
      </div>

      {/* Recent Live Attendance Activity */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-bold text-white">Today's Live Facial Scans</h4>
            <p className="text-xs text-slate-400">Timestamped attendance logs marked via camera</p>
          </div>
          <Link
            to="/reports"
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition"
          >
            View Full Records &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-3 px-4 font-semibold">Student Name</th>
                <th className="py-3 px-4 font-semibold">Roll Number</th>
                <th className="py-3 px-4 font-semibold">Subject</th>
                <th className="py-3 px-4 font-semibold">Time</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Match Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {todayData.recentAttendance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No attendance records logged yet today. Launch an attendance session to start scanning!
                  </td>
                </tr>
              ) : (
                todayData.recentAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-bold text-white">{rec.studentName}</td>
                    <td className="py-3 px-4 font-mono text-cyan-400">{rec.rollNumber}</td>
                    <td className="py-3 px-4 text-slate-300">{rec.subject || 'General'}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{rec.time}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                      {rec.confidence}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
