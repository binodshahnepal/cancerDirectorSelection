'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { nepalProvinces, allDistricts } from '@/lib/nepalData';

export default function ApplicantDashboard() {
  const [user, setUser] = useState<any>(null);
  const [appData, setAppData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState(1);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push('/login');
          return;
        }
        setUser(data.user);
        fetchApplication();
      })
      .catch(() => router.push('/login'));
  }, []);

  const fetchApplication = async () => {
    try {
      const res = await fetch('/api/application');
      const data = await res.json();
      if (data.application) {
        setAppData(data.application);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = () => {
    if (!appData) return 0;
    let total = 8;
    let done = 0;
    if (appData.applicantNameEn && appData.dob && appData.citizenshipNo) done++;
    if (appData.permProvince && appData.permDistrict && appData.permPhone) done++;
    if ((appData.qualifications || []).length > 0) done++;
    if ((appData.experiences || []).length > 0) done++;
    if ((appData.trainings || []).length > 0) done++;
    if (appData.awards || appData.publications) done++;
    if ((appData.documents || []).length > 0) done++;
    if (appData.declarationAccepted) done++;
    return Math.round((done / total) * 100);
  };

  const handleSave = async (submitNow: boolean = false) => {
    if (!appData) return;
    setSaving(true);
    setMsg(null);

    try {
      const payload = {
        ...appData,
        status: submitNow ? 'SUBMITTED' : appData.status || 'DRAFT'
      };

      const res = await fetch('/api/application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setAppData(data.application);
        setMsg({
          type: 'success',
          text: submitNow ? '🎉 Application Submitted Successfully!' : '💾 Application Draft Saved Successfully!'
        });
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'An error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string, title: string) => {
    const file = e.target.files?.[0];
    if (!file || !appData) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);
    formData.append('title', title);
    formData.append('applicationId', appData.id);

    try {
      setMsg({ type: 'success', text: 'Uploading document file...' });
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        fetchApplication();
        setMsg({ type: 'success', text: '✅ Document Uploaded Successfully!' });
      } else {
        setMsg({ type: 'error', text: data.error || 'Upload failed' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'File upload failed.' });
    }
  };

  const addQualificationRow = () => {
    const list = appData.qualifications || [];
    setAppData({
      ...appData,
      qualifications: [...list, { degree: '', subject: '', university: '', passedYear: '', divisionGpa: '' }]
    });
  };

  const addExperienceRow = () => {
    const list = appData.experiences || [];
    setAppData({
      ...appData,
      experiences: [...list, { organization: '', designation: '', periodFrom: '', periodTo: '', responsibilities: '' }]
    });
  };

  const addTrainingRow = () => {
    const list = appData.trainings || [];
    setAppData({
      ...appData,
      trainings: [...list, { title: '', institution: '', duration: '', yearObtained: '' }]
    });
  };

  // Automatically find matching province for a chosen district if needed
  const findProvinceForDistrict = (districtName: string): string => {
    for (const p of nepalProvinces) {
      if (p.districts.includes(districtName)) {
        return p.name;
      }
    }
    return appData?.permProvince || 'Bagmati Province';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-500">Loading Applicant Portal...</p>
        </div>
      </div>
    );
  }

  const isSubmitted = appData?.status === 'SUBMITTED' || appData?.status === 'APPROVED' || appData?.status === 'REJECTED';
  const completionPct = calculateCompletion();

  const tabs = [
    { id: 1, label: 'Personal Details', icon: '👤' },
    { id: 2, label: 'Addresses', icon: '📍' },
    { id: 3, label: 'Academic Qualifications', icon: '🎓' },
    { id: 4, label: 'Work Experience', icon: '💼' },
    { id: 5, label: 'Professional Training', icon: '📜' },
    { id: 6, label: 'Other Details', icon: '🏅' },
    { id: 7, label: 'Document Uploads', icon: '📁' },
    { id: 8, label: 'Self Declaration', icon: '✍️' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Navbar user={user} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-6">

        {/* HERO APPLICATION STATUS BANNER */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-teal-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 z-10 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono bg-white/15 border border-white/25 px-3 py-1 rounded-full font-bold">
                App No: {appData?.appNo}
              </span>
              <span
                className={`text-xs px-3.5 py-1 rounded-full font-extrabold uppercase shadow-sm ${
                  appData?.status === 'APPROVED'
                    ? 'bg-emerald-500 text-white'
                    : appData?.status === 'REJECTED'
                    ? 'bg-red-500 text-white'
                    : appData?.status === 'SUBMITTED'
                    ? 'bg-blue-400 text-slate-950 font-black'
                    : 'bg-amber-400 text-slate-950 font-black'
                }`}
              >
                ● {appData?.status}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              Executive Director Application Form
            </h2>
            <p className="text-xs text-blue-100/90 leading-relaxed">
              B.P. Koirala Memorial Cancer Hospital | Position Notice No. 01/2083/2084
            </p>

            {/* Completion Progress Bar */}
            <div className="pt-2 space-y-1 max-w-md">
              <div className="flex justify-between text-xs font-semibold text-blue-200">
                <span>Form Progress</span>
                <span>{completionPct}% Completed</span>
              </div>
              <div className="w-full bg-blue-950/80 rounded-full h-2.5 overflow-hidden border border-white/20">
                <div
                  className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="z-10 flex flex-wrap md:flex-col gap-2.5 w-full md:w-auto">
            {!isSubmitted && (
              <>
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="flex-1 md:flex-none px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold rounded-xl transition-all backdrop-blur-md shadow"
                >
                  {saving ? 'Saving...' : '💾 Save Draft'}
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving || !appData?.declarationAccepted}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  🚀 Submit Application
                </button>
              </>
            )}
            <button
              onClick={() => window.print()}
              className="flex-1 md:flex-none px-4 py-2.5 bg-white text-blue-900 hover:bg-slate-100 font-extrabold text-xs rounded-xl shadow transition-all"
            >
              🖨️ Print PDF
            </button>
          </div>
        </div>

        {/* Message Alert */}
        {msg && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold shadow-sm flex items-center justify-between ${
              msg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <span>{msg.text}</span>
            <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
        )}

        {/* STEPPER NAV BAR */}
        <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm overflow-x-auto flex gap-1 text-xs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 rounded-xl whitespace-nowrap font-bold transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* MAIN FORM CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-sm space-y-6">

          {/* TAB 1: Personal Details */}
          {activeTab === 1 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span>👤</span> 1. Personal Information
                </h3>
                <p className="text-xs text-slate-500">Provide your official identity details matching your citizenship</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Applicant Name (BLOCK LETTERS) *</label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitted}
                    placeholder="e.g. BINOD SHAH"
                    value={appData.applicantNameEn || ''}
                    onChange={(e) => setAppData({ ...appData, applicantNameEn: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Date of Birth (BS / AD) *</label>
                  <input
                    type="date"
                    required
                    disabled={isSubmitted}
                    value={appData.dob || ''}
                    onChange={(e) => setAppData({ ...appData, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Age (Years & Months)</label>
                  <input
                    type="text"
                    disabled={isSubmitted}
                    placeholder="e.g. 42 Years 5 Months"
                    value={appData.age || ''}
                    onChange={(e) => setAppData({ ...appData, age: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Gender *</label>
                  <select
                    disabled={isSubmitted}
                    value={appData.gender || 'Male'}
                    onChange={(e) => setAppData({ ...appData, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Citizenship Certificate Number *</label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitted}
                    placeholder="Citizenship No."
                    value={appData.citizenshipNo || ''}
                    onChange={(e) => setAppData({ ...appData, citizenshipNo: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>

                {/* CITIZENSHIP ISSUE DISTRICT DROPDOWN - ALL 77 DISTRICTS */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Citizenship Issue District (All 77 Districts) *</label>
                  <select
                    disabled={isSubmitted}
                    value={appData.citizenshipDistrict || 'Chitwan'}
                    onChange={(e) => setAppData({ ...appData, citizenshipDistrict: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 font-medium"
                  >
                    <option value="">Select Citizenship Issue District ({allDistricts.length} Districts)</option>
                    {allDistricts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Citizenship Issue Date *</label>
                  <input
                    type="date"
                    required
                    disabled={isSubmitted}
                    value={appData.citizenshipDate || ''}
                    onChange={(e) => setAppData({ ...appData, citizenshipDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Father's Full Name *</label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitted}
                    placeholder="Father's Full Name"
                    value={appData.fatherName || ''}
                    onChange={(e) => setAppData({ ...appData, fatherName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Mother's Full Name *</label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitted}
                    placeholder="Mother's Full Name"
                    value={appData.motherName || ''}
                    onChange={(e) => setAppData({ ...appData, motherName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Grandfather's Full Name *</label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitted}
                    placeholder="Grandfather's Full Name"
                    value={appData.grandfatherName || ''}
                    onChange={(e) => setAppData({ ...appData, grandfatherName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Spouse's Name (if Married)</label>
                  <input
                    type="text"
                    disabled={isSubmitted}
                    placeholder="Spouse's Full Name"
                    value={appData.spouseName || ''}
                    onChange={(e) => setAppData({ ...appData, spouseName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Addresses */}
          {activeTab === 2 && (
            <div className="space-y-8">
              {/* Permanent Address */}
              <div className="space-y-5">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <span>📍</span> 2. Permanent Address
                  </h3>
                  <p className="text-xs text-slate-500">Official permanent location details</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Province *</label>
                    <select
                      disabled={isSubmitted}
                      value={appData.permProvince || 'Bagmati Province'}
                      onChange={(e) => {
                        const newProv = e.target.value;
                        setAppData({ ...appData, permProvince: newProv });
                      }}
                      className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 font-medium"
                    >
                      {nepalProvinces.map(p => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* ALL 77 DISTRICTS DROPDOWN */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">District (All 77 Districts) *</label>
                    <select
                      disabled={isSubmitted}
                      value={appData.permDistrict || 'Chitwan'}
                      onChange={(e) => {
                        const dist = e.target.value;
                        const autoProv = findProvinceForDistrict(dist);
                        setAppData({ ...appData, permDistrict: dist, permProvince: autoProv });
                      }}
                      className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 font-medium"
                    >
                      <option value="">Select District ({allDistricts.length} Districts)</option>
                      {allDistricts.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Local Body (Municipality/Rural Municipality) *</label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitted}
                      placeholder="e.g. Bharatpur Metropolitan City"
                      value={appData.permLocalBody || ''}
                      onChange={(e) => setAppData({ ...appData, permLocalBody: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Ward No. *</label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitted}
                      placeholder="e.g. 10"
                      value={appData.permWard || ''}
                      onChange={(e) => setAppData({ ...appData, permWard: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tole / Street Name</label>
                    <input
                      type="text"
                      disabled={isSubmitted}
                      placeholder="e.g. Hakim Chowk"
                      value={appData.permTole || ''}
                      onChange={(e) => setAppData({ ...appData, permTole: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Contact Mobile Number *</label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitted}
                      placeholder="e.g. +977-9855012345"
                      value={appData.permPhone || ''}
                      onChange={(e) => setAppData({ ...appData, permPhone: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Current Address */}
              <div className="space-y-5 pt-6 border-t border-slate-200">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-base font-bold text-slate-900">Current / Temporary Address</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Province</label>
                    <select
                      disabled={isSubmitted}
                      value={appData.tempProvince || 'Bagmati Province'}
                      onChange={(e) => setAppData({ ...appData, tempProvince: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                    >
                      {nepalProvinces.map(p => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">District (All 77 Districts)</label>
                    <select
                      disabled={isSubmitted}
                      value={appData.tempDistrict || 'Chitwan'}
                      onChange={(e) => {
                        const dist = e.target.value;
                        const autoProv = findProvinceForDistrict(dist);
                        setAppData({ ...appData, tempDistrict: dist, tempProvince: autoProv });
                      }}
                      className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 font-medium"
                    >
                      <option value="">Select District ({allDistricts.length} Districts)</option>
                      {allDistricts.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Local Body</label>
                    <input
                      type="text"
                      disabled={isSubmitted}
                      placeholder="Local Body"
                      value={appData.tempLocalBody || ''}
                      onChange={(e) => setAppData({ ...appData, tempLocalBody: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Ward No.</label>
                    <input
                      type="text"
                      disabled={isSubmitted}
                      placeholder="Ward No."
                      value={appData.tempWard || ''}
                      onChange={(e) => setAppData({ ...appData, tempWard: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Academic Qualifications */}
          {activeTab === 3 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <span>🎓</span> 3. Academic Qualifications
                  </h3>
                  <p className="text-xs text-slate-500">List all academic degrees from SEE/SLC to Doctorate</p>
                </div>
                {!isSubmitted && (
                  <button
                    type="button"
                    onClick={addQualificationRow}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold shadow-sm transition-all"
                  >
                    + Add Qualification Row
                  </button>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-bold uppercase">
                    <tr>
                      <th className="p-3 border-b border-slate-200">#</th>
                      <th className="p-3 border-b border-slate-200">Degree / Qualification</th>
                      <th className="p-3 border-b border-slate-200">Major Subject</th>
                      <th className="p-3 border-b border-slate-200">University / Institution</th>
                      <th className="p-3 border-b border-slate-200">Passed Year</th>
                      <th className="p-3 border-b border-slate-200">Division / % / GPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(appData.qualifications || []).map((q: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-400 text-center">{idx + 1}</td>
                        <td className="p-3">
                          <input
                            type="text"
                            disabled={isSubmitted}
                            value={q.degree}
                            placeholder="e.g. MBBS / MD / MHA / PhD"
                            onChange={(e) => {
                              const list = [...appData.qualifications];
                              list[idx].degree = e.target.value;
                              setAppData({ ...appData, qualifications: list });
                            }}
                            className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            disabled={isSubmitted}
                            value={q.subject}
                            placeholder="Major Subject"
                            onChange={(e) => {
                              const list = [...appData.qualifications];
                              list[idx].subject = e.target.value;
                              setAppData({ ...appData, qualifications: list });
                            }}
                            className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            disabled={isSubmitted}
                            value={q.university}
                            placeholder="University"
                            onChange={(e) => {
                              const list = [...appData.qualifications];
                              list[idx].university = e.target.value;
                              setAppData({ ...appData, qualifications: list });
                            }}
                            className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            disabled={isSubmitted}
                            value={q.passedYear}
                            placeholder="Year"
                            onChange={(e) => {
                              const list = [...appData.qualifications];
                              list[idx].passedYear = e.target.value;
                              setAppData({ ...appData, qualifications: list });
                            }}
                            className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 font-mono"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            disabled={isSubmitted}
                            value={q.divisionGpa}
                            placeholder="GPA / %"
                            onChange={(e) => {
                              const list = [...appData.qualifications];
                              list[idx].divisionGpa = e.target.value;
                              setAppData({ ...appData, qualifications: list });
                            }}
                            className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Work Experience */}
          {activeTab === 4 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <span>💼</span> 4. Work Experience
                  </h3>
                  <p className="text-xs text-slate-500">Provide medical, administrative, and clinical experience details</p>
                </div>
                {!isSubmitted && (
                  <button
                    type="button"
                    onClick={addExperienceRow}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold shadow-sm transition-all"
                  >
                    + Add Experience Row
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {(appData.experiences || []).map((exp: any, idx: number) => (
                  <div key={idx} className="p-6 border border-slate-200 rounded-2xl bg-slate-50/80 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider">Experience Detail #{idx + 1}</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Office / Organization *</label>
                        <input
                          type="text"
                          disabled={isSubmitted}
                          placeholder="Organization Name"
                          value={exp.organization || ''}
                          onChange={(e) => {
                            const list = [...appData.experiences];
                            list[idx].organization = e.target.value;
                            setAppData({ ...appData, experiences: list });
                          }}
                          className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Designation / Position *</label>
                        <input
                          type="text"
                          disabled={isSubmitted}
                          placeholder="Position Held"
                          value={exp.designation || ''}
                          onChange={(e) => {
                            const list = [...appData.experiences];
                            list[idx].designation = e.target.value;
                            setAppData({ ...appData, experiences: list });
                          }}
                          className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Service From Date *</label>
                        <input
                          type="date"
                          disabled={isSubmitted}
                          value={exp.periodFrom || ''}
                          onChange={(e) => {
                            const list = [...appData.experiences];
                            list[idx].periodFrom = e.target.value;
                            setAppData({ ...appData, experiences: list });
                          }}
                          className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-900"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-slate-700">Service To Date *</label>
                          <label className="flex items-center gap-1.5 text-xs text-blue-700 font-bold cursor-pointer">
                            <input
                              type="checkbox"
                              disabled={isSubmitted}
                              checked={exp.periodTo === 'Present'}
                              onChange={(e) => {
                                const list = [...appData.experiences];
                                list[idx].periodTo = e.target.checked ? 'Present' : '';
                                setAppData({ ...appData, experiences: list });
                              }}
                              className="w-4 h-4 accent-blue-600 rounded"
                            />
                            <span>Currently working here</span>
                          </label>
                        </div>
                        {exp.periodTo === 'Present' ? (
                          <input
                            type="text"
                            disabled
                            value="Present (Currently Working)"
                            className="w-full p-2.5 text-xs border border-blue-300 rounded-xl bg-blue-50 text-blue-900 font-extrabold"
                          />
                        ) : (
                          <input
                            type="date"
                            disabled={isSubmitted}
                            value={exp.periodTo || ''}
                            onChange={(e) => {
                              const list = [...appData.experiences];
                              list[idx].periodTo = e.target.value;
                              setAppData({ ...appData, experiences: list });
                            }}
                            className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-900"
                          />
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Key Responsibilities & Job Description (Multi-line) *
                        </label>
                        <textarea
                          rows={3}
                          disabled={isSubmitted}
                          placeholder="Detail your key duties, clinical/hospital managerial responsibilities, administrative leadership, and achievements..."
                          value={exp.responsibilities || ''}
                          onChange={(e) => {
                            const list = [...appData.experiences];
                            list[idx].responsibilities = e.target.value;
                            setAppData({ ...appData, experiences: list });
                          }}
                          className="w-full p-3 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5 & 6: Trainings & Other Details */}
          {activeTab === 5 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <span>📜</span> 5. Professional Training
                  </h3>
                </div>
                {!isSubmitted && (
                  <button
                    type="button"
                    onClick={addTrainingRow}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold shadow-sm transition-all"
                  >
                    + Add Training Row
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {(appData.trainings || []).map((trg: any, idx: number) => (
                  <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      disabled={isSubmitted}
                      placeholder="Training Title"
                      value={trg.title}
                      onChange={(e) => {
                        const list = [...appData.trainings];
                        list[idx].title = e.target.value;
                        setAppData({ ...appData, trainings: list });
                      }}
                      className="p-2.5 text-xs border rounded-lg bg-white text-slate-900"
                    />
                    <input
                      type="text"
                      disabled={isSubmitted}
                      placeholder="Organizing Institution"
                      value={trg.institution}
                      onChange={(e) => {
                        const list = [...appData.trainings];
                        list[idx].institution = e.target.value;
                        setAppData({ ...appData, trainings: list });
                      }}
                      className="p-2.5 text-xs border rounded-lg bg-white text-slate-900"
                    />
                    <input
                      type="text"
                      disabled={isSubmitted}
                      placeholder="Duration"
                      value={trg.duration}
                      onChange={(e) => {
                        const list = [...appData.trainings];
                        list[idx].duration = e.target.value;
                        setAppData({ ...appData, trainings: list });
                      }}
                      className="p-2.5 text-xs border rounded-lg bg-white text-slate-900"
                    />
                    <input
                      type="text"
                      disabled={isSubmitted}
                      placeholder="Year Obtained"
                      value={trg.yearObtained}
                      onChange={(e) => {
                        const list = [...appData.trainings];
                        list[idx].yearObtained = e.target.value;
                        setAppData({ ...appData, trainings: list });
                      }}
                      className="p-2.5 text-xs border rounded-lg bg-white text-slate-900 font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 6 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span>🏅</span> 6. Other Details
                </h3>
              </div>
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">
                    (a) Awards, Honors, or Commendations received from Nepal Government or Other Organizations:
                  </label>
                  <textarea
                    rows={2}
                    disabled={isSubmitted}
                    value={appData.awards || ''}
                    onChange={(e) => setAppData({ ...appData, awards: e.target.value })}
                    placeholder="List awards or honors received"
                    className="w-full p-3 border rounded-xl bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">
                    (b) Publications, Medical Research, or Professional Contributions:
                  </label>
                  <textarea
                    rows={2}
                    disabled={isSubmitted}
                    value={appData.publications || ''}
                    onChange={(e) => setAppData({ ...appData, publications: e.target.value })}
                    placeholder="List publications or research contributions"
                    className="w-full p-3 border rounded-xl bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">
                    (c) Any Other Relevant Details:
                  </label>
                  <textarea
                    rows={2}
                    disabled={isSubmitted}
                    value={appData.otherDetails || ''}
                    onChange={(e) => setAppData({ ...appData, otherDetails: e.target.value })}
                    placeholder="Any extra details"
                    className="w-full p-3 border rounded-xl bg-white text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: Document Uploads */}
          {activeTab === 7 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span>📁</span> 7. Required Document Uploads
                </h3>
                <p className="text-xs text-slate-500">Upload clear scanned copies (PDF or Image format)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {[
                  { docType: 'CITIZENSHIP', label: '1. Nepalese Citizenship Certificate (PDF / Image)' },
                  { docType: 'ACADEMIC', label: '2. Academic Qualification Certificates & Transcripts' },
                  { docType: 'COUNCIL_REG', label: '3. Medical Council Registration & Renewal Certificate' },
                  { docType: 'EXPERIENCE', label: '4. Documents Certifying Work Experience' },
                  { docType: 'TRAINING', label: '5. Training & Special Qualification Certificates' },
                  { docType: 'CV', label: '6. Curriculum Vitae (CV) / Resume (PDF)' },
                  { docType: 'PHOTO', label: '7. Recent Passport-Size Photograph (JPG / PNG)' }
                ].map((docItem) => {
                  const uploaded = (appData.documents || []).find((d: any) => d.docType === docItem.docType);
                  return (
                    <div key={docItem.docType} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/80 space-y-2.5 shadow-sm">
                      <label className="font-bold block text-slate-800">{docItem.label}</label>
                      {uploaded ? (
                        <div className="flex justify-between items-center p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800">
                          <span className="truncate max-w-[200px] font-semibold">✓ {uploaded.fileName}</span>
                          <a href={uploaded.filePath} target="_blank" rel="noreferrer" className="underline font-bold text-xs text-blue-700">
                            View Document
                          </a>
                        </div>
                      ) : (
                        <input
                          type="file"
                          disabled={isSubmitted}
                          onChange={(e) => handleFileUpload(e, docItem.docType, docItem.label)}
                          className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-600 file:text-white file:font-bold hover:file:bg-blue-700 cursor-pointer"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 8: Self Declaration */}
          {activeTab === 8 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span>✍️</span> 8. Self Declaration
                </h3>
              </div>
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-xs leading-relaxed text-slate-700">
                <p>
                  "All details mentioned in this application form are true, factual, and complete. If the information provided or attached documents are proven to be false or incorrect, I agree to accept legal consequences as per prevailing laws. Furthermore, I agree to abide by the prevailing laws and the terms and conditions set by the hospital for appointment to the post of Executive Director."
                </p>
                <label className="flex items-center gap-3 font-bold text-slate-900 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    disabled={isSubmitted}
                    checked={Boolean(appData.declarationAccepted)}
                    onChange={(e) => setAppData({ ...appData, declarationAccepted: e.target.checked })}
                    className="w-5 h-5 accent-blue-600 rounded"
                  />
                  <span>I Agree to the Self Declaration Terms *</span>
                </label>
              </div>

              {!isSubmitted && (
                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSave(true)}
                    disabled={saving || !appData.declarationAccepted}
                    className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    🚀 Submit Application Now
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
