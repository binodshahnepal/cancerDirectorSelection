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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex justify-between items-center gap-2">
        <Link href="/" className="flex items-center gap-3 shrink-0 py-1">
          <img
            src="/bkmch-header.png"
            alt="B.P. Koirala Memorial Cancer Hospital Header"
            className="h-10 sm:h-14 w-auto object-contain rounded-lg"
          />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden md:inline-block text-xs bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 border border-slate-200 font-medium">
                {user.name} ({user.role === 'ADMIN' ? 'Admin' : 'Applicant'})
              </span>
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin/profile"
                  className="text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium transition-all"
                >
                  Settings
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] sm:text-xs font-semibold transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/login"
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-slate-700 hover:bg-slate-100 text-[11px] sm:text-xs font-semibold border border-slate-200 transition-all"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] sm:text-xs font-semibold shadow-sm transition-all"
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
