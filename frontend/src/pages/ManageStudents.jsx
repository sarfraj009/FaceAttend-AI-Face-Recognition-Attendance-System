import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Camera,
  Shield,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Phone,
  Mail,
  GraduationCap
} from 'lucide-react';
import api from '../services/api';
import FaceCaptureModal from '../components/FaceCaptureModal';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

export default function ManageStudents() {
  const { addToast } = useToast();
  const { isAdmin } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [faceModalStudent, setFaceModalStudent] = useState(null);

  // Form state
  const initialForm = {
    name: '',
    rollNumber: '',
    enrollmentNumber: '',
    email: '',
    phone: '',
    course: 'B.Tech CSE',
    branch: 'Computer Science',
    year: '3rd Year',
    section: 'CSE-A',
    profileImage: '',
  };
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [search, courseFilter, sectionFilter]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (courseFilter) params.course = courseFilter;
      if (sectionFilter) params.section = sectionFilter;

      const res = await api.get('/students', { params });
      setStudents(res.data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      addToast('Error fetching students list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData(initialForm);
    setAddModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || '',
      rollNumber: student.rollNumber || '',
      enrollmentNumber: student.enrollmentNumber || '',
      email: student.email || '',
      phone: student.phone || '',
      course: student.course || 'B.Tech CSE',
      branch: student.branch || 'Computer Science',
      year: student.year || '3rd Year',
      section: student.section || 'A',
      profileImage: student.profileImage || '',
    });
    setAddModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingStudent) {
        await api.put(`/students/${editingStudent.id}`, formData);
        addToast(`Student ${formData.name} updated successfully!`, 'success');
        setAddModalOpen(false);
        fetchStudents();
      } else {
        const res = await api.post('/students', formData);
        addToast(`Student ${formData.name} created successfully!`, 'success');
        setAddModalOpen(false);
        fetchStudents();

        // Prompt immediate face capture for registered student
        const newStudent = res.data;
        setTimeout(() => {
          setFaceModalStudent(newStudent);
        }, 400);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save student details.';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (student) => {
    if (!window.confirm(`Are you sure you want to permanently delete student "${student.name}" (${student.rollNumber})? This will also remove their attendance logs.`)) {
      return;
    }

    try {
      await api.delete(`/students/${student.id}`);
      addToast(`Student ${student.name} deleted.`, 'success');
      fetchStudents();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to delete student.';
      addToast(msg, 'error');
    }
  };

  const handleDeleteBiometrics = async (student) => {
    if (!window.confirm(`Wipe biometric face embeddings for ${student.name}? The student will need to be re-enrolled with camera to enable facial recognition.`)) {
      return;
    }

    try {
      await api.delete(`/students/${student.id}/face`);
      addToast(`Biometric face data erased for ${student.name}.`, 'info');
      fetchStudents();
    } catch (err) {
      addToast('Failed to erase biometric face data.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Student Management & Biometrics
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Enroll students, register multi-angle facial embeddings, and manage cohort credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStudents}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xl shadow-cyan-600/30 hover:from-cyan-500 hover:to-blue-500 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add New Student
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, Roll No, Email..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
        >
          <option value="">All Courses</option>
          <option value="B.Tech CSE">B.Tech CSE</option>
          <option value="B.Tech AI-DS">B.Tech AI-DS</option>
          <option value="B.Tech IT">B.Tech IT</option>
          <option value="B.Tech ECE">B.Tech ECE</option>
        </select>

        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
        >
          <option value="">All Sections</option>
          <option value="CSE-A">CSE-A</option>
          <option value="CSE-B">CSE-B</option>
          <option value="AI-1">AI-1</option>
          <option value="A">Section A</option>
          <option value="B">Section B</option>
        </select>
      </div>

      {/* Students Data Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                <th className="py-3.5 px-4 font-semibold">Student</th>
                <th className="py-3.5 px-4 font-semibold">Roll Number</th>
                <th className="py-3.5 px-4 font-semibold">Enrollment No</th>
                <th className="py-3.5 px-4 font-semibold">Course & Branch</th>
                <th className="py-3.5 px-4 font-semibold">Year / Sec</th>
                <th className="py-3.5 px-4 font-semibold">Biometric Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    No students match your query. Click "Add New Student" to enroll.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-cyan-400">
                          {student.profileImage ? (
                            <img src={student.profileImage} alt={student.name} className="h-full w-full object-cover" />
                          ) : (
                            student.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white">{student.name}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-500" />
                              {student.email || 'No email'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {student.rollNumber}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      {student.enrollmentNumber}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-200">{student.course}</span>
                      <p className="text-[11px] text-slate-400">{student.branch}</p>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {student.year} <span className="text-slate-500 font-mono">({student.section})</span>
                    </td>

                    <td className="py-3 px-4">
                      {student.hasFaceData ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Enrolled ({student.faceSamplesCount} angles)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          Face Missing
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Capture Face Button */}
                        <button
                          onClick={() => setFaceModalStudent(student)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600 border border-cyan-500/40 text-cyan-200 text-xs font-bold transition shadow-sm"
                          title="Capture Face Biometrics"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Capture Face
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                          title="Edit Student Info"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Wipe Biometrics (Privacy Compliance) */}
                        {student.hasFaceData && isAdmin && (
                          <button
                            onClick={() => handleDeleteBiometrics(student)}
                            className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-950/30 text-amber-300 hover:bg-amber-900/50 transition"
                            title="Delete Biometric Face Data"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Student */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteStudent(student)}
                            className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 transition"
                            title="Delete Student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="text-lg font-bold text-white">
                {editingStudent ? 'Edit Student Details' : 'Register New Student'}
              </h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    placeholder="e.g. 2024CSE101"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Enrollment Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.enrollmentNumber}
                    onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                    placeholder="e.g. EN202401001"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. rahul@university.edu"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Course / Degree
                  </label>
                  <input
                    type="text"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    placeholder="e.g. B.Tech CSE"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Branch</label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="Computer Science"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
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
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    placeholder="e.g. CSE-A"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold hover:from-cyan-500 hover:to-blue-500 transition shadow-lg shadow-cyan-600/30"
                >
                  {submitting ? 'Saving...' : editingStudent ? 'Update Student' : 'Save & Capture Face'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Face Biometric Enrollment Modal */}
      {faceModalStudent && (
        <FaceCaptureModal
          student={faceModalStudent}
          onClose={() => setFaceModalStudent(null)}
          onSuccess={() => {
            fetchStudents();
            setFaceModalStudent(null);
          }}
        />
      )}
    </div>
  );
}
