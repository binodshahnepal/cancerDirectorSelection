'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Swal from 'sweetalert2';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'applications' | 'users'>('applications');
  
  // Applications state
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, pending: 0, approved: 0, rejected: 0, drafts: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [remarks, setRemarks] = useState('');

  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>({ totalUsers: 0, totalApplicants: 0, totalAdmins: 0 });
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.role !== 'ADMIN') {
          router.push('/login');
          return;
        }
        setUser(data.user);
        fetchApplications();
        fetchUsers();
      })
      .catch(() => router.push('/login'));
  }, []);

  const fetchApplications = async (queryStr = search, statusStr = statusFilter) => {
    try {
      const url = `/api/admin/applications?q=${encodeURIComponent(queryStr)}&status=${encodeURIComponent(statusStr)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.applications) {
        setApplications(data.applications);
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (queryStr = userSearch, roleStr = userRoleFilter) => {
    try {
      const url = `/api/admin/users?q=${encodeURIComponent(queryStr)}&role=${encodeURIComponent(roleStr)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
        setUserStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUserSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserSearch(val);
    fetchUsers(val, userRoleFilter);
  };

  const handleUserRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setUserRoleFilter(val);
    fetchUsers(userSearch, val);
  };

  const handleDeleteUser = async (targetUser: any) => {
    if (targetUser.id === user?.id) {
      Swal.fire({
        icon: 'warning',
        title: 'Action Prohibited',
        text: 'You cannot delete your own logged-in admin account!'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Delete User Account?',
      html: `Are you sure you want to delete user account <strong>${targetUser.name} (${targetUser.email})</strong>?<br/><span class="text-xs text-red-600 font-bold mt-1.5 block">⚠️ This will delete their account and any linked applications/documents permanently.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete Account',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(targetUser.id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        fetchApplications();
        Swal.fire({
          icon: 'success',
          title: 'User Deleted',
          text: 'The user account has been deleted successfully.',
          confirmButtonColor: '#2563eb'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: data.error || 'Failed to delete user'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error deleting user account'
      });
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    fetchApplications(val, statusFilter);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setStatusFilter(val);
    fetchApplications(search, val);
  };

  const handleVerify = async (status: 'APPROVED' | 'REJECTED', customRemarks?: string, targetApp?: any) => {
    const appToVerify = targetApp || selectedApp;
    if (!appToVerify) return;
    setVerifying(true);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appToVerify.id,
          status,
          remarks: customRemarks !== undefined ? customRemarks : remarks
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedApp(null);
        setRemarks('');
        fetchApplications();
        if (status === 'APPROVED') {
          Swal.fire({
            icon: 'success',
            title: 'Application Approved!',
            text: `Application for ${appToVerify.applicantNameEn || 'applicant'} has been approved.`,
            confirmButtonColor: '#059669'
          });
        } else {
          Swal.fire({
            icon: 'info',
            title: 'Application Rejected',
            text: `Application for ${appToVerify.applicantNameEn || 'applicant'} has been rejected and the rejection reason was saved.`,
            confirmButtonColor: '#dc2626'
          });
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Verification Failed',
          text: data.error || 'Failed to update application status'
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error processing application status'
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleApproveWithPrompt = async (appTarget?: any) => {
    const target = appTarget || selectedApp;
    if (!target) return;

    const result = await Swal.fire({
      title: 'Approve Application',
      text: `Confirm approval for applicant: ${target.applicantNameEn || target.user?.name || target.appNo}`,
      icon: 'question',
      input: 'textarea',
      inputLabel: 'Official Verification / Approval Remarks (Optional)',
      inputValue: remarks || target.remarks || '',
      inputPlaceholder: 'Enter any official remarks, eligibility notes, or interview instructions...',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#64748b',
      confirmButtonText: '✅ Approve Application',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      handleVerify('APPROVED', result.value || '', target);
    }
  };

  const handleRejectWithPrompt = async (appTarget?: any) => {
    const target = appTarget || selectedApp;
    if (!target) return;

    const result = await Swal.fire({
      title: 'Reject Application',
      html: `Please enter the <strong>reason for rejection</strong> for <strong>${target.applicantNameEn || target.user?.name || target.appNo}</strong>.<br/><span class="text-xs text-red-600 mt-1 block">This reason will be directly displayed to the applicant on their dashboard.</span>`,
      icon: 'warning',
      input: 'textarea',
      inputLabel: 'Rejection Reason (Required)',
      inputValue: remarks || target.remarks || '',
      inputPlaceholder: 'e.g., Council registration document is expired. Work experience criteria not met.',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'You must enter a reason for rejecting this application!';
        }
      },
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: '❌ Confirm Rejection',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      handleVerify('REJECTED', result.value.trim(), target);
    }
  };

  const handleDelete = async (appId: string, appName?: string) => {
    const result = await Swal.fire({
      title: 'Delete Application & Account?',
      html: `Are you sure you want to permanently delete the application for <strong>${appName || 'this applicant'}</strong>?<br/><span class="text-xs text-red-600 font-bold mt-1.5 block">⚠️ This will delete their user account, application, and all uploaded documents.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete Permanently',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/applications?id=${encodeURIComponent(appId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        if (selectedApp?.id === appId) {
          setSelectedApp(null);
        }
        fetchApplications();
        Swal.fire({
          icon: 'success',
          title: 'Deleted Successfully',
          text: 'The application and user account have been deleted. The applicant will be notified upon login.',
          confirmButtonColor: '#2563eb'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: data.error || 'Failed to delete application'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error deleting application'
      });
    }
  };

  const handlePrintIndividual = (appId: string) => {
    window.open(`/admin/print?id=${encodeURIComponent(appId)}`, '_blank');
  };

  const handlePrintAll = () => {
    window.open(`/admin/print?all=true&status=${encodeURIComponent(statusFilter)}&q=${encodeURIComponent(search)}`, '_blank');
  };

  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const handleMergePdf = (appId: string) => {
    window.open(`/api/admin/merge-pdf?id=${encodeURIComponent(appId)}`, '_blank');
  };

  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName || !adminEmail || !adminPassword) return;
    setCreatingAdmin(true);
    try {
      const res = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: adminName,
          email: adminEmail,
          password: adminPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateAdminModal(false);
        setAdminName('');
        setAdminEmail('');
        setAdminPassword('');
        Swal.fire({
          icon: 'success',
          title: 'Administrator Account Created!',
          text: `New admin account (${adminEmail}) was created successfully.`,
          confirmButtonColor: '#059669'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to Create Admin',
          text: data.error || 'Could not create administrator account'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An unexpected error occurred while creating admin account.'
      });
    } finally {
      setCreatingAdmin(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-500">Loading Administrator Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-6">
        
        {/* HEADER & TOP ACTIONS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-extrabold rounded-full">
                🛡️ Administrator Access
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Recruitment Verification Portal
            </h2>
            <p className="text-xs text-slate-500">Executive Director Position | B.P. Koirala Memorial Cancer Hospital</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            <button
              onClick={() => window.open(`/api/admin/export-excel?status=${encodeURIComponent(statusFilter)}&q=${encodeURIComponent(search)}`, '_blank')}
              className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              title="Download Candidates Data Report in Excel/CSV format"
            >
              <span>📊 Export Candidates Excel</span>
            </button>
            <button
              onClick={() => setShowCreateAdminModal(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>➕ Create New Admin</span>
            </button>
            <button
              onClick={handlePrintAll}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>🖨️ Print All Applications ({applications.length})</span>
            </button>
          </div>
        </div>

        {/* VIEW NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs md:text-sm transition-all flex items-center gap-2 ${
              activeTab === 'applications'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>📋 Applications Verification</span>
            <span className={`px-2 py-0.5 text-[11px] rounded-full font-black ${
              activeTab === 'applications' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {stats.total}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs md:text-sm transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>👥 All Registered Users</span>
            <span className={`px-2 py-0.5 text-[11px] rounded-full font-black ${
              activeTab === 'users' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {userStats.totalUsers}
            </span>
          </button>
        </div>

        {activeTab === 'applications' ? (
          <>
            {/* METRICS STATS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1 hover:border-slate-300 transition-all">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Applicants</span>
                <p className="text-3xl font-black text-slate-900">{stats.total}</p>
              </div>

              <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-5 shadow-sm space-y-1 hover:border-blue-300 transition-all">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Pending Review</span>
                <p className="text-3xl font-black text-blue-900">{stats.pending}</p>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-1 hover:border-emerald-300 transition-all">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Approved</span>
                <p className="text-3xl font-black text-emerald-900">{stats.approved}</p>
              </div>

              <div className="bg-red-50/50 border border-red-200 rounded-2xl p-5 shadow-sm space-y-1 hover:border-red-300 transition-all">
                <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Rejected</span>
                <p className="text-3xl font-black text-red-900">{stats.rejected}</p>
              </div>

              <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-1 col-span-2 md:col-span-1 hover:border-amber-300 transition-all">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Drafts</span>
                <p className="text-3xl font-black text-amber-900">{stats.drafts}</p>
              </div>
            </div>

            {/* SEARCH & FILTER TOOLBAR */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                  🔍
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search applicant by Name, Citizenship No., District, App No..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="w-full md:w-56">
                <select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 focus:ring-2 focus:ring-blue-600 font-semibold"
                >
                  <option value="ALL">All Statuses ({stats.total})</option>
                  <option value="SUBMITTED">Pending Review ({stats.pending})</option>
                  <option value="APPROVED">Approved ({stats.approved})</option>
                  <option value="REJECTED">Rejected ({stats.rejected})</option>
                  <option value="DRAFT">Draft ({stats.drafts})</option>
                </select>
              </div>
            </div>

            {/* APPLICANTS TABLE */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-800 uppercase font-extrabold text-[11px] tracking-wider">
                    <tr>
                      <th className="p-4 border-b border-slate-200">App No</th>
                      <th className="p-4 border-b border-slate-200">Applicant Name</th>
                      <th className="p-4 border-b border-slate-200">Citizenship No</th>
                      <th className="p-4 border-b border-slate-200">Province & District</th>
                      <th className="p-4 border-b border-slate-200">Status</th>
                      <th className="p-4 border-b border-slate-200 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {applications.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                          No applicant records match your search criteria.
                        </td>
                      </tr>
                    ) : (
                      applications.map((app) => {
                        const appPhoto = app.documents?.find((d: any) => (d.docType || '').toUpperCase() === 'PHOTO');
                        return (
                        <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-900">{app.appNo}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {appPhoto ? (
                                <img
                                  src={appPhoto.filePath}
                                  alt="Applicant Photo"
                                  className="w-9 h-9 rounded-full object-cover border border-blue-400 shadow-sm shrink-0 bg-white"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs shadow-inner shrink-0">
                                  {(app.applicantNameEn || app.user?.name || 'A')[0].toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900">{app.applicantNameEn || app.user?.name || 'Incomplete'}</div>
                                <div className="text-[11px] text-slate-500 font-medium">{app.user?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-medium">{app.citizenshipNo || '-'}</td>
                          <td className="p-4 font-medium">
                            {app.permDistrict ? `${app.permDistrict} (${app.permProvince || ''})` : '-'}
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase shadow-sm whitespace-nowrap ${
                                app.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : app.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-800 border border-red-300'
                                  : app.status === 'SUBMITTED'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
                              <span>{app.status === 'SUBMITTED' ? 'SUBMITTED' : app.status}</span>
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handlePrintIndividual(app.id)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs transition-all flex items-center gap-1"
                              >
                                <span>🖨️ Print</span>
                              </button>
                              <button
                                onClick={() => handleMergePdf(app.id)}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs transition-all flex items-center gap-1"
                                title="Merge Application & Uploaded Documents into single PDF"
                              >
                                <span>📦 Merged PDF</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedApp(app);
                                  setRemarks(app.remarks || '');
                                }}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm"
                              >
                                Inspect Profile
                              </button>
                              <button
                                onClick={() => handleDelete(app.id, app.applicantNameEn || app.user?.name)}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-bold text-xs transition-all flex items-center gap-1"
                                title="Delete Application & Account"
                              >
                                <span>🗑️ Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* METRICS STATS CARDS FOR USERS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1 hover:border-slate-300 transition-all">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Registered Accounts</span>
                <p className="text-3xl font-black text-slate-900">{userStats.totalUsers}</p>
              </div>

              <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-5 shadow-sm space-y-1 hover:border-blue-300 transition-all">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Registered Applicants</span>
                <p className="text-3xl font-black text-blue-900">{userStats.totalApplicants}</p>
              </div>

              <div className="bg-purple-50/50 border border-purple-200 rounded-2xl p-5 shadow-sm space-y-1 hover:border-purple-300 transition-all">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">System Administrators</span>
                <p className="text-3xl font-black text-purple-900">{userStats.totalAdmins}</p>
              </div>
            </div>

            {/* SEARCH & FILTER TOOLBAR FOR USERS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                  🔍
                </span>
                <input
                  type="text"
                  value={userSearch}
                  onChange={handleUserSearchChange}
                  placeholder="Search user by Name or Email address..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="w-full md:w-56">
                <select
                  value={userRoleFilter}
                  onChange={handleUserRoleFilterChange}
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 focus:ring-2 focus:ring-blue-600 font-semibold"
                >
                  <option value="ALL">All System Roles ({userStats.totalUsers})</option>
                  <option value="APPLICANT">Applicants Only ({userStats.totalApplicants})</option>
                  <option value="ADMIN">Administrators Only ({userStats.totalAdmins})</option>
                </select>
              </div>
            </div>

            {/* REGISTERED USERS TABLE */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-800 uppercase font-extrabold text-[11px] tracking-wider">
                    <tr>
                      <th className="p-4 border-b border-slate-200">Registered User</th>
                      <th className="p-4 border-b border-slate-200">System Role</th>
                      <th className="p-4 border-b border-slate-200">Application Status</th>
                      <th className="p-4 border-b border-slate-200">Registered On</th>
                      <th className="p-4 border-b border-slate-200 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                          No registered user accounts match your search criteria.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => {
                        const userApp = u.applications && u.applications.length > 0 ? u.applications[0] : null;
                        const userPhoto = userApp?.documents?.find((d: any) => (d.docType || '').toUpperCase() === 'PHOTO');
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {userPhoto ? (
                                  <img
                                    src={userPhoto.filePath}
                                    alt="User Photo"
                                    className="w-9 h-9 rounded-full object-cover border border-purple-400 shadow-sm shrink-0 bg-white"
                                  />
                                ) : (
                                  <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shadow-inner shrink-0 ${
                                    u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {(u.name || 'U')[0].toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-slate-900">{u.name}</div>
                                  <div className="text-[11px] text-slate-500 font-medium">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase shadow-sm ${
                                u.role === 'ADMIN'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                  : 'bg-blue-100 text-blue-800 border border-blue-300'
                              }`}>
                                {u.role === 'ADMIN' ? '🛡️ ADMIN' : '👤 APPLICANT'}
                              </span>
                            </td>
                            <td className="p-4">
                              {userApp ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-slate-900">{userApp.appNo}</span>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                    userApp.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                    userApp.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                    userApp.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {userApp.status}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-xs">No application initiated yet</span>
                              )}
                            </td>
                            <td className="p-4 text-slate-600 font-medium text-xs">
                              {new Date(u.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                {userApp && (
                                  <button
                                    onClick={() => {
                                      const fullApp = applications.find(a => a.id === userApp.id);
                                      if (fullApp) {
                                        setSelectedApp(fullApp);
                                        setRemarks(fullApp.remarks || '');
                                      } else {
                                        fetch(`/api/admin/applications?q=${encodeURIComponent(userApp.appNo)}`)
                                          .then(r => r.json())
                                          .then(d => {
                                            if (d.applications && d.applications.length > 0) {
                                              setSelectedApp(d.applications[0]);
                                              setRemarks(d.applications[0].remarks || '');
                                            }
                                          });
                                      }
                                    }}
                                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm"
                                  >
                                    Inspect App
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-bold text-xs transition-all flex items-center gap-1"
                                  title="Delete User Account & Data"
                                >
                                  <span>🗑️ Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* APPLICANT DETAIL INSPECTOR MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-8 shadow-2xl space-y-5 sm:space-y-6">
            
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-4">
                {(() => {
                  const modalPhoto = selectedApp.documents?.find((d: any) => (d.docType || '').toUpperCase() === 'PHOTO');
                  return modalPhoto ? (
                    <img
                      src={modalPhoto.filePath}
                      alt="Applicant Photo"
                      className="w-14 h-18 object-cover rounded-xl border-2 border-blue-600 shadow-md shrink-0 bg-white"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-lg shadow-inner shrink-0">
                      {(selectedApp.applicantNameEn || selectedApp.user?.name || 'A')[0].toUpperCase()}
                    </div>
                  );
                })()}
                <div>
                  <span className="text-xs font-mono bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-blue-800 font-bold">
                    {selectedApp.appNo}
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1.5">
                    {selectedApp.applicantNameEn || selectedApp.user?.name}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
                <button
                  onClick={() => handleMergePdf(selectedApp.id)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                  title="Merge Application Sheet and all Attached Files into single PDF"
                >
                  <span>📦 Merged PDF Dossier</span>
                </button>
                <button
                  onClick={() => handlePrintIndividual(selectedApp.id)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <span>🖨️ Print Application Sheet</span>
                </button>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h4 className="font-extrabold text-blue-900 text-sm mb-3 flex items-center gap-1.5">
                  <span>👤</span> Personal Information
                </h4>
                <p><strong>Full Name:</strong> {selectedApp.applicantNameEn}</p>
                <p><strong>Date of Birth:</strong> {selectedApp.dob} (Age: {selectedApp.age})</p>
                <p><strong>Gender:</strong> {selectedApp.gender}</p>
                <p><strong>Citizenship No.:</strong> {selectedApp.citizenshipNo} (Issue District: {selectedApp.citizenshipDistrict})</p>
                <p><strong>Father's Name:</strong> {selectedApp.fatherName}</p>
                <p><strong>Mother's Name:</strong> {selectedApp.motherName}</p>
                <p><strong>Grandfather's Name:</strong> {selectedApp.grandfatherName}</p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h4 className="font-extrabold text-blue-900 text-sm mb-3 flex items-center gap-1.5">
                  <span>📍</span> Location & Addresses
                </h4>
                <p><strong>Province:</strong> {selectedApp.permProvince}</p>
                <p><strong>District:</strong> {selectedApp.permDistrict}</p>
                <p><strong>Local Body:</strong> {selectedApp.permLocalBody}</p>
                <p><strong>Ward & Tole:</strong> Ward #{selectedApp.permWard} ({selectedApp.permTole})</p>
                <p><strong>Contact Phone:</strong> {selectedApp.permPhone}</p>
                <p><strong>Email Address:</strong> {selectedApp.permEmail || selectedApp.user?.email}</p>
              </div>
            </div>

            {/* Work Experience Section */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <h4 className="font-extrabold text-xs text-blue-900 flex items-center gap-1.5">
                <span>💼</span> Work Experience Entries
              </h4>
              <div className="space-y-2 text-xs">
                {(selectedApp.experiences || []).length === 0 ? (
                  <p className="text-slate-500">No work experience entries submitted.</p>
                ) : (
                  selectedApp.experiences.map((exp: any, idx: number) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{exp.organization} — {exp.designation}</span>
                        <span className="font-mono text-[11px] text-blue-700">{exp.periodFrom} to {exp.periodTo || 'Present'}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] whitespace-pre-line">{exp.responsibilities}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Uploaded Documents List */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <h4 className="font-extrabold text-xs text-blue-900 flex items-center gap-1.5">
                <span>📁</span> Uploaded Verification Documents
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                {(selectedApp.documents || []).length === 0 ? (
                  <p className="text-slate-500">No verification documents uploaded yet.</p>
                ) : (
                  selectedApp.documents.map((doc: any) => (
                    <a
                      key={doc.id}
                      href={doc.filePath}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center text-blue-700 hover:text-blue-900 font-bold shadow-sm transition-all"
                    >
                      <span className="truncate max-w-[200px]">📄 {doc.title || doc.fileName}</span>
                      <span className="text-[10px] bg-blue-50 px-2 py-0.5 rounded text-blue-800 border border-blue-200">View File</span>
                    </a>
                  ))
                )}
              </div>
            </div>

            {/* Official Verification & Control Panel */}
            <div className="p-6 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-4">
              <h4 className="font-extrabold text-sm text-blue-900 flex items-center gap-2">
                🛡️ Verification & Approval Control
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Official Verification Remarks</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter official verification remarks or decision rationale..."
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                ></textarea>
              </div>

              {selectedApp.verifiedBy && (
                <div className="text-[11px] text-slate-600">
                  Last verified by: <strong className="text-slate-900">{selectedApp.verifiedBy}</strong> on {new Date(selectedApp.verifiedAt).toLocaleString()}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleApproveWithPrompt(selectedApp)}
                  disabled={verifying}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {verifying ? 'Updating...' : '✅ Approve Application'}
                </button>
                <button
                  type="button"
                  onClick={() => handleRejectWithPrompt(selectedApp)}
                  disabled={verifying}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {verifying ? 'Updating...' : '❌ Reject Application'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(selectedApp.id, selectedApp.applicantNameEn || selectedApp.user?.name)}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span>🗑️ Delete Application</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CREATE NEW ADMIN MODAL */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-sm">🛡️</span>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Create New Administrator</h3>
                  <p className="text-xs text-slate-500">Grant administrator access to team member</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateAdminModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center shrink-0"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Administrator Full Name *</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Dr. Ram Sharma"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Email Address *</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin.name@bkmch.gov.np"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateAdminModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {creatingAdmin ? 'Creating...' : '➕ Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
