import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectService } from '../../api/projectService';
import { taskService } from '../../api/taskService';
import { memberService } from '../../api/memberService';
import { userService } from '../../api/userService';
import { formatDateTime } from '../../utils/dateFormatter';
import { Button } from '../../components/common/button';
import { Modal } from '../../components/common/modal';
import { Input } from '../../components/common/input';
import {
  ArrowLeft,
  FolderKanban,
  CheckSquare,
  Users,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserPlus,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

export const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'members'

  // Modals State
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // Forms State
  const [projectForm, setProjectForm] = useState({ project_name: '', description: '', status: 'pending' });
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    deadline: '',
  });
  const [selectedUserId, setSelectedUserId] = useState('');

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [projData, tasksData, membersData, usersData] = await Promise.all([
        projectService.getProjectById(id),
        taskService.getAllTasks(),
        memberService.getAllMembers({ project_id: id }),
        userService.getAllUsers(),
      ]);

      setProject(projData);
      setProjectForm({
        project_name: projData?.project_name || '',
        description: projData?.description || '',
        status: projData?.status || 'pending',
      });

      // Filter tasks for this project
      const projectTasks = Array.isArray(tasksData)
        ? tasksData.filter((t) => String(t.project_id) === String(id))
        : [];
      setTasks(projectTasks);

      // Members for this project
      setMembers(Array.isArray(membersData) ? membersData : []);
      setAllUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error('Gagal mengambil data proyek:', err);
      toast.error('Gagal memuat detail proyek.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  // Handle Update Project
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      await projectService.updateProject(id, {
        ...projectForm,
        user_id: project?.user_id || 1,
      });
      toast.success('Detail proyek berhasil diperbarui!');
      setIsEditProjectOpen(false);
      fetchProjectData();
    } catch (err) {
      console.error('Gagal memperbarui proyek:', err);
      toast.error('Gagal memperbarui proyek.');
    }
  };

  // Handle Delete Project
  const handleDeleteProject = async () => {
    if (window.confirm('Yakin ingin menghapus seluruh proyek ini? Data yang terkait akan dihapus.')) {
      try {
        await projectService.deleteProject(id);
        toast.success('Proyek berhasil dihapus.');
        navigate('/projects');
      } catch (err) {
        console.error('Gagal menghapus proyek:', err);
        toast.error('Gagal menghapus proyek.');
      }
    }
  };

  // Handle Add Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    try {
      await taskService.createTask({
        ...taskForm,
        project_id: String(id),
        deadline: taskForm.deadline ? new Date(taskForm.deadline).toISOString() : new Date().toISOString(),
      });
      toast.success('Tugas berhasil ditambahkan ke proyek!');
      setIsAddTaskOpen(false);
      setTaskForm({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        deadline: '',
      });
      fetchProjectData();
    } catch (err) {
      console.error('Gagal membuat tugas:', err);
      toast.error('Gagal membuat tugas baru.');
    }
  };

  // Handle Quick Task Status Change
  const handleTaskStatusChange = async (task, newStatus) => {
    try {
      await taskService.updateTask(task.id, {
        title: task.title,
        description: task.description || '',
        project_id: String(id),
        status: newStatus,
        priority: task.priority || 'medium',
        deadline: task.deadline ? new Date(task.deadline).toISOString() : new Date().toISOString(),
      });
      toast.success('Status tugas diperbarui!');
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error('Gagal update status:', err);
      toast.error('Gagal mengubah status tugas.');
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Hapus tugas ini?')) {
      try {
        await taskService.deleteTask(taskId);
        toast.success('Tugas dihapus.');
        fetchProjectData();
      } catch (err) {
        console.error('Gagal hapus tugas:', err);
        toast.error('Gagal menghapus tugas.');
      }
    }
  };

  // Handle Add Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error('Pilih pengguna terlebih dahulu');
      return;
    }

    try {
      await memberService.addMember({
        project_id: String(id),
        user_id: String(selectedUserId),
      });
      toast.success('Anggota berhasil ditambahkan ke proyek!');
      setIsAddMemberOpen(false);
      setSelectedUserId('');
      fetchProjectData();
    } catch (err) {
      console.error('Gagal tambah anggota:', err);
      toast.error(err.response?.data?.message || 'Gagal menambahkan anggota ke proyek.');
    }
  };

  // Handle Remove Member
  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Keluarkan anggota ini dari proyek?')) {
      try {
        await memberService.deleteMember(memberId);
        toast.success('Anggota berhasil dikeluarkan.');
        fetchProjectData();
      } catch (err) {
        console.error('Gagal menghapus member:', err);
        toast.error('Gagal menghapus anggota.');
      }
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-semibold text-slate-500">Memuat detail workspace proyek...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Proyek Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">Proyek yang Anda cari mungkin telah dihapus.</p>
        <Link to="/projects" className="px-4 py-2 rounded-xl bg-primary-600 text-white font-bold text-xs">
          Kembali ke Daftar Proyek
        </Link>
      </div>
    );
  }

  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-primary-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Semua Proyek</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setIsEditProjectOpen(true)}
            className="text-xs py-2 px-3.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Proyek</span>
          </Button>
          <button
            onClick={handleDeleteProject}
            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition"
            title="Hapus Proyek"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Project Hero Header Card */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                {project.project_name}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  project.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : project.status === 'completed'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {project.status}
              </span>
            </div>
            <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">
              {project.description || 'Tidak ada deskripsi detail untuk proyek ini.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Button onClick={() => setIsAddTaskOpen(true)} className="text-xs">
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tambah Tugas</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsAddMemberOpen(true)}
              className="text-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Anggota</span>
            </Button>
          </div>
        </div>

        {/* Progress & KPI Metrics */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-xs font-semibold text-slate-400">Total Tugas</span>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{totalTasks}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400">Tugas Selesai</span>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{completedTasks}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400">Sedang Berjalan</span>
            <p className="text-2xl font-black text-blue-600 mt-0.5">{inProgressTasks}</p>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Kemajuan Proyek</span>
              <span className="text-xs font-black text-primary-600">{progressPct}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Tabs (Tasks & Members) */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'tasks'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Daftar Tugas Proyek ({tasks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'members'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Anggota Tim ({members.length})</span>
          </button>
        </div>

        {/* Tab 1: Tasks */}
        {activeTab === 'tasks' && (
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <CheckSquare className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <h4 className="text-sm font-bold text-slate-700">Belum ada tugas di proyek ini</h4>
                <p className="text-xs text-slate-400 mb-4">Tambahkan tugas untuk mulai membagi beban kerja.</p>
                <Button onClick={() => setIsAddTaskOpen(true)} className="text-xs">
                  <Plus className="w-4 h-4" />
                  <span>Tambah Tugas Sekarang</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Link
                          to={`/tasks/${task.id}`}
                          className="font-bold text-slate-800 hover:text-primary-600 transition text-sm line-clamp-1"
                        >
                          {task.title}
                        </Link>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            task.priority === 'high'
                              ? 'bg-rose-100 text-rose-700'
                              : task.priority === 'medium'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                        {task.description || 'Tidak ada deskripsi.'}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {task.deadline ? formatDateTime(task.deadline).split(',')[0] : 'Tanpa batas'}
                        </span>

                        <select
                          value={task.status}
                          onChange={(e) => handleTaskStatusChange(task, e.target.value)}
                          className={`text-[11px] font-bold rounded-lg px-2 py-1 border outline-none cursor-pointer ${
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

                      <div className="flex items-center justify-between pt-1">
                        <Link
                          to={`/tasks/${task.id}`}
                          className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1"
                        >
                          Detail & Komentar <ExternalLink className="w-3 h-3" />
                        </Link>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition"
                          title="Hapus Tugas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Members */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Anggota Tim Proyek</h3>
                <p className="text-xs text-slate-500">
                  Daftar pengguna yang memiliki akses kolaborasi pada proyek ini
                </p>
              </div>
              <Button onClick={() => setIsAddMemberOpen(true)} className="text-xs">
                <UserPlus className="w-4 h-4" />
                <span>Tambah Anggota</span>
              </Button>
            </div>

            {members.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold">Belum ada anggota yang ditambahkan.</p>
                <p className="text-xs">Klik "Tambah Anggota" untuk menetapkan tim ke proyek ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {members.map((member) => {
                  // Match with registered users to show their details
                  const memberUser = allUsers.find(
                    (u) => String(u.id) === String(member.user_id)
                  );

                  return (
                    <div
                      key={member.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                          {memberUser?.name ? memberUser.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {memberUser?.name || `User #${member.user_id}`}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {memberUser?.email || '-'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Keluarkan dari Proyek"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Edit Project */}
      <Modal
        isOpen={isEditProjectOpen}
        onClose={() => setIsEditProjectOpen(false)}
        title="Edit Data Proyek"
      >
        <form onSubmit={handleUpdateProject} className="space-y-4">
          <Input
            label="Nama Proyek"
            value={projectForm.project_name}
            onChange={(e) => setProjectForm({ ...projectForm, project_name: e.target.value })}
            required
          />
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Deskripsi</label>
            <textarea
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Proyek</label>
            <select
              value={projectForm.status}
              onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsEditProjectOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan Perubahan</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Add Task to Project */}
      <Modal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        title={`Tambah Tugas ke ${project.project_name}`}
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Judul Tugas"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            placeholder="Contoh: Selesaikan desain homepage"
            required
          />
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Deskripsi Tugas</label>
            <textarea
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              rows={2}
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
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              >
                <option value="low">Rendah (Low)</option>
                <option value="medium">Sedang (Medium)</option>
                <option value="high">Tinggi (High)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Awal</label>
              <select
                value={taskForm.status}
                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
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
            value={taskForm.deadline}
            onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsAddTaskOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Buat Tugas</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Add Member to Project */}
      <Modal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        title="Tambahkan Anggota ke Proyek"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pilih Pengguna dari Sistem
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              required
            >
              <option value="">-- Pilih Pengguna --</option>
              {allUsers.map((u) => {
                const alreadyMember = members.some((m) => String(m.user_id) === String(u.id));
                return (
                  <option key={u.id} value={u.id} disabled={alreadyMember}>
                    {u.name} ({u.email}) {alreadyMember ? '— Sudah Terdaftar' : ''}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsAddMemberOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Tambahkan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};