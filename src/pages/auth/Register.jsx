import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/common/input';
import { Button } from '../../components/common/button';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({ name, email, password });
      toast.success('Pendaftaran berhasil! Silakan masuk dengan akun baru Anda.');
      navigate('/login');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Gagal mendaftarkan akun. Silakan periksa kembali format data Anda.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl">
          {error}
        </div>
      )}

      <Input
        label="Nama Lengkap"
        id="name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Budi Santoso"
        required
      />

      <Input
        label="Alamat Email"
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="budi@example.com"
        required
      />

      <div className="relative">
        <Input
          label="Kata Sandi (Password)"
          id="password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min 6 karakter, huruf & angka"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3.5 top-9 text-slate-400 hover:text-slate-600 transition"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <div className="pt-2">
        <Button type="submit" variant="primary" className="w-full shadow-lg shadow-primary-500/30" disabled={loading}>
          <UserPlus className="w-4 h-4" />
          <span>{loading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}</span>
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        Sudah memiliki akun?{' '}
        <Link to="/login" className="text-primary-600 font-bold hover:underline">
          Masuk di sini
        </Link>
      </p>
    </form>
  );
};