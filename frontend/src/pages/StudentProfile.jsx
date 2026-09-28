import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Camera,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import FaceCaptureModal from '../components/FaceCaptureModal';
import { useToast } from '../components/Toast';

export default function StudentProfile() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      let sid = user?.studentId;
      if (!sid) {
        const sRes = await api.get('/students');
        const match = sRes.data.find(
          (s) => s.email?.toLowerCase() === user?.email?.toLowerCase()
        );
        if (match) sid = match.id;
        else if (sRes.data.length > 0) sid = sRes.data[0].id;
      }

      if (sid) {
        const res = await api.get(`/students/${sid}`);
        setStudent(res.data);
      }
    } catch (err) {
      console.error('Error fetching student profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      addToast('Please fill in all password fields.', 'warning');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast('New passwords do not match.', 'error');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      addToast('Password must be at least 6 characters long.', 'warning');
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      addToast('Password updated successfully.', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update password.';
      addToast(msg, 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Student Biometric Profile
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Review your enrolled academic credentials and manage your facial recognition data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-xl text-center flex flex-col items-center">
          <div className="relative mb-4">
            <div className="h-28 w-28 rounded-3xl bg-slate-800 border-2 border-cyan-500/40 overflow-hidden flex items-center justify-center text-4xl font-bold text-cyan-400 shadow-xl">
              {student?.profileImage ? (
                <img src={student.profileImage} alt={student.name} className="h-full w-full object-cover" />
              ) : (
                student?.name?.charAt(0).toUpperCase() || 'S'
              )}
            </div>
            {student?.hasFaceData && (
              <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-500 text-white shadow-md" title="Biometrically Enrolled">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-white">{student?.name || user?.name}</h3>
          <p className="text-xs text-cyan-400 font-mono mt-0.5">{student?.rollNumber || '2024CSE101'}</p>

          <span className="mt-3 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            {student?.course || 'B.Tech CSE'} - {student?.section || 'CSE-A'}
          </span>

          <div className="w-full mt-6 pt-5 border-t border-slate-800 space-y-2.5 text-xs text-left">
            <div className="flex items-center justify-between text-slate-400">
              <span>Enrollment:</span>
              <span className="font-mono text-slate-200">{student?.enrollmentNumber || 'EN202401001'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Academic Year:</span>
              <span className="text-slate-200">{student?.year || '3rd Year'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Branch:</span>
              <span className="text-slate-200">{student?.branch || 'Computer Science'}</span>
            </div>
          </div>
        </div>

        {/* Biometrics Card & Contact Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Biometrics Status Box */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <h4 className="text-base font-bold text-white">Biometric Face Authentication</h4>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                  student?.hasFaceData
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {student?.hasFaceData ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled Active
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" /> Face Data Not Registered
                  </>
                )}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              Your biometric face embeddings are stored as 128-dimensional vectors for instant classroom attendance.
              {student?.hasFaceData
                ? ` You have ${student.faceSamplesCount} pose sample angles registered in the recognition database.`
                : ' Please enroll your face poses using your device camera to enable automatic roll call verification.'}
            </p>

            <button
              onClick={() => setCaptureModalOpen(true)}
              disabled={!student}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition active:scale-95"
            >
              <Camera className="w-4 h-4" />
              {student?.hasFaceData ? 'Re-Capture / Update Face Angles' : 'Capture Face Biometrics Now'}
            </button>
          </div>

          {/* Contact Details */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-xl space-y-4">
            <h4 className="text-base font-bold text-white mb-2">Student Registered Information</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 flex items-center gap-3">
                <Mail className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Institutional Email</span>
                  <span className="text-slate-200 font-medium">{student?.email || user?.email}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 flex items-center gap-3">
                <Phone className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Phone Number</span>
                  <span className="text-slate-200 font-mono">{student?.phone || '+91 98765 43210'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-xl">
            <h4 className="text-base font-bold text-white mb-4">Account security</h4>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <input
                type="password"
                placeholder="Current password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
              <input
                type="password"
                placeholder="New password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={changingPassword}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50"
              >
                {changingPassword ? 'Updating password...' : 'Change password'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {captureModalOpen && student && (
        <FaceCaptureModal
          student={student}
          onClose={() => setCaptureModalOpen(false)}
          onSuccess={() => {
            fetchProfile();
            setCaptureModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
