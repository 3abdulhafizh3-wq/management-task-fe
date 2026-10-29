import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { taskService } from '../../api/taskService';
import { projectService } from '../../api/projectService';
import { formatDateTime } from '../../utils/dateFormatter';
import { Button } from '../../components/common/button';
import { Modal } from '../../components/common/modal';
import { Input } from '../../components/common/input';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Kanban,
  List as ListIcon,
  Calendar,
  AlertCircle,
  Clock,
  Trash2,
  Edit3,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [mobileKanbanTab, setMobileKanbanTab] = useState('todo');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    project_id: '',
    status: 'todo',
    priority: 'medium',
    deadline: '',
  });

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        taskService.getAllTasks(),
        projectService.getAllProjects(),
      ]);
      setTasks(Array.isArray(tasksRes) ? tasksRes : []);
      setProjects(Array.isArray(projectsRes) ? projectsRes : []);
    } catch (err) {
      console.error('Gagal mengambil daftar tugas:', err);
      toast.error('Gagal memuat tugas dari server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setSelectedTaskId(null);
    setTaskForm({
      title: '',
      description: '',
      project_id: projects[0]?.id ? String(projects[0].id) : '',
      status: 'todo',
      priority: 'medium',
      deadline: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task, e) => {
    if (e) e.stopPropagation();
    setIsEditMode(true);
    setSelectedTaskId(task.id);
    setTaskForm({
      title: task.title || '',
      description: task.description || '',
      project_id: String(task.project_id || ''),
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      deadline: task.deadline ? task.deadline.slice(0, 16) : '',
    });
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !taskForm.project_id) {
      toast.error('Judul dan Proyek wajib diisi!');
      return;
    }

    try {
      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        project_id: String(taskForm.project_id),
        status: taskForm.status,
        priority: taskForm.priority,
        deadline: taskForm.deadline
          ? new Date(taskForm.deadline).toISOString()
          : new Date().toISOString(),
      };

      if (isEditMode) {
        await taskService.updateTask(selectedTaskId, payload);
        toast.success('Tugas berhasil diperbarui!');
      } else {
        await taskService.createTask(payload);
        toast.success('Tugas baru berhasil dibuat!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Gagal menyimpan tugas:', err);
      toast.error('Gagal menyimpan tugas.');
    }
  };

  // Quick 1-click status update
  const handleQuickStatusChange = async (task, newStatus, e) => {
    if (e) e.stopPropagation();
    try {
      const payload = {
        title: task.title,
        description: task.description || '',
        project_id: String(task.project_id),
        status: newStatus,
        priority: task.priority || 'medium',
        deadline: task.deadline ? new Date(task.deadline).toISOString() : new Date().toISOString(),
      };

      await taskService.updateTask(task.id, payload);
      toast.success(`Tugas dipindahkan ke "${newStatus.replace('_', ' ')}"`);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error('Gagal memperbarui status tugas:', err);
      toast.error('Gagal memperbarui status tugas.');
    }
  };

  const handleDeleteTask = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Yakin ingin menghapus tugas ini?')) {
      try {
        await taskService.deleteTask(id);
        toast.success('Tugas berhasil dihapus.');
        fetchData();
      } catch (err) {
        console.error('Gagal menghapus tugas:', err);
        toast.error('Gagal menghapus tugas.');
      }
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      (task.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject =
      selectedProjectFilter === 'all' || String(task.project_id) === String(selectedProjectFilter);
    const matchesPriority =
      selectedPriorityFilter === 'all' || task.priority === selectedPriorityFilter;
    return matchesSearch && matchesProject && matchesPriority;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 uppercase">Tinggi</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase">Sedang</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">Rendah</span>;
    }
  };

  const isOverdue = (deadline, status) => {
    if (!deadline || status === 'completed') return false;
    return new Date(deadline).getTime() < Date.now();
  };

  // Group tasks for Kanban
  const kanbanColumns = [
    { id: 'todo', title: 'To Do', color: 'bg-amber-500', bg: 'bg-amber-50/50', border: 'border-amber-200/60' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500', bg: 'bg-blue-50/50', border: 'border-blue-200/60' },
    { id: 'completed', title: 'Completed', color: 'bg-emerald-500', bg: 'bg-emerald-50/50', border: 'border-emerald-200/60' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Tugas</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Atur alur kerja, pantau deadline, dan geser status tugas secara interaktif
          </p>
        </div>
        <Button onClick={handleOpenAddModal} className="shadow-lg shadow-primary-500/25">
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Tambah Tugas</span>
        </Button>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari tugas berdasarkan judul atau isi..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Project Filter */}
          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Semua Proyek</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriorityFilter}
            onChange={(e) => setSelectedPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Semua Prioritas</option>
            <option value="high">Tinggi (High)</option>
            <option value="medium">Sedang (Medium)</option>
            <option value="low">Rendah (Low)</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'kanban' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Kanban Board"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'table' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-slate-500">Memuat data tugas...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
          <CheckSquare className="w-16 h-16 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-700">Tidak ada tugas ditemukan</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Ubah kata kunci filter atau klik tombol di bawah untuk membuat tugas baru.
          </p>
          <Button onClick={handleOpenAddModal} variant="primary">
            + Tambah Tugas Baru
          </Button>
        </div>
      ) : viewMode === 'kanban' ? (
        <div>
          {/* Mobile Tab Selector for Kanban */}
          <div className="flex sm:hidden gap-1 p-1 bg-slate-200/70 rounded-2xl mb-4">
            {kanbanColumns.map((col) => {
              const count = filteredTasks.filter((t) => t.status === col.id).length;
              return (
                <button
                  key={col.id}
                  onClick={() => setMobileKanbanTab(col.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                    mobileKanbanTab === col.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {col.title} ({count})
                </button>
              );
            })}
          </div>

          {/* Kanban Board Columns (Stacked on mobile tab, side-by-side on sm+) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {kanbanColumns.map((column) => {
              const colTasks = filteredTasks.filter((t) => t.status === column.id);
              const isVisibleOnMobile = mobileKanbanTab === column.id;

              return (
                <div
                  key={column.id}
                  className={`rounded-3xl border ${column.border} ${column.bg} p-4 flex flex-col min-h-[500px] ${
                    isVisibleOnMobile ? 'block' : 'hidden sm:flex'
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/70">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${column.color}`}></span>
                      <h3 className="font-extrabold text-sm text-slate-800">{column.title}</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white text-slate-700 text-xs font-bold shadow-sm">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Tasks Cards inside Column */}
                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {colTasks.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        Tidak ada tugas di kolom ini.
                      </div>
                    ) : (
                      colTasks.map((task) => {
                        const projectItem = projects.find(
                          (p) => String(p.id) === String(task.project_id)
                        );
                        const overdue = isOverdue(task.deadline, task.status);

                        return (
                          <div
                            key={task.id}
                            className="group p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3"
                          >
                            <div>
                              {/* Top Bar: Project Tag & Priority */}
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md truncate max-w-[130px]">
                                  {projectItem?.project_name || `Project #${task.project_id}`}
                                </span>
                                {getPriorityBadge(task.priority)}
                              </div>

                              {/* Task Title */}
                              <Link
                                to={`/tasks/${task.id}`}
                                className="font-bold text-sm text-slate-800 hover:text-primary-600 transition line-clamp-2"
                              >
                                {task.title}
                              </Link>

                              {/* Task Description Snippet */}
                              {task.description && (
                                <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            {/* Deadline & Actions */}
                            <div className="pt-2 border-t border-slate-100 space-y-2">
                              <div className="flex items-center justify-between text-[11px]">
                                <span
                                  className={`flex items-center gap-1 font-semibold ${
                                    overdue ? 'text-rose-600' : 'text-slate-500'
                                  }`}
                                >
                                  {overdue ? (
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                  ) : (
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                  {task.deadline
                                    ? formatDateTime(task.deadline).split(',')[0]
                                    : 'Tanpa deadline'}
                                  {overdue && <span className="text-[9px] font-bold uppercase">(Overdue)</span>}
                                </span>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => handleOpenEditModal(task, e)}
                                    className="p-1 text-slate-400 hover:text-slate-800 transition"
                                    title="Edit Tugas"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteTask(task.id, e)}
                                    className="p-1 text-slate-400 hover:text-red-600 transition"
                                    title="Hapus Tugas"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Interactive Move Button */}
                              <div className="flex items-center gap-1.5 pt-1">
                                {column.id === 'todo' && (
                                  <button
                                    onClick={(e) => handleQuickStatusChange(task, 'in_progress', e)}
                                    className="w-full py-1.5 px-2 rounded-xl text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition flex items-center justify-center gap-1"
                                  >
                                    <span>Mulai Kerjakan</span>
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                )}
                                {column.id === 'in_progress' && (
                                  <div className="flex w-full gap-1">
                                    <button
                                      onClick={(e) => handleQuickStatusChange(task, 'todo', e)}
                                      className="py-1 px-2 rounded-xl text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                                    >
                                      Kembali
                                    </button>
                                    <button
                                      onClick={(e) => handleQuickStatusChange(task, 'completed', e)}
                                      className="flex-1 py-1 px-2 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition flex items-center justify-center gap-1"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Tandai Selesai</span>
                                    </button>
                                  </div>
                                )}
                                {column.id === 'completed' && (
                                  <button
                                    onClick={(e) => handleQuickStatusChange(task, 'in_progress', e)}
                                    className="w-full py-1.5 px-2 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                                  >
                                    Buka Kembali
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50/80 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Judul Tugas</th>
                  <th className="px-6 py-4">Proyek</th>
                  <th className="px-6 py-4">Prioritas</th>
                  <th className="px-6 py-4">Deadline</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => {
                  const projectItem = projects.find(
                    (p) => String(p.id) === String(task.project_id)
                  );
                  const overdue = isOverdue(task.deadline, task.status);

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        <Link to={`/tasks/${task.id}`} className="hover:text-primary-600">
                          {task.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-600">
                        {projectItem?.project_name || `Project #${task.project_id}`}
                      </td>
                      <td className="px-6 py-4">{getPriorityBadge(task.priority)}</td>
                      <td className="px-6 py-4 text-xs">
                        <span className={overdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                          {task.deadline ? formatDateTime(task.deadline) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={task.status}
                          onChange={(e) => handleQuickStatusChange(task, e.target.value)}
                          className={`text-xs font-bold rounded-lg px-2.5 py-1 border outline-none cursor-pointer ${
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
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          to={`/tasks/${task.id}`}
                          className="inline-flex p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                          title="Detail & Komentar"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenEditModal(task)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Task */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Tugas' : 'Tambah Tugas Baru'}
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <Input
            label="Judul Tugas"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            placeholder="Contoh: Buat endpoint autentikasi"
            required
          />
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Proyek</label>
            <select
              value={taskForm.project_id}
              onChange={(e) => setTaskForm({ ...taskForm, project_id: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              required
            >
              <option value="">-- Pilih Proyek Terkait --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Deskripsi Tugas</label>
            <textarea
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              rows={3}
              placeholder="Jelaskan kebutuhan tugas..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Prioritas</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="low">Rendah (Low)</option>
                <option value="medium">Sedang (Medium)</option>
                <option value="high">Tinggi (High)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
              <select
                value={taskForm.status}
                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
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
            value={taskForm.deadline}
            onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
            required
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">{isEditMode ? 'Simpan Perubahan' : 'Buat Tugas'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
