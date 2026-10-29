import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { commentService } from '../../api/commentService';
import { taskService } from '../../api/taskService';
import { userService } from '../../api/userService';
import { formatDateTime } from '../../utils/dateFormatter';
import { Button } from '../../components/common/button';
import { Modal } from '../../components/common/modal';
import {
  MessageSquare,
  Search,
  Filter,
  Trash2,
  Edit3,
  ExternalLink,
  CheckSquare,
  Calendar,
  User as UserIcon,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

export const Comments = () => {
  const [comments, setComments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [taskFilter, setTaskFilter] = useState('all');

  // Edit comment state
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');

  const fetchData = async () => {
    try {
      const [commentsData, tasksData, usersData] = await Promise.all([
        commentService.getAllComments(),
        taskService.getAllTasks(),
        userService.getAllUsers(),
      ]);
      setComments(Array.isArray(commentsData) ? commentsData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error('Gagal memuat komentar:', err);
      toast.error('Gagal mengambil data komentar dari server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus komentar ini?')) {
      try {
        await commentService.deleteComment(id);
        toast.success('Komentar berhasil dihapus.');
        setComments((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        console.error('Gagal menghapus komentar:', err);
        toast.error('Gagal menghapus komentar.');
      }
    }
  };

  const handleOpenEdit = (comment) => {
    setEditingComment(comment);
    setEditText(comment.comment || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editText.trim()) return;

    try {
      await commentService.updateComment(editingComment.id, { comment: editText });
      toast.success('Komentar berhasil diperbarui!');
      setEditingComment(null);
      fetchData();
    } catch (err) {
      console.error('Gagal memperbarui komentar:', err);
      toast.error('Gagal menyimpan komentar.');
    }
  };

  // Filter comments
  const filteredComments = comments.filter((c) => {
    const matchesSearch = (c.comment || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTask = taskFilter === 'all' || String(c.task_id) === String(taskFilter);
    return matchesSearch && matchesTask;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Aktivitas Komentar</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Semua catatan, diskusi, dan masukan kerja tim lintas berbagai tugas
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari isi percakapan komentar..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={taskFilter}
            onChange={(e) => setTaskFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none w-full md:w-auto"
          >
            <option value="all">Semua Tugas</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comments Feed List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-slate-500">Memuat komentar tim...</p>
        </div>
      ) : filteredComments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
          <MessageSquare className="w-16 h-16 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-700">Tidak ada komentar yang cocok</h3>
          <p className="text-xs text-slate-400 mt-1">
            Ubah kata kunci pencarian atau buka halaman tugas untuk menambahkan diskusi baru.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComments.map((c) => {
            const author = users.find((u) => String(u.id) === String(c.user_id));
            const taskItem = tasks.find((t) => String(t.id) === String(c.task_id));

            return (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {author?.name ? author.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {author?.name || `User #${c.user_id}`}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {c.created_at ? formatDateTime(c.created_at) : 'Waktu tidak tersedia'}
                      </p>
                    </div>
                  </div>

                  {/* Task context badge */}
                  {taskItem && (
                    <Link
                      to={`/tasks/${taskItem.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-xl transition self-start sm:self-auto"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[200px]">{taskItem.title}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed pl-0 sm:pl-12">
                  {c.comment}
                </p>

                <div className="flex justify-end gap-1 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                    title="Edit Komentar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Hapus Komentar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Edit Comment */}
      <Modal
        isOpen={!!editingComment}
        onClose={() => setEditingComment(null)}
        title="Edit Komentar"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Teks Komentar</label>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditingComment(null)}>
              Batal
            </Button>
            <Button type="submit">Simpan Perubahan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};