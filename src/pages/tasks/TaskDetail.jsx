import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { taskService } from '../../api/taskService';
import { projectService } from '../../api/projectService';
import { commentService } from '../../api/commentService';
import { userService } from '../../api/userService';
import { useAuth } from '../../hooks/useAuth';
import { formatDateTime } from '../../utils/dateFormatter';
import { Button } from '../../components/common/button';
import { Modal } from '../../components/common/modal';
import { Input } from '../../components/common/input';
import {
  ArrowLeft,
  CheckSquare,
  Calendar,
  Clock,
  FolderKanban,
  MessageSquare,
  Send,
  Trash2,
  Edit3,
  AlertCircle,
  CheckCircle2,
  User as UserIcon,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit Task Modal State
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    deadline: '',
  });

  // Edit Comment State
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const [taskData, allComments, usersData] = await Promise.all([
        taskService.getTaskById(id),
        commentService.getAllComments(),
        userService.getAllUsers(),
      ]);

      setTask(taskData);
      setTaskForm({
        title: taskData?.title || '',
        description: taskData?.description || '',
        status: taskData?.status || 'todo',
        priority: taskData?.priority || 'medium',
        deadline: taskData?.deadline ? taskData.deadline.slice(0, 16) : '',
      });

      // Filter comments for this task
      const taskComments = Array.isArray(allComments)
        ? allComments.filter((c) => String(c.task_id) === String(id))
        : [];
      setComments(taskComments);
      setUsers(Array.isArray(usersData) ? usersData : []);

      // Fetch related project
      if (taskData?.project_id) {
        try {
          const projData = await projectService.getProjectById(taskData.project_id);
          setProject(projData);
        } catch (e) {
          console.error('Gagal mengambil data proyek terkait:', e);
        }
      }
    } catch (err) {
      console.error('Gagal mengambil detail tugas:', err);
      toast.error('Gagal memuat detail tugas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  // Update Status directly
  const handleStatusChange = async (newStatus) => {
    if (!task) return;
    try {
      await taskService.updateTask(task.id, {
        title: task.title,
        description: task.description || '',
        project_id: String(task.project_id),
        status: newStatus,
        priority: task.priority || 'medium',
        deadline: task.deadline ? new Date(task.deadline).toISOString() : new Date().toISOString(),
      });
      toast.success(`Status diubah menjadi "${newStatus.replace('_', ' ')}"`);
      setTask({ ...task, status: newStatus });
    } catch (err) {
      console.error('Gagal update status:', err);
      toast.error('Gagal memperbarui status tugas.');
    }
  };

  // Update Full Task
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      await taskService.updateTask(id, {
        ...taskForm,
        project_id: String(task.project_id),
        deadline: taskForm.deadline
          ? new Date(taskForm.deadline).toISOString()
          : new Date().toISOString(),
      });
      toast.success('Tugas berhasil diperbarui!');
      setIsEditTaskOpen(false);
      fetchTaskDetails();
    } catch (err) {
      console.error('Gagal update tugas:', err);
      toast.error('Gagal menyimpan perubahan tugas.');
    }
  };

  // Delete Task
  const handleDeleteTask = async () => {
    if (window.confirm('Hapus tugas ini beserta komentarnya?')) {
      try {
        await taskService.deleteTask(id);
        toast.success('Tugas berhasil dihapus.');
        navigate('/tasks');
      } catch (err) {
        console.error('Gagal menghapus tugas:', err);
        toast.error('Gagal menghapus tugas.');
      }
    }
  };

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await commentService.createComment({
        comment: newComment,
        task_id: String(id),
        user_id: String(user?.id || 1),
      });
      toast.success('Komentar terkirim!');
      setNewComment('');
      // Refresh comments
      const allComments = await commentService.getAllComments();
      const taskComments = Array.isArray(allComments)
        ? allComments.filter((c) => String(c.task_id) === String(id))
        : [];
      setComments(taskComments);
    } catch (err) {
      console.error('Gagal menambah komentar:', err);
      toast.error('Gagal mengirim komentar.');
    }
  };

  // Save Edit Comment
  const handleSaveEditComment = async (commentId) => {
    if (!editCommentText.trim()) return;
    try {
      await commentService.updateComment(commentId, { comment: editCommentText });
      toast.success('Komentar diperbarui!');
      setEditingCommentId(null);
      setEditCommentText('');
      // Refresh comments
      const allComments = await commentService.getAllComments();
      const taskComments = Array.isArray(allComments)
        ? allComments.filter((c) => String(c.task_id) === String(id))
        : [];
      setComments(taskComments);
    } catch (err) {
      console.error('Gagal edit komentar:', err);
      toast.error('Gagal memperbarui komentar.');
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Hapus komentar ini?')) {
      try {
        await commentService.deleteComment(commentId);
        toast.success('Komentar dihapus.');
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } catch (err) {
        console.error('Gagal menghapus komentar:', err);
        toast.error('Gagal menghapus komentar.');
      }
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-semibold text-slate-500">Memuat detail tugas...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Tugas Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">Tugas yang Anda tuju mungkin sudah dihapus.</p>
        <Link to="/tasks" className="px-4 py-2 rounded-xl bg-primary-600 text-white font-bold text-xs">
          Kembali ke Daftar Tugas
        </Link>
      </div>
    );
  }

  const isOverdue =
    task.deadline && task.status !== 'completed' && new Date(task.deadline).getTime() < Date.now();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/tasks"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-primary-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Semua Tugas</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setIsEditTaskOpen(true)}
            className="text-xs py-2 px-3.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Tugas</span>
          </Button>
          <button
            onClick={handleDeleteTask}
            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition"
            title="Hapus Tugas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Task Header Card */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            {/* Priority & Status Header Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  task.priority === 'high'
                    ? 'bg-rose-100 text-rose-700'
                    : task.priority === 'medium'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                Prioritas: {task.priority}
              </span>

              {/* Status Selector Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-400">Status:</span>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`text-xs font-bold rounded-xl px-3 py-1 border outline-none cursor-pointer transition ${
                    task.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : task.status === 'in_progress'
                      ? 'bg-blue-50 text-blue-700 border-blue-300'
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              {task.title}
            </h1>
          </div>

          {/* Project Affiliation Pill */}
          {project && (
            <Link
              to={`/projects/${project.id}`}
              className="inline-flex items-center gap-2 p-3 rounded-2xl bg-primary-50/70 border border-primary-100 hover:bg-primary-100/70 transition shrink-0"
            >
              <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center">
                <FolderKanban className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-primary-600 uppercase">Proyek Terkait</span>
                <p className="text-xs font-bold text-slate-800 truncate max-w-[160px]">{project.project_name}</p>
              </div>
            </Link>
          )}
        </div>

        {/* Task Description */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
          <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Deskripsi Rinci</h4>
          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            {task.description || 'Tidak ada deskripsi rinci untuk tugas ini.'}
          </p>
        </div>

        {/* Meta Bar: Deadline, Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isOverdue ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400">Deadline Target</span>
              <p className={`text-sm font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                {task.deadline ? formatDateTime(task.deadline) : 'Tidak ditentukan'}
                {isOverdue && <span className="ml-1.5 text-xs text-rose-500 font-extrabold">(Terlewat!)</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400">Kondisi Pengerjaan</span>
              <p className="text-sm font-bold text-slate-800 capitalize">
                {task.status.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Comments Stream Section */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-bold text-slate-800">
              Diskusi & Komentar Tim ({comments.length})
            </h3>
          </div>
        </div>

        {/* Comment Thread List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">Belum ada diskusi pada tugas ini</p>
              <p className="text-xs">Jadilah yang pertama memberikan update atau catatan pengerjaan.</p>
            </div>
          ) : (
            comments.map((c) => {
              const author = users.find((u) => String(u.id) === String(c.user_id));
              const isOwner = String(c.user_id) === String(user?.id);
              const isEditing = editingCommentId === c.id;

              return (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-2 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                        {author?.name ? author.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {author?.name || `User #${c.user_id}`}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {c.created_at ? formatDateTime(c.created_at) : 'Waktu tidak tersedia'}
                        </p>
                      </div>
                    </div>

                    {/* Comment Actions (Edit / Delete) */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCommentId(c.id);
                          setEditCommentText(c.comment);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 transition"
                        title="Edit Komentar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition"
                        title="Hapus Komentar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="pt-2 space-y-2">
                      <textarea
                        value={editCommentText}
                        onChange={(e) => setEditCommentText(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingCommentId(null)}
                          className="px-3 py-1 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-200"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => handleSaveEditComment(c.id)}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-primary-600 text-white hover:bg-primary-700"
                        >
                          Simpan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed pl-10">
                      {c.comment}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Add Comment Input Form */}
        <form onSubmit={handleAddComment} className="pt-4 border-t border-slate-100 space-y-3">
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Tulis tanggapan atau catatan perkembangan tugas... (Tekan Kirim)"
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition resize-none"
              required
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-slate-400">
              Komentar akan terhubung langsung dengan ID akun Anda.
            </span>
            <Button type="submit" className="text-xs">
              <Send className="w-3.5 h-3.5" />
              <span>Kirim Komentar</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Modal Edit Task */}
      <Modal
        isOpen={isEditTaskOpen}
        onClose={() => setIsEditTaskOpen(false)}
        title="Edit Rincian Tugas"
      >
        <form onSubmit={handleUpdateTask} className="space-y-4">
          <Input
            label="Judul Tugas"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            required
          />
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Deskripsi</label>
            <textarea
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              rows={3}
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
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
            <Button variant="secondary" onClick={() => setIsEditTaskOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan Perubahan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};