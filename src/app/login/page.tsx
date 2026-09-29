'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Swal from 'sweetalert2';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roleMode, setRoleMode] = useState<'APPLICANT' | 'ADMIN'>('APPLICANT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reason') === 'deleted') {
        Swal.fire({
          icon: 'warning',
          title: 'Account Deleted',
          text: 'Your account and application have been deleted by the administrator.',
          confirmButtonColor: '#dc2626'
        });
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'ACCOUNT_DELETED') {
          Swal.fire({
            icon: 'error',
            title: 'Account Deleted',
            text: data.message || 'Your application and account have been deleted by the administrator. Please contact B.P. Koirala Memorial Cancer Hospital if you have questions.',
            confirmButtonColor: '#dc2626'
          });
          setError(data.message || 'Your account has been deleted by the administrator.');
        } else {
          setError(data.error || 'Invalid login credentials');
        }
        setLoading(false);
        return;
      }

      if (data.user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/applicant/dashboard');
      }
      router.refresh();
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden font-sans selection:bg-blue-500 selection:text-white p-4 md:p-8">
      {/* ANIMATED BACKGROUND AMBIENT LIGHT BLOBS */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* MAIN DUAL-PANEL CONTAINER */}
      <div className="w-full max-w-5xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 z-10 transition-all duration-500 hover:shadow-blue-500/10">

        {/* LEFT COLUMN: BRANDING & HERO SHOWCASE */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-700 via-blue-600 to-teal-700 p-8 md:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle overlay texture pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-10"></div>

          <div className="relative z-10 space-y-6">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl border border-white/30 shadow-lg group-hover:scale-110 transition-transform">
                🏥
              </div>
              <div>
                <h1 className="font-extrabold text-lg leading-tight tracking-tight">BKMCH PORTAL</h1>
                <p className="text-[11px] text-blue-100 font-medium">B.P. Koirala Memorial Cancer Hospital</p>
              </div>
            </Link>

            <div className="pt-6 space-y-4">
              <span className="px-3 py-1 bg-white/15 backdrop-blur-md border border-white/25 rounded-full text-xs font-bold tracking-wide uppercase">
                Executive Director Recruitment
              </span>
              <h2 className="text-2xl md:text-3xl font-black leading-tight tracking-tight">
                Empowering Healthcare Leadership
              </h2>
              <p className="text-xs text-blue-100/90 leading-relaxed">
                Welcome to the official recruitment portal of B.P. Koirala Memorial Cancer Hospital, Bharatpur, Chitwan, Nepal. Sign in to manage or track your application.
              </p>
            </div>
          </div>

          {/* Bottom Highlights & Stats */}
          <div className="relative z-10 pt-8 border-t border-white/20 space-y-3">
            <div className="flex items-center gap-3 text-xs">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center font-bold">✨</div>
              <div>
                <p className="font-bold text-white">100% Digital Application Process</p>
                <p className="text-[10px] text-blue-100">Direct document uploads & real-time tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center font-bold">🛡️</div>
              <div>
                <p className="font-bold text-white">Enterprise Verification Engine</p>
                <p className="text-[10px] text-blue-100">Role-based admin verification and reporting</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE ANIMATED FORM */}
        <div className="lg:col-span-7 p-5 sm:p-8 md:p-12 flex flex-col justify-center space-y-5 sm:space-y-6 bg-white dark:bg-slate-900">
          
          {/* Header & Role Switcher */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Welcome Back</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Please enter your account details to sign in</p>
              </div>
              <Link href="/" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                ← Home
              </Link>
            </div>

            {/* Role Mode Pills */}
            <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl grid grid-cols-2 gap-1 text-xs font-bold border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setRoleMode('APPLICANT')}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                  roleMode === 'APPLICANT'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>👤 Applicant</span>
              </button>

              <button
                type="button"
                onClick={() => setRoleMode('ADMIN')}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                  roleMode === 'ADMIN'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🛡️ Admin Portal</span>
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 dark:bg-red-950/60 dark:border-red-500/50 rounded-xl text-xs text-red-600 dark:text-red-300 font-medium flex items-center gap-2 animate-shake">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                  ✉️
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-4 py-3 text-xs md:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                  🔒
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 text-xs md:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON WITH GLOW */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white font-extrabold text-xs md:text-sm rounded-xl transition-all shadow-xl hover:shadow-blue-500/25 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* FOOTER LINK */}
          <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an applicant account?{' '}
            <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">
              Create an Account Now
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
