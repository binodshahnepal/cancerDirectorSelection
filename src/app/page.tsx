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

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Banner Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-10 shadow-sm space-y-4 sm:space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-full">
            <span>📢 Official Vacancy Announcement</span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            B.P. Koirala Memorial Cancer Hospital
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600">Bharatpur, Chitwan, Nepal</p>

          <div className="p-3 sm:p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1">
            <h3 className="text-sm sm:text-lg font-bold text-blue-900 leading-snug">
              Application Form for Appointment to the Post of Executive Director
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-600">Notice No.: 01/2083/2084 | Position: Executive Director</p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
            {user ? (
              <Link
                href={user.role === 'ADMIN' ? '/admin/dashboard' : '/applicant/dashboard'}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-sm text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                <span>{user.role === 'ADMIN' ? 'Go to Admin Dashboard' : 'Go to Application Dashboard'}</span>
                <span>→</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-sm text-xs sm:text-sm flex items-center justify-center gap-2"
                >
                  <span>Apply Online</span>
                  <span>→</span>
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold px-6 py-3 rounded-xl transition-all text-xs sm:text-sm flex items-center justify-center"
                >
                  <span>Login to Portal</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl text-blue-600 font-bold">
              📝
            </div>
            <h4 className="font-bold text-base text-slate-900">100% English Online Form</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Clean and straightforward application form wizard. Fill out your details smoothly in standard English text.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl text-blue-600 font-bold">
              🗺️
            </div>
            <h4 className="font-bold text-base text-slate-900">Nepal Provinces & 77 Districts</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Interactive dropdown menus for all 7 Provinces and 77 Districts of Nepal. Select your location in seconds.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl text-blue-600 font-bold">
              🛡️
            </div>
            <h4 className="font-bold text-base text-slate-900">Admin Inspection & Verification</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dedicated admin portal with instant search, filtering, profile inspector, document viewer, and approval controls.
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} B.P. Koirala Memorial Cancer Hospital, Bharatpur, Chitwan, Nepal. All Rights Reserved.
      </footer>
    </div>
  );
}
