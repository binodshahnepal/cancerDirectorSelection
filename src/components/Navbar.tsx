'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  user?: { name: string; email: string; role: string } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* 1. LARGE PROMINENT OFFICIAL BKMCH HEADER BANNER */}
      <div className="bg-[#27548b] text-white border-b border-blue-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-4 sm:gap-6 group text-center sm:text-left">
            {/* High-Resolution Circular Logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white rounded-full p-1 shadow-lg shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img
                src="/bkmch-logo.png"
                alt="B.P. Koirala Memorial Cancer Hospital Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            
            {/* Nepali & English Hospital Title */}
            <div className="space-y-0.5">
              <h1 className="font-black text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
                बी.पी. कोइराला मेमोरियल क्यान्सर अस्पताल
              </h1>
              <p className="font-bold text-sm sm:text-base md:text-lg text-blue-100 tracking-wide">
                भरतपुर-७, चितवन, नेपाल
              </p>
              <p className="text-[10px] sm:text-xs font-semibold text-blue-200 uppercase tracking-wider">
                B.P. Koirala Memorial Cancer Hospital | Recruitment Portal
              </p>
            </div>
          </Link>

          {/* Banner Action Badge / Quick Links */}
          <div className="hidden lg:flex items-center gap-3">
            <span className="px-4 py-2 bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl text-xs font-bold text-blue-50">
              Notice No.: 01/2083/2084
            </span>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION & USER ACTION BAR */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex justify-between items-center gap-3">
          <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
            <Link href="/" className="hover:text-blue-600 transition-colors py-1">
              🏠 Home
            </Link>
            {user ? (
              <Link
                href={user.role === 'ADMIN' ? '/admin/dashboard' : '/applicant/dashboard'}
                className="hover:text-blue-600 transition-colors py-1"
              >
                📋 Dashboard
              </Link>
            ) : (
              <Link href="/register" className="hover:text-blue-600 transition-colors py-1">
                📝 Online Application Form
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden md:inline-block text-xs bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 border border-slate-200 font-medium">
                  👤 {user.name} ({user.role === 'ADMIN' ? 'Admin' : 'Applicant'})
                </span>
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin/profile"
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold transition-all"
                  >
                    ⚙️ Settings
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-extrabold transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-extrabold border border-slate-200 transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm transition-all"
                >
                  Apply Online
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
