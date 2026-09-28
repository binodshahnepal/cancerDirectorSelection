'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to register account');
        setLoading(false);
        return;
      }

      router.push('/applicant/dashboard');
      router.refresh();
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden font-sans selection:bg-blue-500 selection:text-white p-4 md:p-8">
      {/* ANIMATED BACKGROUND AMBIENT LIGHT BLOBS */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* MAIN DUAL-PANEL CONTAINER */}
      <div className="w-full max-w-5xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 z-10 transition-all duration-500 hover:shadow-blue-500/10">

        {/* LEFT COLUMN: BRANDING & HERO SHOWCASE */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-700 via-blue-600 to-teal-700 p-8 md:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Overlay texture pattern */}
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
                New Applicant Registration
              </span>
              <h2 className="text-2xl md:text-3xl font-black leading-tight tracking-tight">
                Start Your Career Application
              </h2>
              <p className="text-xs text-blue-100/90 leading-relaxed">
                Create your applicant account in seconds to begin filling your application for Executive Director position.
              </p>
            </div>
          </div>

          {/* Bottom Features List */}
          <div className="relative z-10 pt-8 border-t border-white/20 space-y-3">
            <div className="flex items-center gap-3 text-xs">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center font-bold">⚡</div>
              <div>
                <p className="font-bold text-white">Instant Account Creation</p>
                <p className="text-[10px] text-blue-100">Access your dashboard immediately</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center font-bold">📄</div>
              <div>
                <p className="font-bold text-white">Multi-Step Form Wizard</p>
                <p className="text-[10px] text-blue-100">Save drafts & upload document proofs anytime</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE SIGN UP FORM */}
        <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-center space-y-6 bg-white dark:bg-slate-900">
          
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Create Account</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Fill in your details to register as an applicant</p>
            </div>
            <Link href="/" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              ← Back to Home
            </Link>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 dark:bg-red-950/60 dark:border-red-500/50 rounded-xl text-xs text-red-600 dark:text-red-300 font-medium flex items-center gap-2 animate-shake">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* REGISTRATION FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Full Applicant Name *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                  👤
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Binod Shah"
                  className="w-full pl-10 pr-4 py-2.5 text-xs md:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Email Address *
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
                  placeholder="applicant@example.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs md:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Password *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                    🔒
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-9 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Confirm Password *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                    🔑
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white font-extrabold text-xs md:text-sm rounded-xl transition-all shadow-xl hover:shadow-blue-500/25 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 pt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Registering Account...</span>
                </>
              ) : (
                <>
                  <span>Complete Account Registration</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* FOOTER LINK */}
          <div className="text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
            Already registered?{' '}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">
              Sign In to Your Dashboard
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
