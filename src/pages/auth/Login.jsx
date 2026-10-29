import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/common/input';
import { Button } from '../../components/common/button';
import { Eye, EyeOff, LogIn, Sparkles, Shield, User } from 'lucide-react';
import { toast } from 'sonner';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      toast.success('Berhasil masuk! Selamat datang di TaskFlow.');
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Gagal masuk. Periksa kembali email dan password Anda.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Quick fill for testing
  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Email Akun"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          required
        />

        <div className="relative">
          <Input
            label="Kata Sandi"
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
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
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Memverifikasi...' : 'Masuk ke Workspace'}</span>
          </Button>
        </div>
      </form>

      {/* Quick Demo Credentials for Convenience */}
      <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
        <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary-500" />
          <span>Akun Demo Uji Coba (1-Klik)</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillDemo('admin@example.com', 'Password123!')}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:border-primary-400 hover:text-primary-600 transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Shield className="w-3 h-3 text-indigo-500" />
            <span>Demo Admin</span>
          </button>
          <button
            type="button"
            onClick={() => fillDemo('budi@example.com', 'Password123!')}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:border-primary-400 hover:text-primary-600 transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <User className="w-3 h-3 text-emerald-500" />
            <span>Demo Member</span>
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500">
        Belum memiliki akun?{' '}
        <Link to="/register" className="text-primary-600 font-bold hover:underline">
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
};