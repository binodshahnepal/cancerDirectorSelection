'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AdminPrintContent() {
  const searchParams = useSearchParams();
  const appId = searchParams.get('id');
  const isAll = searchParams.get('all') === 'true';
  const statusFilter = searchParams.get('status') || 'ALL';
  const queryStr = searchParams.get('q') || '';

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [appId, isAll, statusFilter, queryStr]);

  const fetchData = async () => {
    try {
      if (appId) {
        const res = await fetch(`/api/admin/applications?q=${encodeURIComponent(appId)}`);
        const data = await res.json();
        const found = (data.applications || []).filter((a: any) => a.id === appId || a.appNo === appId);
        setApplications(found.length > 0 ? found : (data.applications || []).slice(0, 1));
      } else {
        const url = `/api/admin/applications?q=${encodeURIComponent(queryStr)}&status=${encodeURIComponent(statusFilter)}`;
        const res = await fetch(url);
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-800 flex items-center justify-center font-sans">
        <p className="text-xs text-slate-500">Preparing Printable Document Sheet...</p>
      </div>
    );
  }

  return (
    <div className="bg-white text-slate-900 font-sans min-h-screen p-4 md:p-8">
      {/* Print Controls Header - Hidden when printing */}
      <div className="print:hidden max-w-4xl mx-auto mb-6 p-4 bg-slate-100 border border-slate-300 rounded-xl flex justify-between items-center">
        <div>
          <h2 className="font-bold text-sm text-slate-900">
            {isAll ? `Batch Print Report (${applications.length} Applications)` : 'Individual Application Print Sheet'}
          </h2>
          <p className="text-xs text-slate-600">Click the button below to print or save as PDF via your browser</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm"
          >
            🖨️ Print Now / Save PDF
          </button>
          <button
            onClick={() => window.close()}
            className="px-3 py-2 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg"
          >
            Close
          </button>
        </div>
      </div>

      {/* Applications Document Container */}
      <div className="max-w-4xl mx-auto space-y-12">
        {applications.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">No matching applications found to print.</div>
        ) : (
          applications.map((app, index) => (
            <div
              key={app.id}
              className="p-6 md:p-8 border border-slate-300 rounded-xl bg-white space-y-6 print:border-none print:p-0 print:rounded-none page-break-after-always"
              style={{ pageBreakAfter: index < applications.length - 1 ? 'always' : 'auto' }}
            >
              {/* Header */}
              <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4">
                <h1 className="font-extrabold text-xl md:text-2xl text-slate-900 tracking-tight">
                  B.P. KOIRALA MEMORIAL CANCER HOSPITAL
                </h1>
                <p className="font-semibold text-xs text-slate-700">BHARATPUR, CHITWAN, NEPAL</p>
                <p className="font-bold text-sm text-blue-900 pt-1">
                  APPLICATION FORM FOR APPOINTMENT TO THE POST OF EXECUTIVE DIRECTOR
                </p>

                <div className="flex justify-between items-center text-xs pt-3 text-slate-700 font-mono">
                  <span>Application Registration No: <strong>{app.appNo}</strong></span>
                  <span>Submission Date: {new Date(app.createdAt).toLocaleDateString()}</span>
                  <span className="font-bold uppercase text-slate-900">Status: [{app.status}]</span>
                </div>
              </div>

              {/* 1. Personal Details */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase bg-slate-100 p-1.5 border border-slate-300">
                  1. Personal Details
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-800 leading-relaxed">
                  <p><strong>Full Name:</strong> {app.applicantNameEn || app.user?.name || '-'}</p>
                  <p><strong>Date of Birth:</strong> {app.dob || '-'} (Age: {app.age || '-'})</p>
                  <p><strong>Gender:</strong> {app.gender || '-'}</p>
                  <p><strong>Citizenship No.:</strong> {app.citizenshipNo || '-'} ({app.citizenshipDistrict || '-'} / {app.citizenshipDate || '-'})</p>
                  <p><strong>Father's Name:</strong> {app.fatherName || '-'}</p>
                  <p><strong>Mother's Name:</strong> {app.motherName || '-'}</p>
                  <p><strong>Grandfather's Name:</strong> {app.grandfatherName || '-'}</p>
                  <p><strong>Spouse's Name:</strong> {app.spouseName || '-'}</p>
                </div>
              </div>

              {/* 2. Address */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase bg-slate-100 p-1.5 border border-slate-300">
                  2. Permanent & Current Address
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-800 leading-relaxed">
                  <p><strong>Permanent Location:</strong> {app.permLocalBody || '-'}, Ward #{app.permWard || '-'}, {app.permDistrict || '-'}, {app.permProvince || '-'}</p>
                  <p><strong>Permanent Tole / Street:</strong> {app.permTole || '-'}</p>
                  <p><strong>Contact Phone:</strong> {app.permPhone || '-'}</p>
                  <p><strong>Email Address:</strong> {app.permEmail || app.user?.email || '-'}</p>
                  <p><strong>Current Address:</strong> {app.tempLocalBody ? `${app.tempLocalBody}, ${app.tempDistrict}` : '-'}</p>
                </div>
              </div>

              {/* 3. Qualifications */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase bg-slate-100 p-1.5 border border-slate-300">
                  3. Academic Qualifications
                </h3>
                <table className="w-full text-xs text-left border border-slate-400 border-collapse">
                  <thead className="bg-slate-200 font-semibold">
                    <tr>
                      <th className="p-1.5 border border-slate-400">#</th>
                      <th className="p-1.5 border border-slate-400">Degree</th>
                      <th className="p-1.5 border border-slate-400">Major Subject</th>
                      <th className="p-1.5 border border-slate-400">University / Board</th>
                      <th className="p-1.5 border border-slate-400">Passed Year</th>
                      <th className="p-1.5 border border-slate-400">Division/GPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(app.qualifications || []).length === 0 ? (
                      <tr><td colSpan={6} className="p-2 text-center text-slate-500">No entries</td></tr>
                    ) : (
                      app.qualifications.map((q: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-1.5 border border-slate-400 text-center">{idx + 1}</td>
                          <td className="p-1.5 border border-slate-400">{q.degree}</td>
                          <td className="p-1.5 border border-slate-400">{q.subject}</td>
                          <td className="p-1.5 border border-slate-400">{q.university}</td>
                          <td className="p-1.5 border border-slate-400">{q.passedYear}</td>
                          <td className="p-1.5 border border-slate-400">{q.divisionGpa}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 4. Work Experience */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase bg-slate-100 p-1.5 border border-slate-300">
                  4. Work Experience
                </h3>
                <table className="w-full text-xs text-left border border-slate-400 border-collapse">
                  <thead className="bg-slate-200 font-semibold">
                    <tr>
                      <th className="p-1.5 border border-slate-400">#</th>
                      <th className="p-1.5 border border-slate-400">Organization</th>
                      <th className="p-1.5 border border-slate-400">Designation</th>
                      <th className="p-1.5 border border-slate-400">Service Duration</th>
                      <th className="p-1.5 border border-slate-400">Key Responsibilities</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(app.experiences || []).length === 0 ? (
                      <tr><td colSpan={5} className="p-2 text-center text-slate-500">No entries</td></tr>
                    ) : (
                      app.experiences.map((exp: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-1.5 border border-slate-400 text-center">{idx + 1}</td>
                          <td className="p-1.5 border border-slate-400 font-semibold">{exp.organization}</td>
                          <td className="p-1.5 border border-slate-400">{exp.designation}</td>
                          <td className="p-1.5 border border-slate-400 font-mono text-[11px]">
                            {exp.periodFrom} to {exp.periodTo || 'Present'}
                          </td>
                          <td className="p-1.5 border border-slate-400 whitespace-pre-line">{exp.responsibilities}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 5. Documents & Verification Status */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase bg-slate-100 p-1.5 border border-slate-300">
                  5. Attached Verification Documents
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(app.documents || []).map((doc: any) => (
                    <div key={doc.id} className="p-1.5 border border-slate-300 rounded bg-slate-50 flex justify-between">
                      <span>✓ {doc.title || doc.fileName}</span>
                      <span className="font-mono text-[10px] text-slate-600">[{doc.docType}]</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Verification Audit Section */}
              <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p><strong>Applicant Signature:</strong> .................................................</p>
                  <p><strong>Date:</strong> {new Date(app.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-400 rounded space-y-1">
                  <p className="font-bold text-slate-900 border-b pb-1 mb-1">OFFICIAL VERIFICATION PANEL</p>
                  <p><strong>Status:</strong> <span className="font-bold">{app.status}</span></p>
                  <p><strong>Verified By:</strong> {app.verifiedBy || 'Pending'}</p>
                  <p><strong>Verification Date:</strong> {app.verifiedAt ? new Date(app.verifiedAt).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Verification Remarks:</strong> {app.remarks || 'None'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminPrintPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Printable Document...</div>}>
      <AdminPrintContent />
    </Suspense>
  );
}
