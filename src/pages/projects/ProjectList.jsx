import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../../api/projectService';
import { taskService } from '../../api/taskService';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/button';
import { Modal } from '../../components/common/modal';
import { Input } from '../../components/common/input';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List as ListIcon,
  Trash2,
  Edit3,
  ExternalLink,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

export const ProjectList = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');

  const fetchProjectsAndTasks = async () => {
    try {
      const [projData, tasksData] = await Promise.all([
        projectService.getAllProjects(),
        taskService.getAllTasks(),
      ]);
      setProjects(Array.isArray(projData) ? projData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (err) {
      console.error('Gagal memuat data proyek:', err);
      toast.error('Gagal memuat daftar proyek dari backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsAndTasks();
  }, []);

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setSelectedProjectId(null);
    setProjectName('');
    setDescription('');
    setStatus('pending');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (project, e) => {
    if (e) e.stopPropagation();
    setIsEditMode(true);
    setSelectedProjectId(project.id);
    setProjectName(project.project_name || '');
    setDescription(project.description || '');
    setStatus(project.status || 'pending');
    setIsModalOpen(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      toast.error('Nama proyek wajib diisi!');
      return;
    }

    try {
      if (isEditMode) {
        await projectService.updateProject(selectedProjectId, {
          project_name: projectName,
          description,
          status,
          user_id: user?.id || 1,
        });
        toast.success('Proyek berhasil diperbarui!');
      } else {
        await projectService.createProject({
          project_name: projectName,
          description,
          status,
          user_id: user?.id || 1,
        });
        toast.success('Proyek baru berhasil dibuat!');
      }
      setIsModalOpen(false);
      fetchProjectsAndTasks();
    } catch (err) {
      console.error('Gagal menyimpan project:', err);
      toast.error('Gagal menyimpan perubahan proyek.');
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Apakah Anda yakin ingin menghapus proyek ini beserta seluruh datanya?')) {
      try {
        await projectService.deleteProject(id);
        toast.success('Proyek berhasil dihapus.');
        fetchProjectsAndTasks();
      } catch (err) {
        console.error('Gagal menghapus project:', err);
        toast.error('Gagal menghapus proyek.');
      }
    }
  };

  // Filter projects by search and status
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      (project.project_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (st) => {
    switch (st) {
      case 'active':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase">Aktif</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 uppercase">Selesai</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 uppercase">Pending</span>;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Proyek</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola seluruh repositori proyek dan pantau kemajuan kerja tim Anda
          </p>
        </div>
        <Button onClick={handleOpenAddModal} className="shadow-lg shadow-primary-500/25">
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Tambah Proyek</span>
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama proyek atau deskripsi..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition"
          />
        </div>

        {/* Status Filters & View Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {['all', 'pending', 'active', 'completed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                  statusFilter === st
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'all' ? 'Semua' : st}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'grid' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Grid Card"
            >
              <LayoutGrid className="w-4 h-4" />
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

      {/* Content Rendering */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-white border border-slate-200 animate-pulse p-6">
              <div className="h-6 bg-slate-200 rounded w-2/3 mb-4"></div>
              <div className="h-4 bg-slate-100 rounded w-full mb-3"></div>
              <div className="h-4 bg-slate-100 rounded w-4/5 mb-6"></div>
              <div className="h-2 bg-slate-100 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
          <FolderKanban className="w-16 h-16 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-700">Tidak ada proyek yang sesuai</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Ubah kata kunci pencarian atau buat proyek baru untuk memulai.
          </p>
          <Button onClick={handleOpenAddModal} variant="primary">
            + Buat Proyek Baru
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const projTasks = tasks.filter((t) => String(t.project_id) === String(project.id));
            const projCompleted = projTasks.filter((t) => t.status === 'completed').length;
            const progress = projTasks.length > 0 ? Math.round((projCompleted / projTasks.length) * 100) : 0;

            return (
              <div
                key={project.id}
                className="group relative rounded-3xl bg-white border border-slate-200/80 p-6 shadow-sm hover:shadow-xl hover:border-primary-400 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-lg font-black text-slate-800 group-hover:text-primary-600 transition truncate">
                      {project.project_name}
                    </h3>
                    {getStatusBadge(project.status)}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-3 mb-5 leading-relaxed">
                    {project.description || 'Tidak ada deskripsi detail untuk proyek ini.'}
                  </p>
                </div>

                <div>
                  {/* Task Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                      <span>Progres Tugas</span>
                      <span className="text-primary-600 font-bold">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                      <span>{projTasks.length} Total Tugas</span>
                      <span>{projCompleted} Selesai</span>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      to={`/projects/${project.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-xl transition"
                    >
                      <span>Buka Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleOpenEditModal(project, e)}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                        title="Edit Proyek"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(project.id, e)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                        title="Hapus Proyek"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50/80 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Nama Proyek</th>
                  <th className="px-6 py-4">Deskripsi</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Progres</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map((project) => {
                  const projTasks = tasks.filter((t) => String(t.project_id) === String(project.id));
                  const projCompleted = projTasks.filter((t) => t.status === 'completed').length;
                  const progress = projTasks.length > 0 ? Math.round((projCompleted / projTasks.length) * 100) : 0;

                  return (
                    <tr key={project.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        <Link to={`/projects/${project.id}`} className="hover:text-primary-600">
                          {project.project_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                        {project.description || '-'}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(project.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-slate-600">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          to={`/projects/${project.id}`}
                          className="inline-flex p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                          title="Detail"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenEditModal(project)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
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

      {/* Modal Create/Edit Project */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Proyek' : 'Buat Proyek Baru'}
      >
        <form onSubmit={handleSaveProject} className="space-y-4">
          <Input
            label="Nama Proyek"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Contoh: Modern Web Portal"
            required
          />
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Deskripsi Proyek</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi target dan milestone proyek..."
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Proyek</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">{isEditMode ? 'Simpan Perubahan' : 'Buat Proyek'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};