import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ScanFace, Lock, Mail, ArrowRight, Shield, User, GraduationCap, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function Login() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please enter both email and password.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      addToast(`Welcome back, ${user.name}!`, 'success');
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'teacher') navigate('/teacher');
      else navigate('/student');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid email or password.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    addToast(`Filled ${demoEmail} credentials`, 'info', 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative backdrop glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-xl shadow-cyan-500/25">
            <ScanFace className="h-7 w-7" />
          </div>
        </Link>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
          Sign In to FaceAttend AI
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Biometric Facial Attendance & Management Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        {/* Quick Demo Credentials Box */}
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 backdrop-blur-xl">
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block mb-2">
            1-Click Demo Accounts
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('admin@faceattend.ai', 'admin123')}
              className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-purple-500/50 transition text-xs"
            >
              <Shield className="w-4 h-4 text-purple-400 mb-1" />
              <span className="font-bold text-slate-200">Admin</span>
              <span className="text-[9px] text-slate-400">admin123</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('teacher@faceattend.ai', 'teacher123')}
              className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-cyan-500/50 transition text-xs"
            >
              <GraduationCap className="w-4 h-4 text-cyan-400 mb-1" />
              <span className="font-bold text-slate-200">Teacher</span>
              <span className="text-[9px] text-slate-400">teacher123</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('student@faceattend.ai', 'student123')}
              className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-emerald-500/50 transition text-xs"
            >
              <User className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="font-bold text-slate-200">Student</span>
              <span className="text-[9px] text-slate-400">student123</span>
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@faceattend.ai"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-600/30 hover:from-cyan-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50 transition active:scale-98"
            >
              {loading ? (
                'Signing In...'
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-cyan-400 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
