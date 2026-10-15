'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // 🔒 Password khusus untuk staf gudang / admin
    if (password === 'gudang123' || password === 'admin123') {
      // Simpan tanda login di browser
      document.cookie = "auth_token=logged_in; path=/; max-age=86400";
      
      // Kembalikan user ke halaman dashboard utama
      router.push('/');
      router.refresh();
    } else {
      setError('Password salah! Akses ditolak.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-gray-100">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
            🔒
          </div>
          <h1 className="text-xl font-bold text-gray-800">Login Akses Gudang</h1>
          <p className="text-sm text-gray-500 mt-1">Masukkan password petugas untuk kelola stok</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
              Password Otentikasi
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan Password"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-rose-500 font-semibold text-center">⚠️ {error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md"
          >
            Masuk Akses Gudang
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-xs text-gray-400 hover:text-gray-600">
            ← Kembali ke Monitoring Stok (Mode Viewer)
          </a>
        </div>
      </div>
    </div>
  );
}
