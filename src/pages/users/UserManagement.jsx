import React, { useEffect, useState } from 'react';
import { userService } from '../../api/userService';
import { formatDateTime } from '../../utils/dateFormatter';
import { Button } from '../../components/common/button';
import { Modal } from '../../components/common/modal';
import { Input } from '../../components/common/input';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  Trash2,
  Edit3,
  LayoutGrid,
  List as ListIcon,
  Mail,
  Calendar,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member');

  const fetchUsers = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Gagal memuat pengguna:', err);
      toast.error('Gagal mengambil daftar pengguna.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setSelectedUserId(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('member');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u) => {
    setIsEditMode(true);
    setSelectedUserId(u.id);
    setName(u.name || '');
    setEmail(u.email || '');
    setPassword('');
    setRole(u.role || 'member');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Nama dan Email wajib diisi!');
      return;
    }

    try {
      if (isEditMode) {
        const updateData = { name, email, role };
        if (password.trim()) updateData.password = password;

        await userService.updateUser(selectedUserId, updateData);
        toast.success('Data pengguna berhasil diperbarui!');
      } else {
        if (!password.trim()) {
          toast.error('Password wajib diisi untuk pengguna baru!');
          return;
        }
        await userService.createUser({ name, email, password, role });
        toast.success('Pengguna baru berhasil ditambahkan!');
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Gagal menyimpan pengguna:', err);
      toast.error(err.response?.data?.message || 'Gagal menyimpan data pengguna.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Yakin ingin menghapus pengguna ini dari sistem?')) {
      try {
        await userService.deleteUser(id);
        toast.success('Pengguna berhasil dihapus.');
        fetchUsers();
      } catch (err) {
        console.error('Gagal menghapus user:', err);
        toast.error('Gagal menghapus pengguna.');
      }
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const memberCount = users.filter((u) => u.role === 'member').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Tim & Pengguna</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola izin, peran akses, dan seluruh akun pengguna di sistem Anda
          </p>
        </div>
        <Button onClick={handleOpenAddModal} className="shadow-lg shadow-primary-500/25">
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          <span>Tambah Pengguna</span>
        </Button>
      </div>

      {/* Stats KPI Ribbons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Total Pengguna</span>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{totalUsers}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Administrator</span>
            <p className="text-2xl font-black text-indigo-600 mt-0.5">{adminCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Anggota Biasa (Member)</span>
            <p className="text-2xl font-black text-slate-700 mt-0.5">{memberCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama atau email pengguna..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white transition"
          />
        </div>

        {/* Role Filters & View Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {['all', 'admin', 'member'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                  roleFilter === r
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'all' ? 'Semua Peran' : r}
              </button>
            ))}
          </div>

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

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-slate-500">Memuat data pengguna...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
          <Users className="w-16 h-16 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-700">Tidak ada pengguna yang cocok</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Coba ganti kata kunci pencarian atau tambah pengguna baru.
          </p>
          <Button onClick={handleOpenAddModal} variant="primary">
            + Tambah Pengguna Baru
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsers.map((u) => {
            const isAdmin = u.role === 'admin';

            return (
              <div
                key={u.id}
                className="group rounded-3xl bg-white border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-primary-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-500 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-primary-500/20">
                      {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        isAdmin
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {u.role || 'Member'}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-800 truncate mb-1">
                    {u.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate mb-4">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{u.email}</span>
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {u.created_at ? formatDateTime(u.created_at).split(',')[0] : 'Aktif'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(u)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                      title="Edit Pengguna"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Hapus Pengguna"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                  <th className="px-6 py-4">Nama</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Peran (Role)</th>
                  <th className="px-6 py-4">Terdaftar</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                        {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{u.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role || 'Member'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {u.created_at ? formatDateTime(u.created_at).split(',')[0] : '-'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add / Edit User */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Budi Santoso"
            required
          />
          <Input
            label="Alamat Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="budi@example.com"
            required
          />

          <div className="relative">
            <Input
              label="Kata Sandi (Password)"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEditMode ? 'Kosongkan bila tidak ingin diubah' : '••••••••'}
              required={!isEditMode}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-9 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Peran Akun</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            >
              <option value="member">Member (Pengguna Biasa)</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">{isEditMode ? 'Simpan Perubahan' : 'Buat Pengguna'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};