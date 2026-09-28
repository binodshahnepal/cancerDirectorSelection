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
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-sm">
            🏥
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base md:text-lg leading-tight tracking-tight">
              B.P. Koirala Memorial Cancer Hospital
            </h1>
            <p className="text-xs text-blue-600 font-semibold">Bharatpur, Chitwan, Nepal | Recruitment Portal</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block text-xs bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 border border-slate-200 font-medium">
                {user.name} ({user.role === 'ADMIN' ? 'Administrator' : 'Applicant'})
              </span>
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin/profile"
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium transition-all"
                >
                  Settings
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-semibold border border-slate-200 transition-all"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                Apply Online
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
