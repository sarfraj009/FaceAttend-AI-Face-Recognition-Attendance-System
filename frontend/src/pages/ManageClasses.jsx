import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Layers, RefreshCw, X } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function ManageClasses() {
  const { addToast } = useToast();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const initialForm = {
    course: 'B.Tech CSE',
    branch: 'Computer Science',
    year: '3rd Year',
    section: 'CSE-A',
    subject: 'Computer Networks',
  };
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
      addToast('Error fetching classes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/classes', formData);
      addToast(`Class ${formData.course} (${formData.section}) created!`, 'success');
      setModalOpen(false);
      setFormData(initialForm);
      fetchClasses();
    } catch (err) {
      addToast('Failed to create class.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cls) => {
    if (!window.confirm(`Delete class ${cls.course} - ${cls.section}?`)) return;
    try {
      await api.delete(`/classes/${cls.id}`);
      addToast('Class removed successfully.', 'success');
      fetchClasses();
    } catch (err) {
      addToast('Failed to delete class.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Academic Courses & Classes
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure institutional courses, branch divisions, sections, and assigned subjects.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchClasses}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-xl shadow-amber-600/30 hover:from-amber-500 hover:to-orange-500 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Class / Subject
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 rounded-3xl border border-slate-800 bg-slate-900/40">
            <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            No classes defined. Click "Add Class / Subject" to create one.
          </div>
        ) : (
          classes.map((cls) => (
            <div
              key={cls.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl hover:border-amber-500/40 transition group relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                    {cls.section}
                  </span>
                  <button
                    onClick={() => handleDelete(cls)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition"
                    title="Delete Class"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{cls.course}</h3>
                <p className="text-xs text-slate-400 font-medium">{cls.branch}</p>

                <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subject:</span>
                    <span className="font-bold text-cyan-400">{cls.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Academic Year:</span>
                    <span className="text-slate-200">{cls.year}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="text-lg font-bold text-white">Create Class & Subject</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Course Name *</label>
                <input
                  type="text"
                  required
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  placeholder="e.g. B.Tech CSE"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Branch *</label>
                <input
                  type="text"
                  required
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="e.g. Computer Science"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Section</label>
                  <input
                    type="text"
                    required
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    placeholder="CSE-A"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Computer Networks"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-600/30"
                >
                  {submitting ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
