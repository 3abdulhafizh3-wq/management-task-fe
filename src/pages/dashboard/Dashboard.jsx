import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { projectService } from '../../api/projectService';
import { taskService } from '../../api/taskService';
import { userService } from '../../api/userService';
import { formatDateTime } from '../../utils/dateFormatter';
import { Modal } from '../../components/common/modal';
import { Input } from '../../components/common/input';
import { Button } from '../../components/common/button';
import {
  FolderKanban,
  CheckSquare,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState('all');

  // Quick Create Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ project_name: '', description: '', status: 'pending' });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    project_id: '',
    status: 'todo',
    priority: 'medium',
    deadline: '',
  });

  const fetchData = async () => {
    try {
      const [projectsRes, tasksRes, usersRes] = await Promise.all([
        projectService.getAllProjects(),
        taskService.getAllTasks(),
        userService.getAllUsers(),
      ]);
      setProjects(Array.isArray(projectsRes) ? projectsRes : []);
      setTasks(Array.isArray(tasksRes) ? tasksRes : []);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
    } catch (error) {
      console.error('Gagal memuat data dashboard:', error);
      toast.error('Gagal menyinkronkan data dengan backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick inline status change for tasks
  const handleQuickStatusChange = async (task, newStatus) => {
    try {
      const updatedPayload = {
        title: task.title,
        description: task.description || '',
        project_id: String(task.project_id),
        status: newStatus,
        priority: task.priority || 'medium',
        deadline: task.deadline ? new Date(task.deadline).toISOString() : new Date().toISOString(),
      };

      await taskService.updateTask(task.id, updatedPayload);
      toast.success(`Status tugas diubah menjadi "${newStatus.replace('_', ' ')}"`);
      
      // Update local state smoothly
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error('Gagal memperbarui status tugas:', err);
      toast.error('Gagal memperbarui status tugas di server');
    }
  };

  // Quick Project Create
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.project_name.trim()) return;

    try {
      await projectService.createProject({
        ...newProject,
        user_id: user?.id || 1,
      });
      toast.success('Proyek baru berhasil dibuat!');
      setIsProjectModalOpen(false);
      setNewProject({ project_name: '', description: '', status: 'pending' });
      fetchData();
    } catch (err) {
      console.error('Gagal membuat proyek:', err);
      toast.error('Gagal membuat proyek baru.');
    }
  };

  // Quick Task Create
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.project_id) {
      toast.error('Judul dan Proyek wajib diisi!');
      return;
    }

    try {
      await taskService.createTask({
        ...newTask,
        project_id: String(newTask.project_id),
        deadline: newTask.deadline ? new Date(newTask.deadline).toISOString() : new Date().toISOString(),
      });
      toast.success('Tugas baru berhasil ditambahkan!');
      setIsTaskModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        project_id: '',
        status: 'todo',
        priority: 'medium',
        deadline: '',
      });
      fetchData();
    } catch (err) {
      console.error('Gagal membuat tugas:', err);
      toast.error('Gagal membuat tugas.');
    }
  };

  // Compute calculated metrics
  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const todoTasks = tasks.filter((t) => t.status === 'todo').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filter tasks for the recent tasks widget
  const filteredTasks = tasks.filter((task) => {
    if (taskFilter === 'all') return true;
    return task.status === taskFilter;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">Tinggi</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">Sedang</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">Rendah</span>;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-800 text-white p-6 sm:p-8 shadow-xl shadow-primary-500/20">
        <div className="absolute -right-8 -top-8 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-primary-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Workspace Aktif</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Selamat Datang Kembali, {user?.name || user?.email?.split('@')[0] || 'Partner'}! 👋
            </h1>
            <p className="text-sm text-primary-100/90 max-w-xl">
              Pantau progres proyek secara real-time, selesaikan tugas-tugas prioritas, dan kolaborasi bersama tim Anda dengan mudah.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="px-4 py-2.5 rounded-xl font-bold text-sm bg-white text-primary-700 hover:bg-primary-50 shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tugas Baru</span>
            </button>
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="px-4 py-2.5 rounded-xl font-bold text-sm bg-primary-500/60 hover:bg-primary-500/80 text-white border border-white/20 backdrop-blur-md shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <FolderKanban className="w-4 h-4" />
              <span>Proyek Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <Link
          to="/projects"
          className="group p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Proyek</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-slate-800">{loading ? '...' : totalProjects}</h3>
            <span className="text-xs font-semibold text-primary-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Buka <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {projects.filter((p) => p.status === 'active').length} proyek aktif berjalan
          </p>
        </Link>

        {/* Total Tasks */}
        <Link
          to="/tasks"
          className="group p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Tugas</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-slate-800">{loading ? '...' : totalTasks}</h3>
            <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Lihat <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {inProgressTasks} sedang dikerjakan · {todoTasks} belum mulai
          </p>
        </Link>

        {/* Completion Rate */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Penyelesaian</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-emerald-600">{loading ? '...' : `${completionRate}%`}</h3>
            <span className="text-xs font-bold text-slate-500">{completedTasks}/{totalTasks} Tugas</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>

        {/* Registered Users */}
        <Link
          to="/users"
          className="group p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Anggota Tim</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-slate-800">{loading ? '...' : users.length}</h3>
            <span className="text-xs font-semibold text-purple-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Kelola <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Pengguna terdaftar di database</p>
        </Link>
      </div>

      {/* Main Grid: Projects Overview + Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects Cards (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold text-slate-800">Proyek & Progres Terkini</h2>
            </div>
            <Link
              to="/projects"
              className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 group"
            >
              Lihat Semua Proyek
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-40 rounded-2xl bg-white border border-slate-100 animate-pulse p-5">
                  <div className="h-5 bg-slate-200 rounded w-1/2 mb-3"></div>
                  <div className="h-3 bg-slate-100 rounded w-3/4 mb-4"></div>
                  <div className="h-2 bg-slate-100 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
              <FolderKanban className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Belum ada proyek yang dibuat</p>
              <p className="text-xs text-slate-400 mb-4">Buat proyek pertama Anda untuk mulai mengelola tugas tim.</p>
              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary-600 text-white hover:bg-primary-700 transition"
              >
                + Buat Proyek Baru
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.slice(0, 4).map((project) => {
                // Calculate progress for this project
                const projTasks = tasks.filter(
                  (t) => String(t.project_id) === String(project.id)
                );
                const projCompleted = projTasks.filter((t) => t.status === 'completed').length;
                const projPct = projTasks.length > 0 ? Math.round((projCompleted / projTasks.length) * 100) : 0;

                const getStatusPill = (st) => {
                  if (st === 'active') {
                    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">Active</span>;
                  }
                  if (st === 'completed') {
                    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">Done</span>;
                  }
                  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase">Pending</span>;
                };

                return (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="group p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-primary-400 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-slate-800 text-base group-hover:text-primary-600 transition truncate">
                          {project.project_name}
                        </h3>
                        {getStatusPill(project.status)}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                        {project.description || 'Tidak ada deskripsi proyek.'}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5 font-semibold text-slate-600">
                        <span>{projTasks.length} Tugas Total</span>
                        <span className="text-primary-600">{projPct}% Selesai</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${projPct}%` }}
                        ></div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Task Status & Actions (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold text-slate-800">Tugas Terkini</h2>
            </div>
            <Link
              to="/tasks"
              className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 group"
            >
              Semua Tugas
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Filter Pills for Tasks */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl">
            {['all', 'todo', 'in_progress', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setTaskFilter(f)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                  taskFilter === f
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f === 'all' ? 'Semua' : f.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Interactive Task List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm space-y-2.5 max-h-[460px] overflow-y-auto">
            {loading ? (
              <p className="text-center text-xs text-slate-400 py-6">Memuat tugas...</p>
            ) : filteredTasks.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                <p className="text-xs font-medium">Tidak ada tugas dalam kategori ini</p>
              </div>
            ) : (
              filteredTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-100 transition flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/tasks/${task.id}`}
                      className="text-xs font-bold text-slate-800 hover:text-primary-600 line-clamp-1 transition"
                    >
                      {task.title}
                    </Link>
                    {getPriorityBadge(task.priority)}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {task.deadline ? formatDateTime(task.deadline).split(',')[0] : 'Tanpa batas'}
                    </span>

                    {/* Interactive 1-Click Status Dropdown */}
                    <select
                      value={task.status}
                      onChange={(e) => handleQuickStatusChange(task, e.target.value)}
                      className={`text-[10px] font-bold rounded-lg px-2 py-0.5 border cursor-pointer outline-none transition ${
                        task.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : task.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Quick Create Project */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title="Buat Proyek Baru"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <Input
            label="Nama Proyek"
            value={newProject.project_name}
            onChange={(e) => setNewProject({ ...newProject, project_name: e.target.value })}
            placeholder="Contoh: Redesign Aplikasi Mobile"
            required
          />
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Proyek</label>
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              placeholder="Jelaskan tujuan dan ruang lingkup proyek..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status Awal</label>
            <select
              value={newProject.status}
              onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsProjectModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Buat Proyek</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Quick Create Task */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Tambah Tugas Baru"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Judul Tugas"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            placeholder="Contoh: Implementasi REST API"
            required
          />
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Proyek Terkait</label>
            <select
              value={newTask.project_id}
              onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">-- Pilih Proyek --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Tugas</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Rincian langkah pengerjaan tugas..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Prioritas</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              >
                <option value="low">Rendah (Low)</option>
                <option value="medium">Sedang (Medium)</option>
                <option value="high">Tinggi (High)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Awal</label>
              <select
                value={newTask.status}
                onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <Input
            label="Deadline Pengerjaan"
            type="datetime-local"
            value={newTask.deadline}
            onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsTaskModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan Tugas</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};