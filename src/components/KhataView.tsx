import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CustomerCredit } from '../types';
import { 
  BookUser, 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Edit,
  Trash2,
  X,
  CreditCard
} from 'lucide-react';

export const KhataView: React.FC = () => {
  const { 
    khata, 
    addKhataCustomer, 
    updateKhataCustomer, 
    deleteKhataCustomer, 
    recordKhataPayment, 
    addKhataDebit 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerCredit | null>(khata[0] || null);

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showDebitModal, setShowDebitModal] = useState<boolean>(false);

  // Form State
  const [custName, setCustName] = useState<string>('');
  const [custPhone, setCustPhone] = useState<string>('');
  const [payAmount, setPayAmount] = useState<string>('');
  const [payNote, setPayNote] = useState<string>('');
  const [debitAmount, setDebitAmount] = useState<string>('');
  const [debitDesc, setDebitDesc] = useState<string>('');

  const totalOutstandingAll = khata.reduce((sum, c) => sum + c.totalOutstanding, 0);

  const filteredKhata = useMemo(() => {
    return khata.filter((c) => {
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.phone.includes(q);
    });
  }, [khata, searchQuery]);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;
    addKhataCustomer(custName.trim(), custPhone.trim() || 'N/A');
    setCustName('');
    setCustPhone('');
    setShowAddCustomerModal(false);
  };

  const handleEditCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !custName.trim()) return;
    updateKhataCustomer(selectedCustomer.id, custName.trim(), custPhone.trim() || 'N/A');
    setShowEditCustomerModal(false);
  };

  const handleDeleteCustomer = () => {
    if (!selectedCustomer) return;
    if (window.confirm(`Are you sure you want to delete khata account for "${selectedCustomer.name}"?`)) {
      deleteKhataCustomer(selectedCustomer.id);
      setSelectedCustomer(null);
    }
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !payAmount) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) return;

    recordKhataPayment(selectedCustomer.id, amt, payNote);
    setPayAmount('');
    setPayNote('');
    setShowPaymentModal(false);
  };

  const handleAddDebit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !debitAmount) return;
    const amt = parseFloat(debitAmount);
    if (isNaN(amt) || amt <= 0) return;

    addKhataDebit(selectedCustomer.id, amt, debitDesc);
    setDebitAmount('');
    setDebitDesc('');
    setShowDebitModal(false);
  };

  return (
    <div className="space-y-5 h-full overflow-y-auto pr-1">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#121827] border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookUser className="w-5 h-5 text-rose-400" /> Customer Credit Ledger (Khata Book CRUD)
          </h2>
          <p className="text-xs text-slate-400">
            Create customer credit accounts, record payments, add manual charges, edit details, or delete accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-3.5 py-1.5 text-right">
            <p className="text-[10px] font-bold text-rose-300 uppercase">Total Pending Dues</p>
            <p className="text-sm font-extrabold text-rose-400 font-mono">₹{totalOutstandingAll.toLocaleString('en-IN')}</p>
          </div>

          <button
            onClick={() => {
              setCustName('');
              setCustPhone('');
              setShowAddCustomerModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Add Khata Account
          </button>
        </div>
      </div>

      {/* Main Grid: Left Customer List, Right Statement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left: Customer List */}
        <div className="bg-[#121827] border border-slate-800 rounded-2xl p-4 flex flex-col space-y-3 shadow-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0b0f19] border border-slate-800 focus:border-rose-500 text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none font-medium"
            />
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-[480px]">
            {filteredKhata.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No khata accounts found.</p>
            ) : (
              filteredKhata.map((cust) => (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomer(cust)}
                  className={`p-3 rounded-xl cursor-pointer transition border flex items-center justify-between ${
                    selectedCustomer?.id === cust.id
                      ? 'bg-[#1a233a] border-rose-500/50 shadow-md'
                      : 'bg-[#0b0f19] border-slate-800 hover:bg-slate-800/50'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-slate-100 text-xs">{cust.name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{cust.phone}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-400 font-mono">
                      ₹{cust.totalOutstanding}
                    </span>
                    <p className="text-[9px] text-slate-500">due</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Selected Customer Statement */}
        <div className="md:col-span-2 bg-[#121827] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          {selectedCustomer ? (
            <div className="space-y-4">
              {/* Account Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedCustomer.name}</h3>
                    <button
                      onClick={() => {
                        setCustName(selectedCustomer.name);
                        setCustPhone(selectedCustomer.phone);
                        setShowEditCustomerModal(true);
                      }}
                      className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                      title="Edit Customer Details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleDeleteCustomer}
                      className="p-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition"
                      title="Delete Khata Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-1">Phone: {selectedCustomer.phone}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Outstanding</p>
                    <p className="text-lg font-extrabold text-rose-400 font-mono">₹{selectedCustomer.totalOutstanding}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowDebitModal(true)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-bold text-xs rounded-xl transition"
                      title="Add Manual Charge / Credit Entry"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> + Charge
                    </button>

                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition"
                    >
                      <ArrowDownLeft className="w-4 h-4" /> Receive Pay
                    </button>
                  </div>
                </div>
              </div>

              {/* Transaction History Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-csc-400" /> Account Activity Log
                </h4>

                <div className="space-y-2 max-h-[360px] overflow-y-auto">
                  {selectedCustomer.history.length === 0 ? (
                    <p className="text-xs text-slate-500 py-8 text-center">No transactions recorded yet.</p>
                  ) : (
                    selectedCustomer.history.map((tx) => (
                      <div
                        key={tx.id}
                        className="bg-[#0b0f19] border border-slate-800 p-3 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              tx.type === 'debit'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {tx.type === 'debit' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-slate-200">{tx.description}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {new Date(tx.date).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <span
                            className={`text-sm font-bold ${
                              tx.type === 'debit' ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {tx.type === 'debit' ? '+' : '-'}₹{tx.amount}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-16">
              <BookUser className="w-12 h-12 stroke-[1.5] text-slate-700 mb-2" />
              <p className="text-sm font-semibold">Select or create a customer account to view ledger</p>
            </div>
          )}
        </div>
      </div>

      {/* ADD CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add New Khata Account</h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Customer / Firm Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inspectorate Office / Sri Raman"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 focus:border-rose-500 text-slate-100 text-xs rounded-xl p-3 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Mobile Phone Number</label>
                <input
                  type="text"
                  placeholder="9876543210"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 font-mono text-slate-100 text-xs rounded-xl p-3 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {showEditCustomerModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Edit Customer Account</h3>
              <button onClick={() => setShowEditCustomerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Customer / Firm Name *</label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 focus:border-rose-500 text-slate-100 text-xs rounded-xl p-3 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Mobile Phone Number</label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 font-mono text-slate-100 text-xs rounded-xl p-3 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditCustomerModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-csc-600 hover:bg-csc-500 text-white text-xs font-bold rounded-xl shadow"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIVE PAYMENT MODAL */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Receive Credit Payment</h3>
                <p className="text-xs text-rose-400 font-mono mt-0.5">Customer: {selectedCustomer.name}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Amount Received (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder={`Max ₹${selectedCustomer.totalOutstanding}`}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 focus:border-emerald-500 text-white font-mono text-xs rounded-xl p-3 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Note / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Received via GPay / Cash"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 text-slate-100 text-xs rounded-xl p-3 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MANUAL DEBIT CHARGE MODAL */}
      {showDebitModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Add Charge to Account</h3>
                <p className="text-xs text-rose-400 font-mono mt-0.5">Customer: {selectedCustomer.name}</p>
              </div>
              <button onClick={() => setShowDebitModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDebit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Charge Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 250"
                  value={debitAmount}
                  onChange={(e) => setDebitAmount(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 focus:border-rose-500 text-white font-mono text-xs rounded-xl p-3 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Charge Description / Purpose *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bulk Xerox Copies & Binding"
                  value={debitDesc}
                  onChange={(e) => setDebitDesc(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 text-slate-100 text-xs rounded-xl p-3 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDebitModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow"
                >
                  Add Charge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
