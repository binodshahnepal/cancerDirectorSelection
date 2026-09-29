'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Swal from 'sweetalert2';
import { nepalProvinces, allDistricts } from '@/lib/nepalData';

export default function ApplicantDashboard() {
  const [user, setUser] = useState<any>(null);
  const [appData, setAppData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState(1);
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          if (data.accountDeleted) {
            Swal.fire({
              icon: 'error',
              title: 'Account Deleted',
              text: 'Your application and account have been deleted by the administrator.',
              confirmButtonColor: '#dc2626'
            }).then(() => {
              router.push('/login?reason=deleted');
            });
          } else {
            router.push('/login');
          }
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
        const app = data.application;
        if (app.status === 'APPROVED') {
          Swal.fire({
            icon: 'success',
            title: '🎉 Application Approved!',
            html: `
              <p class="text-slate-700 text-sm mb-3">Congratulations! Your application for <strong>Executive Director Position</strong> at B.P. Koirala Memorial Cancer Hospital has been verified and <strong>APPROVED</strong> by the selection committee.</p>
              ${app.remarks ? `<div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs text-left font-medium"><strong>Committee Remarks:</strong> ${app.remarks}</div>` : ''}
            `,
            confirmButtonColor: '#059669',
            confirmButtonText: 'Great!'
          });
        } else if (app.status === 'REJECTED') {
          Swal.fire({
            icon: 'error',
            title: 'Application Status: Rejected',
            html: `
              <p class="text-slate-700 text-sm mb-3">We regret to inform you that your application for Executive Director Position has been <strong>REJECTED</strong> by the selection committee.</p>
              <div class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 text-left space-y-1">
                <div class="font-bold text-xs uppercase tracking-wider text-red-700">Official Reason for Rejection:</div>
                <div class="font-semibold text-xs md:text-sm whitespace-pre-line">${app.remarks || 'No specific reason provided.'}</div>
              </div>
            `,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Understand & View Details'
          });
        }
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
        if (submitNow) {
          setIsEditing(false);
        }
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDocTypeLabel = (docType: string) => {
    switch (docType) {
      case 'CITIZENSHIP_FRONT':
        return 'Citizenship (Front)';
      case 'CITIZENSHIP_BACK':
        return 'Citizenship (Back)';
      case 'CITIZENSHIP':
        return 'Citizenship Certificate';
      case 'PASSPORT_FRONT':
        return 'Passport / Photo (Front)';
      case 'PASSPORT_BACK':
        return 'Passport (Back)';
      case 'PHOTO':
        return 'Passport Photo / Passport';
      case 'COUNCIL_REG':
        return 'Medical Council Registration';
      case 'ACADEMIC':
        return 'Academic Transcript / Certificate';
      case 'EXPERIENCE':
        return 'Work Experience Document';
      case 'TRAINING':
        return 'Training / Qualification Certificate';
      case 'CV':
        return 'Curriculum Vitae (CV)';
      default:
        return docType;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string, titlePrefix: string) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !appData) return;

    const targetInput = e.target;
    try {
      setMsg({ type: 'success', text: `⏳ Uploading ${files.length} document file(s)... Please wait.` });
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('docType', docType);
        formData.append('title', files.length > 1 ? `${titlePrefix} (${file.name})` : titlePrefix);
        formData.append('applicationId', appData.id);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error('Upload error response:', res.status, errText);
          setMsg({ type: 'error', text: `Upload failed (HTTP ${res.status}). File size may exceed limits or server error occurred.` });
          return;
        }

        const data = await res.json();
        if (!data.success) {
          setMsg({ type: 'error', text: data.error || `Failed to upload ${file.name}` });
          return;
        }
      }
      targetInput.value = '';
      await fetchApplication();
      setMsg({ type: 'success', text: '🎉 Document(s) Uploaded Successfully!' });
    } catch (err: any) {
      console.error('Upload exception:', err);
      setMsg({ type: 'error', text: `File upload failed: ${err.message || 'Error uploading file'}` });
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`/api/upload?id=${encodeURIComponent(docId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        await fetchApplication();
        setMsg({ type: 'success', text: '🗑️ Document deleted successfully.' });
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to delete document.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Error deleting document.' });
    }
  };

  const getDocsByType = (docType: string, legacyTypes: string[] = []) => {
    if (!appData?.documents) return [];
    const targetTypes = [docType, ...legacyTypes].map(t => t.toUpperCase());

    return appData.documents.filter((d: any) =>
      targetTypes.includes((d.docType || '').toUpperCase())
    );
  };

  const renderSingleDocSlot = (docType: string, titleLabel: string, legacyTypes: string[] = []) => {
    const docs = getDocsByType(docType, legacyTypes);

    return (
      <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
        <label className="font-bold block text-slate-800 text-xs">{titleLabel}</label>
        {docs.length > 0 && (
          <div className="space-y-2">
            {docs.map((uploaded: any) => (
              <div key={uploaded.id} className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800">
                <div className="truncate max-w-[200px] flex items-center gap-1.5">
                  <span className="font-extrabold text-emerald-600">✓</span>
                  <span className="truncate font-semibold text-xs" title={uploaded.fileName}>
                    {uploaded.fileName}
                  </span>
                  {uploaded.fileSize && (
                    <span className="text-[10px] text-emerald-700 font-mono bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                      {formatFileSize(uploaded.fileSize)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={uploaded.filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-blue-700 hover:underline bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 flex items-center gap-1"
                  >
                    <span>👁️ View</span>
                  </a>
                  {!isSubmitted && (
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(uploaded.id)}
                      className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md border border-red-200 flex items-center gap-1"
                      title="Delete document"
                    >
                      <span>🗑️ Delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isSubmitted && (
          <div className="pt-1">
            {docs.length > 0 && (
              <span className="text-[10px] font-bold text-slate-500 block mb-1">
                Replace or Upload New File:
              </span>
            )}
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              disabled={isSubmitted}
              onChange={(e) => handleFileUpload(e, docType, titleLabel)}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-600 file:text-white file:font-bold hover:file:bg-blue-700 cursor-pointer"
            />
          </div>
        )}
      </div>
    );
  };

  const renderMultipleDocSlot = (docType: string, titleLabel: string, legacyTypes: string[] = []) => {
    const docs = getDocsByType(docType, legacyTypes);

    return (
      <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3">
        {docs.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-600">Uploaded Documents ({docs.length}):</span>
            <div className="grid grid-cols-1 gap-2">
              {docs.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800"
                >
                  <div className="truncate max-w-[240px] flex items-center gap-1.5">
                    <span className="font-extrabold text-emerald-600">✓</span>
                    <span className="truncate font-semibold text-xs" title={doc.fileName}>{doc.fileName}</span>
                    {doc.fileSize && (
                      <span className="text-[10px] text-emerald-700 font-mono bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                        {formatFileSize(doc.fileSize)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={doc.filePath}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-blue-700 hover:underline bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 flex items-center gap-1"
                    >
                      <span>👁️ View</span>
                    </a>
                    {!isSubmitted && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md border border-red-200 flex items-center gap-1"
                        title="Delete document"
                      >
                        <span>🗑️ Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isSubmitted && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              {docs.length > 0 ? '+ Add More File(s) (Images, PDF, Word documents allowed):' : 'Select File(s) to upload:'}
            </label>
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              disabled={isSubmitted}
              onChange={(e) => handleFileUpload(e, docType, titleLabel)}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-600 file:text-white file:font-bold hover:file:bg-blue-700 cursor-pointer"
            />
          </div>
        )}
      </div>
    );
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

  const isSubmitted = (appData?.status === 'SUBMITTED' || appData?.status === 'APPROVED' || appData?.status === 'REJECTED') && !isEditing;
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
                ● {appData?.status} {isEditing ? '(Editing)' : ''}
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
            {isSubmitted ? (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setMsg({
                    type: 'success',
                    text: '✏️ Form editing unlocked! You can now update any details and save or re-submit.'
                  });
                }}
                className="flex-1 md:flex-none px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
              >
                ✏️ Edit Application
              </button>
            ) : (
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
                  🚀 {appData?.status === 'SUBMITTED' ? 'Update & Re-submit' : 'Submit Application'}
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

        {/* OFFICIAL STATUS VERIFICATION NOTIFICATION CARD */}
        {appData?.status === 'APPROVED' && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-5 md:p-6 shadow-sm space-y-3">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md">
                ✓
              </div>
              <div className="space-y-1">
                <h3 className="text-base md:text-lg font-black text-emerald-950">
                  Official Verification Status: APPROVED 🎉
                </h3>
                <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                  Congratulations! Your recruitment application for Executive Director position has been verified and APPROVED by the administrator.
                </p>
                {appData.remarks && (
                  <div className="mt-2.5 p-3.5 bg-white border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold space-y-1 shadow-xs">
                    <span className="text-[11px] text-emerald-700 uppercase font-extrabold tracking-wider block">Committee Remarks / Next Steps:</span>
                    <span>{appData.remarks}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {appData?.status === 'REJECTED' && (
          <div className="bg-red-50 border-2 border-red-300 rounded-3xl p-5 md:p-6 shadow-sm space-y-3">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-red-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md">
                ✕
              </div>
              <div className="space-y-2 w-full">
                <div>
                  <h3 className="text-base md:text-lg font-black text-red-950">
                    Official Verification Status: REJECTED
                  </h3>
                  <p className="text-xs text-red-800 font-medium leading-relaxed">
                    We regret to inform you that your application was rejected by the selection committee after verification.
                  </p>
                </div>
                <div className="p-4 bg-white border border-red-200 rounded-2xl text-xs space-y-1.5 shadow-xs">
                  <span className="text-[11px] font-black text-red-700 uppercase tracking-wider block">Official Reason for Rejection:</span>
                  <p className="text-red-950 font-bold text-xs md:text-sm whitespace-pre-line leading-relaxed">
                    {appData.remarks || 'No specific remarks provided by administrator.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10 shadow-sm space-y-6">

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

                {/* CITIZENSHIP ISSUE DISTRICT DROPDOWN */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Citizenship Issue District *</label>
                  <select
                    disabled={isSubmitted}
                    value={appData.citizenshipDistrict || 'Chitwan'}
                    onChange={(e) => setAppData({ ...appData, citizenshipDistrict: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 font-medium"
                  >
                    <option value="">Select Citizenship Issue District</option>
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

                  {/* DISTRICT DROPDOWN */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">District *</label>
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
                      <option value="">Select District</option>
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
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">District</label>
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
                      <option value="">Select District</option>
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
                  <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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
                <p className="text-xs text-slate-500">
                  Upload clear scanned copies (PDF or Image format). You can upload multiple files for certificates, transcripts, and experience.
                </p>
              </div>

              <div className="space-y-6 text-xs">
                {/* MASTER UPLOADED DOCUMENTS OVERVIEW MANAGER */}
                <div className="p-5 border border-blue-200 rounded-2xl bg-blue-50/40 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-blue-200 pb-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-blue-900 flex items-center gap-2">
                        <span>📋</span> Uploaded Documents Manager ({(appData?.documents || []).length} Files Uploaded)
                      </h4>
                      <p className="text-slate-500 text-[11px]">All uploaded files for your application are listed below with preview and deletion options</p>
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1 bg-blue-600 text-white rounded-full">
                      Total Files: {(appData?.documents || []).length}
                    </span>
                  </div>

                  {(appData?.documents || []).length === 0 ? (
                    <div className="p-6 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300 space-y-1">
                      <p className="font-bold text-xs">No documents uploaded yet.</p>
                      <p className="text-[11px]">Use the upload sections below to attach your required certificates, transcripts, and documents.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-800 uppercase font-extrabold text-[11px] tracking-wider">
                          <tr>
                            <th className="p-3 border-b border-slate-200">#</th>
                            <th className="p-3 border-b border-slate-200">Document Category</th>
                            <th className="p-3 border-b border-slate-200">File Name</th>
                            <th className="p-3 border-b border-slate-200">File Size</th>
                            <th className="p-3 border-b border-slate-200 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700">
                          {(appData?.documents || []).map((doc: any, idx: number) => (
                            <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-bold text-slate-400 text-center">{idx + 1}</td>
                              <td className="p-3">
                                <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-md font-bold text-[11px]">
                                  {formatDocTypeLabel(doc.docType)}
                                </span>
                              </td>
                              <td className="p-3 font-semibold text-slate-900 max-w-[220px] truncate" title={doc.fileName}>
                                📄 {doc.fileName}
                              </td>
                              <td className="p-3 font-mono text-slate-500">{formatFileSize(doc.fileSize)}</td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end items-center gap-2">
                                  <a
                                    href={doc.filePath}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg shadow-sm transition-all flex items-center gap-1"
                                  >
                                    <span>👁️ View File</span>
                                  </a>
                                  {!isSubmitted && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteDocument(doc.id)}
                                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1"
                                    >
                                      <span>🗑️ Delete File</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 1. CITIZENSHIP SECTION (Front & Back) */}
                <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50/80 space-y-4 shadow-sm">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <span>🆔</span> 1. Nepalese Citizenship Certificate (Front & Back)
                    </h4>
                    <p className="text-slate-500 text-[11px]">Upload front side and back side of your Citizenship Certificate</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderSingleDocSlot('CITIZENSHIP_FRONT', 'Citizenship Certificate (Front Side)', ['CITIZENSHIP'])}
                    {renderSingleDocSlot('CITIZENSHIP_BACK', 'Citizenship Certificate (Back Side)', [])}
                  </div>
                </div>

                {/* 2. PASSPORT SECTION (Front & Back) */}
                <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50/80 space-y-4 shadow-sm">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <span>🛂</span> 2. Passport & Passport-Size Photograph (Front & Back)
                    </h4>
                    <p className="text-slate-500 text-[11px]">Upload Passport photo / info page (Front) and address / signature page (Back)</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderSingleDocSlot('PASSPORT_FRONT', 'Passport / Photo (Front / Info Page)', ['PHOTO'])}
                    {renderSingleDocSlot('PASSPORT_BACK', 'Passport (Back / Address Page)', [])}
                  </div>
                </div>

                {/* 3. MEDICAL COUNCIL REGISTRATION (Single file) */}
                <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50/80 space-y-3 shadow-sm">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <span>🏥</span> 3. Medical Council Registration & Renewal Certificate (Single File)
                    </h4>
                    <p className="text-slate-500 text-[11px]">Upload valid Medical Council Registration or Renewal Certificate</p>
                  </div>
                  {renderSingleDocSlot('COUNCIL_REG', 'Medical Council Registration Certificate', ['COUNCIL_REG'])}
                </div>

                {/* 4. ACADEMIC QUALIFICATIONS (Multiple Files) */}
                <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50/80 space-y-3 shadow-sm">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <span>🎓</span> 4. Academic Qualification Certificates & Transcripts (Multiple Files Allowed)
                    </h4>
                    <p className="text-slate-500 text-[11px]">Upload transcripts, character certificates, and degree certificates for all academic levels</p>
                  </div>
                  {renderMultipleDocSlot('ACADEMIC', 'Academic Qualification Certificate / Transcript', ['ACADEMIC'])}
                </div>

                {/* 5. WORK EXPERIENCE (Multiple Files) */}
                <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50/80 space-y-3 shadow-sm">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <span>💼</span> 5. Documents Certifying Work Experience (Multiple Files Allowed)
                    </h4>
                    <p className="text-slate-500 text-[11px]">Upload experience certificates, service verification letters, and appointment letters</p>
                  </div>
                  {renderMultipleDocSlot('EXPERIENCE', 'Work Experience Document', ['EXPERIENCE'])}
                </div>

                {/* 6. TRAINING & SPECIAL QUALIFICATION (Multiple Files) */}
                <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50/80 space-y-3 shadow-sm">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <span>📜</span> 6. Training & Special Qualification Certificates (Multiple Files Allowed)
                    </h4>
                    <p className="text-slate-500 text-[11px]">Upload fellowship certificates, training completion certificates, workshops, special courses</p>
                  </div>
                  {renderMultipleDocSlot('TRAINING', 'Training / Special Qualification Certificate', ['TRAINING'])}
                </div>

                {/* 7. CV / RESUME (Single File) */}
                <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50/80 space-y-3 shadow-sm">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <span>📄</span> 7. Curriculum Vitae (CV) / Resume (PDF - Single File)
                    </h4>
                    <p className="text-slate-500 text-[11px]">Upload your comprehensive professional Curriculum Vitae (PDF format)</p>
                  </div>
                  {renderSingleDocSlot('CV', 'Curriculum Vitae (CV) / Resume', ['CV'])}
                </div>
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
