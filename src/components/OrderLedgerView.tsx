import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Bill } from '../types';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { 
  Receipt, 
  Search, 
  RotateCcw, 
  Printer, 
  Trash2, 
  History,
  AlertTriangle,
  X,
  Edit,
  Eye,
  ShoppingBag,
  User,
  Phone,
  Calendar,
  CheckCircle2,
  Download
} from 'lucide-react';

export const OrderLedgerView: React.FC = () => {
  const { bills, updateBill, deleteBill, clearAllBills } = useApp();

  const [viewFilter, setViewFilter] = useState<'all' | 'daily' | 'monthly' | 'yearly'>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // View Items Details Modal
  const [viewingItemsBill, setViewingItemsBill] = useState<Bill | null>(null);

  // Edit Bill Modal
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [editCustName, setEditCustName] = useState<string>('');
  const [editCustPhone, setEditCustPhone] = useState<string>('');
  const [editPayMethod, setEditPayMethod] = useState<Bill['paymentMethod']>('cash');
  const [editNotes, setEditNotes] = useState<string>('');

  // Type-to-Confirm Delete Modal States
  const [deleteModalTarget, setDeleteModalTarget] = useState<'single' | 'all' | null>(null);
  const [targetBillToDelete, setTargetBillToDelete] = useState<Bill | null>(null);
  const [confirmInputText, setConfirmInputText] = useState<string>('');

  // Time metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStr = todayStr.substring(0, 7);
  const thisYearStr = todayStr.substring(0, 4);

  const todaySum = bills.filter((b) => b.date.startsWith(todayStr)).reduce((sum, b) => sum + b.totalAmount, 0);
  const monthSum = bills.filter((b) => b.date.startsWith(thisMonthStr)).reduce((sum, b) => sum + b.totalAmount, 0);
  const yearSum = bills.filter((b) => b.date.startsWith(thisYearStr)).reduce((sum, b) => sum + b.totalAmount, 0);

  // Filter logic
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      let timeMatch = true;
      if (viewFilter === 'daily') timeMatch = b.date.startsWith(todayStr);
      if (viewFilter === 'monthly') timeMatch = b.date.startsWith(thisMonthStr);
      if (viewFilter === 'yearly') timeMatch = b.date.startsWith(thisYearStr);

      let payMatch = true;
      if (paymentFilter !== 'all') payMatch = b.paymentMethod === paymentFilter;

      const q = searchQuery.toLowerCase();
      const searchMatch = 
        b.billNumber.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.includes(q);

      return timeMatch && payMatch && searchMatch;
    });
  }, [bills, viewFilter, paymentFilter, searchQuery, todayStr, thisMonthStr, thisYearStr]);

  const openEditModal = (bill: Bill) => {
    setEditingBill(bill);
    setEditCustName(bill.customerName);
    setEditCustPhone(bill.customerPhone);
    setEditPayMethod(bill.paymentMethod);
    setEditNotes(bill.notes || '');
  };

  const handleSaveEditBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill) return;

    updateBill(editingBill.id, {
      customerName: editCustName.trim() || 'Walk-in Customer',
      customerPhone: editCustPhone.trim() || 'N/A',
      paymentMethod: editPayMethod,
      notes: editNotes.trim() || undefined,
    });

    setEditingBill(null);
  };

  // Open single delete modal
  const openSingleDeleteModal = (bill: Bill) => {
    setTargetBillToDelete(bill);
    setDeleteModalTarget('single');
    setConfirmInputText('');
  };

  // Open delete all modal
  const openDeleteAllModal = () => {
    setTargetBillToDelete(null);
    setDeleteModalTarget('all');
    setConfirmInputText('');
  };

  const closeDeleteModal = () => {
    setDeleteModalTarget(null);
    setTargetBillToDelete(null);
    setConfirmInputText('');
  };

  const handleExecuteDelete = () => {
    if (deleteModalTarget === 'single' && targetBillToDelete) {
      if (confirmInputText.trim() === targetBillToDelete.billNumber || confirmInputText.trim().toUpperCase() === 'DELETE') {
        deleteBill(targetBillToDelete.id);
        closeDeleteModal();
      }
    } else if (deleteModalTarget === 'all') {
      if (confirmInputText.trim().toUpperCase() === 'DELETE ALL') {
        clearAllBills();
        closeDeleteModal();
      }
    }
  };

  const isConfirmValid = 
    (deleteModalTarget === 'single' && targetBillToDelete && (confirmInputText.trim() === targetBillToDelete.billNumber || confirmInputText.trim().toUpperCase() === 'DELETE')) ||
    (deleteModalTarget === 'all' && confirmInputText.trim().toUpperCase() === 'DELETE ALL');

  const exportCSVReport = () => {
    if (filteredBills.length === 0) {
      alert('No payment history records to export.');
      return;
    }

    const headers = ['Bill Number', 'Date & Time', 'Customer Name', 'Customer Phone', 'Items Summary', 'Payment Method', 'Total Amount (INR)'];
    const rows = filteredBills.map((b) => [
      `"${b.billNumber}"`,
      `"${new Date(b.date).toLocaleString('en-IN')}"`,
      `"${b.customerName.replace(/"/g, '""')}"`,
      `"${b.customerPhone}"`,
      `"${b.items.map((i) => `${i.name} (x${i.quantity})`).join('; ').replace(/"/g, '""')}"`,
      `"${b.paymentMethod.toUpperCase()}"`,
      b.totalAmount,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CSC_Payment_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 h-full overflow-y-auto pr-1">
      {/* HEADER & FILTER RIBBON */}
      <div className="bg-[#121827] border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" /> Payment History & Order Ledger
          </h2>

          <div className="flex items-center gap-2">
            {/* Export CSV Button */}
            <button
              onClick={exportCSVReport}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[#1b2336] hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition shadow-sm active:scale-95"
              title="Download payment history as CSV file"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>

            {/* Delete All History Button */}
            {bills.length > 0 && (
              <button
                onClick={openDeleteAllModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete All History
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Time View Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-xs text-slate-400 font-medium mr-1">View Filter:</span>

            <button
              onClick={() => setViewFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                viewFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'bg-[#0b0f19] border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All History
            </button>

            <button
              onClick={() => setViewFilter('daily')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                viewFilter === 'daily'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'bg-[#0b0f19] border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Daily (Today: ₹{todaySum})
            </button>

            <button
              onClick={() => setViewFilter('monthly')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                viewFilter === 'monthly'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'bg-[#0b0f19] border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Monthly (This Month: ₹{monthSum})
            </button>

            <button
              onClick={() => setViewFilter('yearly')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                viewFilter === 'yearly'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'bg-[#0b0f19] border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Yearly (This Year: ₹{yearSum})
            </button>
          </div>

          {/* Right Controls: Search & Payment Dropdown */}
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Bill ID, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0b0f19] border border-slate-800 text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2 outline-none font-medium"
              />
            </div>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full sm:w-auto bg-[#0b0f19] border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none font-semibold"
            >
              <option value="all">All Payments</option>
              <option value="cash">Cash Only</option>
              <option value="upi">UPI QR Only</option>
              <option value="credit">Credit / Khata Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* DATA TABLE & EMPTY STATE */}
      <div className="bg-[#121827] border border-slate-800 rounded-2xl overflow-hidden shadow-xl min-h-[380px]">
        {filteredBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center py-16 text-slate-500">
            <div className="w-14 h-14 rounded-full bg-[#0b0f19] border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-300">No payment records found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Complete bills in Billing Desk to log payment transactions here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#0b0f19] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <th className="p-4">BILL ID</th>
                  <th className="p-4">DATE & TIME</th>
                  <th className="p-4">CUSTOMER / CONTACT</th>
                  <th className="p-4">ITEMS SUMMARY</th>
                  <th className="p-4">PAYMENT MODE</th>
                  <th className="p-4 text-right">TOTAL AMOUNT</th>
                  <th className="p-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-bold text-csc-400">{b.billNumber}</td>
                    <td className="p-4 text-slate-400 text-[11px]">
                      {new Date(b.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-4 font-sans font-semibold text-slate-200">
                      <div>{b.customerName}</div>
                      {b.customerPhone !== 'N/A' && <span className="text-[10px] text-slate-500 font-mono">{b.customerPhone}</span>}
                    </td>
                    <td className="p-4 text-slate-300 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{b.items.length} item(s)</span>
                        <button
                          onClick={() => setViewingItemsBill(b)}
                          className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 rounded text-[10px] font-extrabold transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View All Items
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-500 truncate max-w-[180px] block mt-0.5">
                        {b.items.map((i) => i.name).join(', ')}
                      </span>
                    </td>
                    <td className="p-4 font-sans">
                      <span className={`uppercase font-bold text-[10px] px-2 py-0.5 rounded border ${
                        b.paymentMethod === 'upi' ? 'bg-csc-600/20 text-csc-300 border-csc-500/30' :
                        b.paymentMethod === 'cash' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        {b.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-emerald-400 text-sm">
                      ₹{b.totalAmount}
                    </td>
                    <td className="p-4 text-right space-x-1 font-sans">
                      <button
                        onClick={() => openEditModal(b)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                        title="Edit Bill Info"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => setSelectedBill(b)}
                        className="px-2.5 py-1 bg-csc-600/20 hover:bg-csc-600 text-csc-300 hover:text-white border border-csc-500/30 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                        title="Reprint Bill"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print
                      </button>
                      <button
                        onClick={() => openSingleDeleteModal(b)}
                        className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                        title="Delete Bill"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW ALL ITEMS DETAILS MODAL */}
      {viewingItemsBill && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0d1322]">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" /> Bill Purchased Items Breakdown
                </h3>
                <p className="text-xs text-csc-400 font-mono mt-0.5">
                  Bill ID: {viewingItemsBill.billNumber}
                </p>
              </div>
              <button onClick={() => setViewingItemsBill(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Customer & Bill Summary Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0b0f19] p-3.5 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Customer</span>
                  <span className="font-bold text-slate-100">{viewingItemsBill.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Mobile Phone</span>
                  <span className="font-mono text-slate-300">{viewingItemsBill.customerPhone}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Date & Time</span>
                  <span className="font-mono text-slate-300 text-[11px]">
                    {new Date(viewingItemsBill.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Payment Mode</span>
                  <span className="font-extrabold uppercase text-emerald-400 font-mono">{viewingItemsBill.paymentMethod}</span>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="bg-[#0b0f19] border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#151c2e] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">ITEM TITLE</th>
                      <th className="p-3">UNIT PRICE</th>
                      <th className="p-3 text-center">QTY</th>
                      <th className="p-3 text-right">TOTAL PRICE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {viewingItemsBill.items.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-slate-800/30">
                        <td className="p-3 text-slate-500">{index + 1}</td>
                        <td className="p-3 font-sans font-semibold text-slate-200">
                          {item.name}
                          {item.ackNumber && (
                            <span className="block text-[10px] text-amber-400 font-mono mt-0.5">
                              Ack #: {item.ackNumber}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-400">₹{item.unitPrice}</td>
                        <td className="p-3 text-center font-bold text-white">{item.quantity}</td>
                        <td className="p-3 text-right font-bold text-emerald-400">₹{item.totalPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Summary Footer */}
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800 flex items-center justify-between font-mono">
                <div className="text-xs font-sans text-slate-400">
                  <span>Total Items Purchased: </span>
                  <span className="font-bold text-white">{viewingItemsBill.items.length} item(s)</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 mr-2">Grand Total:</span>
                  <span className="text-xl font-extrabold text-emerald-400">₹{viewingItemsBill.totalAmount}</span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setSelectedBill(viewingItemsBill);
                    setViewingItemsBill(null);
                  }}
                  className="px-4 py-2 bg-csc-600/20 hover:bg-csc-600 text-csc-300 hover:text-white border border-csc-500/30 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Reprint Thermal Receipt
                </button>
                <button
                  onClick={() => setViewingItemsBill(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BILL MODAL */}
      {editingBill && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Edit Bill Details</h3>
              <button onClick={() => setEditingBill(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-amber-400 font-mono">Bill ID: {editingBill.billNumber}</p>

            <form onSubmit={handleSaveEditBill} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={editCustName}
                  onChange={(e) => setEditCustName(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 text-slate-100 text-xs rounded-xl p-3 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Customer Phone Number</label>
                <input
                  type="text"
                  value={editCustPhone}
                  onChange={(e) => setEditCustPhone(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 font-mono text-slate-100 text-xs rounded-xl p-3 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Method</label>
                <select
                  value={editPayMethod}
                  onChange={(e) => setEditPayMethod(e.target.value as any)}
                  className="w-full bg-[#0b0f19] border border-slate-800 text-slate-100 text-xs rounded-xl p-3 outline-none capitalize font-semibold"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI QR Code</option>
                  <option value="card">Card POS</option>
                  <option value="credit">Credit / Khata</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Notes</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 text-slate-100 text-xs rounded-xl p-3 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBill(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-csc-600 hover:bg-csc-500 text-white text-xs font-bold rounded-xl shadow"
                >
                  Save Bill Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ANIMATED TYPE-TO-CONFIRM DELETE MODAL */}
      {deleteModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-rose-500/40 rounded-2xl w-full max-w-md p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-bold text-white text-base">
                {deleteModalTarget === 'single' ? `Delete ${targetBillToDelete?.billNumber}?` : 'Delete All Payment History?'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {deleteModalTarget === 'single'
                  ? `To permanently delete this transaction record, type "${targetBillToDelete?.billNumber}" or "DELETE" below:`
                  : 'To permanently erase ALL payment history records, type "DELETE ALL" below:'}
              </p>
            </div>

            <input
              type="text"
              placeholder={deleteModalTarget === 'single' ? targetBillToDelete?.billNumber : 'DELETE ALL'}
              value={confirmInputText}
              onChange={(e) => setConfirmInputText(e.target.value)}
              className="w-full bg-[#0b0f19] border border-slate-700 text-amber-400 font-mono font-bold text-center text-sm rounded-xl p-3 outline-none focus:border-rose-500 uppercase tracking-widest"
              autoFocus
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={closeDeleteModal}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDelete}
                disabled={!isConfirmValid}
                className={`flex-1 py-2.5 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 ${
                  isConfirmValid
                    ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPRINT MODAL */}
      {selectedBill && (
        <ThermalReceiptModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
        />
      )}
    </div>
  );
};
