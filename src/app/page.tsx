'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Navbar user={user} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 md:py-12 space-y-8 flex flex-col justify-center">
        {/* Streamlined Main Vacancy Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 md:p-12 shadow-sm space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold rounded-full">
            <span>📢 Official Recruitment Announcement</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Application for Appointment to the Post of Executive Director
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Vacancy Notice No.: <strong className="text-slate-900">01/2083/2084</strong> | Position: <strong className="text-blue-900">Executive Director</strong>
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            Welcome to the official online application portal for Executive Director recruitment at B.P. Koirala Memorial Cancer Hospital, Bharatpur, Chitwan, Nepal. Please register or log in to complete your application.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {user ? (
              <Link
                href={user.role === 'ADMIN' ? '/admin/dashboard' : '/applicant/dashboard'}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-8 py-3.5 rounded-xl transition-all shadow-md text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95"
              >
                <span>{user.role === 'ADMIN' ? '🛡️ Go to Admin Dashboard' : '📋 Go to Application Dashboard'}</span>
                <span>→</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-8 py-3.5 rounded-xl transition-all shadow-md text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>📝 Apply Online Now</span>
                  <span>→</span>
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-extrabold px-8 py-3.5 rounded-xl transition-all text-xs sm:text-sm flex items-center justify-center shadow-sm"
                >
                  <span>👤 Login to Portal</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} B.P. Koirala Memorial Cancer Hospital, Bharatpur, Chitwan, Nepal. All Rights Reserved.
      </footer>
    </div>
  );
}
