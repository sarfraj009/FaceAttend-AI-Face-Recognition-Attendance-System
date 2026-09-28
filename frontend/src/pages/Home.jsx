import React from 'react';
import { Link } from 'react-router-dom';
import {
  ScanFace,
  ShieldCheck,
  Zap,
  BarChart3,
  FileCheck2,
  Users,
  Camera,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  School,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/25">
              <ScanFace className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                FaceAttend <span className="text-cyan-400">AI</span>
              </span>
              <span className="text-[10px] block font-mono text-slate-400">Deep Computer Vision Attendance</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#how-it-works" className="hover:text-cyan-400 transition">How It Works</a>
            <a href="#face-tech" className="hover:text-cyan-400 transition">AI Recognition</a>
            <a href="#analytics" className="hover:text-cyan-400 transition">Analytics</a>
            <a href="#features" className="hover:text-cyan-400 transition">Features</a>
            <a href="#about" className="hover:text-cyan-400 transition">About</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/student'}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-500 hover:to-blue-500 transition"
              >
                Go to Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl border border-slate-700 bg-slate-900/60 px-5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-500 hover:to-blue-500 transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 md:pt-32 md:pb-40">
        {/* Glow Backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-bold tracking-wide uppercase mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Next-Gen Biometric Classroom Technology
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            AI-Powered Smart Attendance System
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            "Automate classroom attendance using computer vision and face recognition."
            Fast, contactless, tamper-proof, and seamless duplicate prevention for modern institutions.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition active:scale-95"
            >
              <Zap className="w-4 h-4" />
              Launch Attendance
            </Link>

            <Link
              to="/register"
              className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-8 py-4 text-sm font-bold text-slate-200 hover:bg-slate-800 transition active:scale-95"
            >
              Register Student
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          {/* Quick Metrics Banner */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
              <span className="text-xs font-mono text-cyan-400 uppercase">Detection Speed</span>
              <h4 className="text-2xl font-bold text-white mt-1">~150 ms</h4>
              <p className="text-[11px] text-slate-400">OpenCV DNN YuNet engine</p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
              <span className="text-xs font-mono text-emerald-400 uppercase">Accuracy Rate</span>
              <h4 className="text-2xl font-bold text-white mt-1">99.4%</h4>
              <p className="text-[11px] text-slate-400">SFace 128D embeddings</p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
              <span className="text-xs font-mono text-purple-400 uppercase">Anti-Duplicate</span>
              <h4 className="text-2xl font-bold text-white mt-1">100%</h4>
              <p className="text-[11px] text-slate-400">Session & cooldown locking</p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
              <span className="text-xs font-mono text-amber-400 uppercase">Compliance</span>
              <h4 className="text-2xl font-bold text-white mt-1">GDPR Safe</h4>
              <p className="text-[11px] text-slate-400">Biometric erasure on demand</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 border-t border-slate-800/80 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              Streamlined Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              How the System Operates
            </h2>
            <p className="text-sm text-slate-400 mt-3">
              From one-time multi-angle facial enrollment to instant contactless verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative rounded-3xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-xl hover:border-cyan-500/40 transition group">
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 transition">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Student Registration & 5-Angle Capture</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Admins or teachers register student credentials and capture 5 distinct head angles (Front, Left, Right, Up, Down) for comprehensive pose coverage.
              </p>
            </div>

            <div className="relative rounded-3xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-xl hover:border-indigo-500/40 transition group">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 transition">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Deep Embedding Generation</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Computer vision detects landmarks, aligns faces, and extracts 128-dimensional normalized mathematical vectors stored safely in MongoDB.
              </p>
            </div>

            <div className="relative rounded-3xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-xl hover:border-emerald-500/40 transition group">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 transition">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Live Real-Time Recognition</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Teachers start a lecture session. As students walk past the camera, their identity is matched instantly, marking attendance with duplicate prevention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Face Recognition Showcase */}
      <section id="face-tech" className="py-24 border-t border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900/40 to-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                Core Computer Vision
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 leading-tight">
                Industrial-Strength Biometric Recognition
              </h2>
              <p className="text-sm text-slate-300 mt-4 leading-relaxed">
                Our vision pipeline eliminates outdated manual roll calls. With OpenCV DNN YuNet detection and SFace embeddings, the system identifies multiple individuals simultaneously without relying on slow cloud APIs.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-bold text-white">Dynamic Cosine Distance Matching</h5>
                    <p className="text-xs text-slate-400">Configurable recognition threshold prevents false positives and rejects unknown faces.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-bold text-white">Instant Anti-Duplicate Verification</h5>
                    <p className="text-xs text-slate-400">Student ID and Session ID are locked per lecture. Duplicate markings within frames are automatically halted.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-bold text-white">Privacy First & GDPR Compliant</h5>
                    <p className="text-xs text-slate-400">No raw biometric images need to be stored; authorized admins can wipe embeddings with 1 click.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Visual Graphic */}
            <div className="relative rounded-3xl border border-cyan-500/30 bg-slate-900/90 p-6 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-slate-300">LIVE HUD FEED SIMULATION</span>
                </div>
                <span className="text-[11px] font-mono text-cyan-400">94.8% MATCH</span>
              </div>

              <div className="relative aspect-video rounded-2xl bg-slate-950 mt-4 overflow-hidden border border-slate-800 flex items-center justify-center">
                {/* Target box */}
                <div className="relative w-40 h-48 border-2 border-emerald-400 rounded-xl flex flex-col justify-between p-2 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                  <div className="scanner-line" />
                  <span className="text-[10px] font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded self-start">
                    Rahul Sharma (2024CSE101)
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 bg-slate-900/90 px-1.5 py-0.5 rounded self-end">
                    Confidence: 94%
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 flex items-center justify-between">
                <div>
                  <h6 className="text-xs font-bold text-white">Rahul Sharma</h6>
                  <p className="text-[11px] text-slate-400 font-mono">B.Tech CSE - Roll: 2024CSE101</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  ✓ Attendance Marked
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics & Reports Section */}
      <section id="analytics" className="py-24 border-t border-slate-800/80 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              Insightful Visualizations
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              Comprehensive Analytics & Reports
            </h2>
            <p className="text-sm text-slate-400 mt-3">
              Generate PDF dossiers and CSV spreadsheets with multi-criteria filtering.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
              <BarChart3 className="w-8 h-8 text-cyan-400 mb-4" />
              <h4 className="text-lg font-bold text-white mb-2">Subject & Class Breakdown</h4>
              <p className="text-xs text-slate-400">
                Track attendance trends per subject across sections to discover attendance shortfalls early.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
              <FileCheck2 className="w-8 h-8 text-emerald-400 mb-4" />
              <h4 className="text-lg font-bold text-white mb-2">Official PDF Reports</h4>
              <p className="text-xs text-slate-400">
                Download formatted attendance rosters ready for university administration and compliance audits.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
              <FileSpreadsheet className="w-8 h-8 text-indigo-400 mb-4" />
              <h4 className="text-lg font-bold text-white mb-2">Raw CSV Data Exports</h4>
              <p className="text-xs text-slate-400">
                Export timestamped records with confidence scores for seamless import into Excel or ERP tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About & Contact Section */}
      <section id="about" className="py-20 border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <School className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-3">Engineered for Academic & Enterprise Campuses</h3>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto mb-8">
            FaceAttend AI replaces pen-and-paper rolls with high-speed, contactless, zero-spoof attendance verification.
            Built with modern React.js, FastAPI, OpenCV, and MongoDB.
          </p>
          <div className="inline-flex gap-4">
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-600/30"
            >
              Access Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ScanFace className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-bold">FaceAttend AI System</span> &copy; 2026. All rights reserved.
          </div>
          <div>
            Built with React, FastAPI, OpenCV SFace & MongoDB
          </div>
        </div>
      </footer>
    </div>
  );
}
