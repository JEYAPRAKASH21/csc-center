import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ApplicationRecord, ApplicationStatus } from '../types';
import { 
  FileCheck2, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Printer, 
  Edit, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  User,
  Phone,
  FileText,
  X,
  Sliders
} from 'lucide-react';

export const TrackerView: React.FC = () => {
  const { 
    applications, 
    addApplication, 
    updateApplication,
    updateAppStatus, 
    deleteApplication, 
    addToCart, 
    services, 
    setActiveTab 
  } = useApp();

  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState<ApplicationRecord | null>(null);
  const [showEditModal, setShowEditModal] = useState<ApplicationRecord | null>(null);

  // New / Edit App Form State
  const [ackNumber, setAckNumber] = useState<string>('');
  const [serviceName, setServiceName] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [govFee, setGovFee] = useState<string>('30');
  const [serviceCharge, setServiceCharge] = useState<string>('30');
  const [remarks, setRemarks] = useState<string>('');

  // Update Status Form State
  const [updateStatus, setUpdateStatus] = useState<ApplicationStatus>('pending');
  const [updateRemarks, setUpdateRemarks] = useState<string>('');

  const statusBadges: Record<ApplicationStatus, { label: string; bg: string; text: string; border: string }> = {
    pending: { label: 'Pending VAO/RI', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    processing: { label: 'In Processing', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    approved: { label: 'Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    ready_for_print: { label: 'Ready for Print', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    delivered: { label: 'Delivered', bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700' },
    rejected: { label: 'Rejected', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  };

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesStatus = selectedStatus === 'all' || app.status === selectedStatus;
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        app.ackNumber.toLowerCase().includes(q) || 
        app.customerName.toLowerCase().includes(q) || 
        app.customerPhone.includes(q) ||
        app.serviceName.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [applications, selectedStatus, searchQuery]);

  const handleCreateApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ackNumber.trim() || !serviceName.trim() || !customerName.trim()) return;

    addApplication({
      ackNumber: ackNumber.trim().toUpperCase(),
      serviceName: serviceName.trim(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || 'N/A',
      appliedDate: new Date().toISOString(),
      status: 'pending',
      statusUpdateDate: new Date().toISOString(),
      govFeePaid: parseFloat(govFee) || 0,
      serviceCharge: parseFloat(serviceCharge) || 0,
      remarks: remarks.trim() || undefined,
    });

    resetForm();
    setShowAddModal(false);
  };

  const openEditModal = (app: ApplicationRecord) => {
    setShowEditModal(app);
    setAckNumber(app.ackNumber);
    setServiceName(app.serviceName);
    setCustomerName(app.customerName);
    setCustomerPhone(app.customerPhone);
    setGovFee(app.govFeePaid.toString());
    setServiceCharge(app.serviceCharge.toString());
    setRemarks(app.remarks || '');
  };

  const handleSaveEditApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal || !ackNumber.trim() || !serviceName.trim() || !customerName.trim()) return;

    updateApplication(showEditModal.id, {
      ackNumber: ackNumber.trim().toUpperCase(),
      serviceName: serviceName.trim(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || 'N/A',
      govFeePaid: parseFloat(govFee) || 0,
      serviceCharge: parseFloat(serviceCharge) || 0,
      remarks: remarks.trim() || undefined,
    });

    resetForm();
    setShowEditModal(null);
  };

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showUpdateStatusModal) return;

    updateAppStatus(showUpdateStatusModal.id, updateStatus, updateRemarks);
    setShowUpdateStatusModal(null);
  };

  const resetForm = () => {
    setAckNumber('');
    setServiceName('');
    setCustomerName('');
    setCustomerPhone('');
    setGovFee('30');
    setServiceCharge('30');
    setRemarks('');
  };

  const handleBillApplication = (app: ApplicationRecord) => {
    const matchedService = services.find((s) => s.name.toLowerCase() === app.serviceName.toLowerCase()) || {
      id: `app-srv-${app.id}`,
      name: app.serviceName,
      category: 'esevai' as const,
      price: app.govFeePaid + app.serviceCharge,
      unit: 'per app'
    };

    addToCart(matchedService, 1, app.ackNumber);
    setActiveTab('pos');
  };

  return (
    <div className="space-y-5 h-full overflow-y-auto pr-1">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#121827] border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-amber-400" /> E-Sevai Application Status Tracker (CRUD)
          </h2>
          <p className="text-xs text-slate-400">
            Log, update, edit, or delete application acknowledgment records ({applications.length} total applications).
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> Log Application
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Ack #, Name, Mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0b0f19] border border-slate-800 focus:border-amber-500 text-slate-100 text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none font-medium"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedStatus === 'all'
                ? 'bg-amber-500 text-slate-950 shadow font-bold'
                : 'bg-[#0b0f19] border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All ({applications.length})
          </button>
          {(['pending', 'processing', 'approved', 'ready_for_print', 'delivered', 'rejected'] as ApplicationStatus[]).map((st) => {
            const count = applications.filter((a) => a.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap capitalize transition ${
                  selectedStatus === st
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-[#0b0f19] border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st.replace(/_/g, ' ')} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Application Cards Grid */}
      {filteredApplications.length === 0 ? (
        <div className="bg-[#121827] border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          <FileCheck2 className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-400">No application records found</p>
          <p className="text-xs text-slate-500 mt-1">Click "Log Application" to create a new tracking record.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApplications.map((app) => {
            const badge = statusBadges[app.status];

            return (
              <div
                key={app.id}
                className="bg-[#121827] border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition duration-200 shadow-xl group"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-amber-400 tracking-wider">
                      {app.ackNumber}
                    </span>
                    <h4 className="font-bold text-slate-100 text-sm mt-0.5">{app.serviceName}</h4>
                  </div>

                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${badge.bg} ${badge.text} ${badge.border} whitespace-nowrap`}>
                    {badge.label}
                  </span>
                </div>

                {/* Citizen Metadata */}
                <div className="bg-[#0b0f19] p-2.5 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-semibold">{app.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{app.customerPhone}</span>
                  </div>
                  {app.remarks && (
                    <p className="text-[11px] text-amber-300/90 pt-1 border-t border-slate-800/80 italic">
                      "{app.remarks}"
                    </p>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-500">
                    {new Date(app.appliedDate).toLocaleDateString('en-IN')}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Status Update Button */}
                    <button
                      onClick={() => {
                        setShowUpdateStatusModal(app);
                        setUpdateStatus(app.status);
                        setUpdateRemarks(app.remarks || '');
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                      title="Update Status & Remarks"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit Details Button */}
                    <button
                      onClick={() => openEditModal(app)}
                      className="p-1.5 bg-csc-600/20 hover:bg-csc-600 text-csc-300 hover:text-white rounded-lg transition"
                      title="Edit Application Details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {/* Bill Now */}
                    <button
                      onClick={() => handleBillApplication(app)}
                      className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 rounded-lg text-[11px] font-bold transition"
                    >
                      <Printer className="w-3.5 h-3.5" /> Bill
                    </button>

                    {/* Delete Application */}
                    <button
                      onClick={() => {
                        if (confirm(`Delete acknowledgment record ${app.ackNumber}?`)) {
                          deleteApplication(app.id);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                      title="Delete Application"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LOG NEW APPLICATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-amber-400" /> Log Application Acknowledgment
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateApp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Acknowledgment / Application Number *</label>
                <input
                  type="text"
                  required
                  placeholder="TN-2026-0812-XXXX"
                  value={ackNumber}
                  onChange={(e) => setAckNumber(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 focus:border-amber-500 text-slate-100 font-mono text-xs rounded-xl p-3 outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Service Type *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Income Certificate / PAN Card"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 focus:border-amber-500 text-slate-100 text-xs rounded-xl p-3 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Citizen Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-slate-800 text-slate-100 text-xs rounded-xl p-3 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    placeholder="9876543210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-slate-800 text-slate-100 font-mono text-xs rounded-xl p-3 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Status Remarks (Optional)</label>
                <input
                  type="text"
                  placeholder="Pending RI verification..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 text-slate-100 text-xs rounded-xl p-3 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl shadow"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT APPLICATION MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-csc-400" /> Edit Application Record
              </h3>
              <button onClick={() => setShowEditModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditApp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Acknowledgment Number *</label>
                <input
                  type="text"
                  required
                  value={ackNumber}
                  onChange={(e) => setAckNumber(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 text-slate-100 font-mono text-xs rounded-xl p-3 outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Service Type *</label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 text-slate-100 text-xs rounded-xl p-3 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-slate-800 text-slate-100 text-xs rounded-xl p-3 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-slate-800 text-slate-100 font-mono text-xs rounded-xl p-3 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 text-slate-100 text-xs rounded-xl p-3 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-csc-600 hover:bg-csc-500 text-white text-xs font-extrabold rounded-xl shadow"
                >
                  Update Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {showUpdateStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Update Application Status</h3>
              <button onClick={() => setShowUpdateStatusModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-amber-400 font-mono">{showUpdateStatusModal.ackNumber} - {showUpdateStatusModal.customerName}</p>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Select New Status</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value as ApplicationStatus)}
                  className="w-full bg-[#0b0f19] border border-slate-800 text-slate-100 text-xs rounded-xl p-3 outline-none capitalize font-semibold"
                >
                  <option value="pending">Pending VAO/RI</option>
                  <option value="processing">In Processing</option>
                  <option value="approved">Approved</option>
                  <option value="ready_for_print">Ready for Print</option>
                  <option value="delivered">Delivered</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Update Notes / Remarks</label>
                <textarea
                  rows={3}
                  value={updateRemarks}
                  onChange={(e) => setUpdateRemarks(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 text-slate-100 text-xs rounded-xl p-3 outline-none"
                  placeholder="Add notes e.g., Certificate signed by Tahsildar."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpdateStatusModal(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
