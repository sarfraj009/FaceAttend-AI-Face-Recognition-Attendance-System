import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Camera,
  FileSpreadsheet,
  UserCheck,
  LogOut,
  Menu,
  X,
  ScanFace,
  ChevronRight,
  Shield,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MainLayout() {
  const { user, logout, isAdmin, isTeacher, isStudent } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [];

  if (isAdmin) {
    navLinks.push(
      { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
      { to: '/students', label: 'Manage Students', icon: Users },
      { to: '/teachers', label: 'Manage Teachers', icon: GraduationCap },
      { to: '/classes', label: 'Manage Classes', icon: BookOpen },
      { to: '/attendance/start', label: 'Live Attendance Camera', icon: Camera },
      { to: '/reports', label: 'Attendance Reports', icon: FileSpreadsheet }
    );
  } else if (isTeacher) {
    navLinks.push(
      { to: '/teacher', label: 'Teacher Dashboard', icon: LayoutDashboard },
      { to: '/attendance/start', label: 'Start Attendance', icon: Camera },
      { to: '/students', label: 'Assigned Students', icon: Users },
      { to: '/reports', label: 'Attendance Reports', icon: FileSpreadsheet }
    );
  } else if (isStudent) {
    navLinks.push(
      { to: '/student', label: 'My Attendance', icon: LayoutDashboard },
      { to: '/student/profile', label: 'Student Profile', icon: Users },
      { to: '/reports', label: 'Attendance Records', icon: Clock }
    );
  }

  const roleBadgeColor = isAdmin
    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    : isTeacher
    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-slate-800 bg-slate-900/90 backdrop-blur-2xl">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/25">
            <ScanFace className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              FaceAttend <span className="text-cyan-400">AI</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-400">Smart Biometric Attendance</p>
          </div>
        </div>

        {/* User Card */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-cyan-400 font-bold border border-slate-700">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <h4 className="truncate text-sm font-bold text-white">{user?.name}</h4>
              <span className={`inline-block px-2 py-0.5 mt-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${roleBadgeColor}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation Menu
          </div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/10 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 opacity-40" />
              </NavLink>
            );
          })}
        </nav>

        {/* Logout bottom */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-950/40 hover:border-rose-500/30 transition"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/60 px-6 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-mono text-cyan-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                SYSTEM STATUS: ACTIVE & ONLINE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/"
              className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-800 transition"
            >
              Public Home
            </NavLink>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden md:block text-right">
                <p className="text-xs font-bold text-white">{user?.name}</p>
                <p className="text-[10px] text-slate-400">{user?.email}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600/30 text-cyan-300 font-bold text-xs border border-cyan-500/30">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950/50">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/80 backdrop-blur-md">
          <div className="w-72 bg-slate-900 h-full border-r border-slate-800 flex flex-col p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-black text-white">FaceAttend AI</h2>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1.5 overflow-y-auto">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs font-bold text-rose-300"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
