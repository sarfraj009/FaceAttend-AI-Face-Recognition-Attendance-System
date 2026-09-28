import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function AttendanceReports() {
  const { addToast } = useToast();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const [stats, setStats] = useState({
    totalRecords: 0,
    presentCount: 0,
    absentCount: 0,
    percentage: 100,
  });

  const [filters, setFilters] = useState({
    rollNumber: '',
    className: '',
    section: '',
    subject: '',
    startDate: '',
    endDate: '',
    status: '',
  });

  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchClasses();
    fetchReports();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      );
      const res = await api.get('/reports/attendance', { params: cleanParams });
      setRecords(res.data.records || []);
      setStats({
        totalRecords: res.data.totalRecords || 0,
        presentCount: res.data.presentCount || 0,
        absentCount: res.data.absentCount || 0,
        percentage: res.data.percentage || 100,
      });
    } catch (err) {
      console.error('Error fetching reports:', err);
      addToast('Failed to fetch attendance reports.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handleReset = () => {
    setFilters({
      rollNumber: '',
      className: '',
      section: '',
      subject: '',
      startDate: '',
      endDate: '',
      status: '',
    });
    setTimeout(() => {
      fetchReports();
    }, 50);
  };

  const handleDownload = async (format) => {
    setDownloading(true);
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      );
      const queryString = new URLSearchParams(cleanParams).toString();
      const url = `/reports/attendance/${format}${queryString ? `?${queryString}` : ''}`;

      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv',
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `attendance_report_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      addToast(`Downloaded official ${format.toUpperCase()} report!`, 'success');
    } catch (err) {
      console.error(`Download error for ${format}:`, err);
      addToast(`Failed to generate ${format.toUpperCase()} report.`, 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Attendance Reports & Audits
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Filter attendance dossiers by date, subject, or roll number. Export official PDF and CSV records.
          </p>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleDownload('csv')}
            disabled={downloading || records.length === 0}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 transition active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export CSV
          </button>

          <button
            onClick={() => handleDownload('pdf')}
            disabled={downloading || records.length === 0}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xl shadow-cyan-600/30 hover:from-cyan-500 hover:to-blue-500 transition active:scale-95 disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary KPI Strip (Section 11 Example) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400">Total Scanned Logs</span>
          <h3 className="text-2xl font-bold text-white mt-1">{stats.totalRecords}</h3>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
          <span className="text-[10px] font-mono uppercase text-emerald-400">Present</span>
          <h3 className="text-2xl font-bold text-emerald-300 mt-1">{stats.presentCount}</h3>
        </div>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-4">
          <span className="text-[10px] font-mono uppercase text-rose-400">Absent</span>
          <h3 className="text-2xl font-bold text-rose-300 mt-1">{stats.absentCount}</h3>
        </div>
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-4">
          <span className="text-[10px] font-mono uppercase text-cyan-400">Attendance Rate</span>
          <h3 className="text-2xl font-bold text-cyan-300 mt-1">{stats.percentage}%</h3>
        </div>
      </div>

      {/* Filter Toolbar */}
      <form onSubmit={handleApplyFilter} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Roll Number</label>
            <input
              type="text"
              value={filters.rollNumber}
              onChange={(e) => handleFilterChange('rollNumber', e.target.value)}
              placeholder="e.g. 2024CSE101"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Class / Course</label>
            <select
              value={filters.className}
              onChange={(e) => handleFilterChange('className', e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="">All Courses</option>
              <option value="B.Tech CSE">B.Tech CSE</option>
              <option value="B.Tech AI-DS">B.Tech AI-DS</option>
              <option value="B.Tech IT">B.Tech IT</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Section</label>
            <input
              type="text"
              value={filters.section}
              onChange={(e) => handleFilterChange('section', e.target.value)}
              placeholder="CSE-A"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition"
            >
              Reset
            </button>
          </div>
        </div>
      </form>

      {/* Reports Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Time</th>
                <th className="py-3 px-4 font-semibold">Student Name</th>
                <th className="py-3 px-4 font-semibold">Roll Number</th>
                <th className="py-3 px-4 font-semibold">Class / Sec</th>
                <th className="py-3 px-4 font-semibold">Subject</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                    Filtering records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No attendance records found matching current filters.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono text-slate-300">{r.date}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{r.time}</td>
                    <td className="py-3 px-4 font-bold text-white">{r.studentName}</td>
                    <td className="py-3 px-4 font-mono text-cyan-400 font-bold">{r.rollNumber}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {r.className} <span className="text-slate-500">({r.section})</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{r.subject || 'General'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.status === 'Present'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-right text-emerald-400 font-bold">
                      {r.confidence}%
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
