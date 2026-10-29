import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { toast } from 'sonner';

export const DashboardLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info('Anda telah keluar dari sistem.');
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/projects')) return 'Proyek & Workspace';
    if (path.startsWith('/tasks')) return 'Manajemen Tugas';
    if (path.startsWith('/users')) return 'Manajemen Tim & Pengguna';
    if (path.startsWith('/comments')) return 'Aktivitas Komentar';
    return 'Dashboard Ikhtisar';
  };

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 group ${
      isActive
        ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/25 font-semibold'
        : 'text-slate-600 hover:text-primary-600 hover:bg-white/80 hover:shadow-sm'
    }`;

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/users', label: 'Team & Users', icon: Users },
    { to: '/comments', label: 'Comments', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 relative overflow-x-hidden selection:bg-primary-500 selection:text-white">
      {/* Background glowing decorations */}
      <div className="fixed top-[-15%] left-[-10%] w-[500px] h-[500px] bg-primary-200/35 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-purple-200/35 rounded-full blur-3xl pointer-events-none"></div>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`w-72 glass-panel border-r border-white/80 flex flex-col z-50 m-3 md:m-4 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/60 fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[110%]'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-white/60 bg-white/40 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">
                  TaskFlow
                </h1>
                <span className="text-[11px] font-semibold text-primary-600 uppercase tracking-wider">
                  Management App
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card in Sidebar */}
          <div className="mt-5 p-3 rounded-2xl bg-white/70 border border-white/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate">
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary-100 text-primary-700 uppercase">
                  {user?.role || 'Member'}
                </span>
                <span className="text-[10px] text-slate-400 truncate">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={navItemClass}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="p-4 border-t border-white/60 bg-white/30 backdrop-blur-sm">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 rounded-2xl font-semibold text-sm text-red-600 bg-red-50/80 hover:bg-red-500 hover:text-white transition-all duration-200 flex items-center justify-center gap-2 group shadow-sm"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        {/* Top Header Navbar */}
        <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-white/60 flex items-center justify-between px-5 md:px-8 md:mx-4 md:mt-4 md:rounded-3xl shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 md:hidden shadow-sm active:scale-95"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight">
                {getPageTitle()}
              </h2>
              <p className="text-xs text-slate-500 hidden sm:block">
                Kelola proyek dan tugas tim Anda secara terorganisir
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200/80">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.name || user?.email?.split('@')[0]}
                </p>
                <p className="text-[11px] font-medium text-slate-500 capitalize">{user?.role || 'Member'}</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-primary-500/20 border-2 border-white">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-6 md:px-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};