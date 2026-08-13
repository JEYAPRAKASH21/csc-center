import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceCategory, Bill } from '../types';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import confetti from 'canvas-confetti';
import { 
  Search, 
  Plus, 
  Minus,
  Trash2, 
  ShoppingCart, 
  QrCode, 
  Banknote, 
  CreditCard, 
  User, 
  Phone, 
  Receipt,
  Sparkles,
  RotateCcw,
  X,
  CheckCircle2
} from 'lucide-react';
import QRCode from 'qrcode';

export const POSView: React.FC = () => {
  const {
    services,
    addService,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartTotal,
    processCheckout,
    settings
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form input states
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [completedBill, setCompletedBill] = useState<Bill | null>(null);

  // Modal States for Payment Options
  const [paymentModalType, setPaymentModalType] = useState<'upi' | 'cash' | 'credit' | null>(null);
  const [upiQrUrl, setUpiQrUrl] = useState<string>('');

  // Add New Service Modal State inside Billing Desk
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState<boolean>(false);
  const [newSrvName, setNewSrvName] = useState<string>('');
  const [newSrvCategory, setNewSrvCategory] = useState<ServiceCategory>('xerox');
  const [newSrvPrice, setNewSrvPrice] = useState<number>(10);
  const [newSrvUnit, setNewSrvUnit] = useState<string>('per page');
  const [newSrvCode, setNewSrvCode] = useState<string>('');

  const categories: { id: ServiceCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Services' },
    { id: 'xerox', label: 'Xerox & Copy' },
    { id: 'photos', label: 'Photos' },
    { id: 'esevai', label: 'E-Sevai Govt' },
    { id: 'stationery', label: 'Stationery' },
    { id: 'lamination', label: 'Lamination' },
  ];

  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      const matchesCat = selectedCategory === 'all' || srv.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        srv.name.toLowerCase().includes(q) || 
        srv.category.toLowerCase().includes(q) ||
        (srv.code && srv.code.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [services, selectedCategory, searchQuery]);

  // Find item quantity in cart helper
  const getItemCartQty = (serviceId: string) => {
    const found = cart.find((item) => item.id === serviceId);
    return found ? found.quantity : 0;
  };

  const handleOpenAddServiceModal = () => {
    setNewSrvName('');
    setNewSrvCategory('xerox');
    setNewSrvPrice(10);
    setNewSrvUnit('per page');
    setNewSrvCode('');
    setIsAddServiceModalOpen(true);
  };

  const handleSaveNewService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSrvName.trim() || newSrvPrice <= 0) return;

    addService({
      name: newSrvName.trim(),
      category: newSrvCategory,
      price: newSrvPrice,
      unit: newSrvUnit.trim() || 'per unit',
      code: newSrvCode.trim().toUpperCase() || `SRV-${Math.floor(100 + Math.random() * 900)}`,
      popular: true,
    });

    setIsAddServiceModalOpen(false);
  };

  // Open GPay UPI QR Modal
  const handleOpenGPayModal = () => {
    if (cart.length === 0) return;
    const upiUrl = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.upiName || settings.centerName)}&am=${cartTotal}&cu=INR&tn=CSC%20Bill`;
    QRCode.toDataURL(upiUrl, { width: 220, margin: 1 })
      .then((url) => {
        setUpiQrUrl(url);
        setPaymentModalType('upi');
      })
      .catch((err) => console.error('Failed to generate UPI QR:', err));
  };

  // Open Cash Pay Modal
  const handleOpenCashModal = () => {
    if (cart.length === 0) return;
    setPaymentModalType('cash');
  };

  // Open Card Pay Modal
  const handleOpenCardModal = () => {
    if (cart.length === 0) return;
    setPaymentModalType('credit');
  };

  // Complete Payment Process
  const handleCompletePayment = () => {
    if (!paymentModalType || cart.length === 0) return;
    const bill = processCheckout(customerName, customerPhone, paymentModalType);

    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (e) {}

    setPaymentModalType(null);
    setCompletedBill(bill);
    setCustomerName('');
    setCustomerPhone('');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-auto lg:h-[calc(100vh-5rem)] lg:overflow-hidden pb-12 lg:pb-0">
      {/* FRONT PAGE: SEARCH, CATEGORY PILLS & SCROLLABLE SERVICES GRID */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 h-full lg:overflow-hidden">
        {/* Search & Category Filter Bar (Fixed Top) */}
        <div className="bg-[#121827] border border-slate-800/90 rounded-2xl p-4 space-y-3 shrink-0 shadow-lg">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search available service item with price..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0b0f19] border border-slate-800 focus:border-amber-500/50 text-slate-100 text-xs rounded-xl pl-10 pr-4 py-3 outline-none font-medium placeholder:text-slate-500"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-[#1b2336] border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Service Cards Grid ONLY */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 bg-[#121827]/40 rounded-2xl border border-dashed border-slate-800 p-6 text-center">
              <Search className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-400">No items found matching "{searchQuery}"</p>
              <button
                onClick={handleOpenAddServiceModal}
                className="mt-3 px-4 py-2 bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow"
              >
                + Add Service Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-6">
              {filteredServices.map((srv) => {
                const itemQty = getItemCartQty(srv.id);

                return (
                  <div
                    key={srv.id}
                    className="bg-[#121827] border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/40 transition duration-200 group shadow-lg"
                  >
                    {/* Header Row: Title, Code & Price Pill */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="bg-[#151c2e] text-slate-400 border border-slate-700/80 text-[10px] font-mono px-2 py-0.5 rounded uppercase">
                            {srv.code || srv.category}
                          </span>
                          <h4 className="font-bold text-slate-100 text-sm mt-1.5 leading-snug line-clamp-2">
                            {srv.name}
                          </h4>
                        </div>

                        {/* Price Badge Top Right */}
                        <div className="bg-amber-500/90 text-slate-950 font-extrabold text-sm font-mono px-3 py-1 rounded-xl shadow shrink-0">
                          ₹{srv.price}
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 font-mono">{srv.unit}</p>
                    </div>

                    {/* Add Button & + / - Quantity Stepper Controls */}
                    <div className="pt-3 mt-2 border-t border-slate-800/60">
                      {itemQty === 0 ? (
                        <button
                          onClick={() => addToCart(srv, 1)}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#1e293b] hover:bg-csc-600 text-slate-200 hover:text-white font-bold text-xs rounded-xl transition duration-150 active:scale-95 shadow"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>Add</span>
                        </button>
                      ) : (
                        <div className="flex items-center justify-between bg-csc-600/20 border border-csc-500/40 rounded-xl p-1">
                          <button
                            onClick={() => updateCartQuantity(srv.id, itemQty - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-[#151c2e] hover:bg-rose-500/20 text-slate-200 hover:text-rose-300 rounded-lg text-xs font-bold transition active:scale-95"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono text-xs font-bold text-amber-400 px-2">
                            {itemQty} added
                          </span>
                          <button
                            onClick={() => updateCartQuantity(srv.id, itemQty + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-[#151c2e] hover:bg-csc-500 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: FIXED BILLING DESK SIDEBAR */}
      <div className="w-full lg:w-[380px] bg-[#121827] border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shrink-0 shadow-2xl overflow-hidden h-full">
        <div>
          {/* Active Bill Header with Clear Button */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-sm">Billing Desk</h3>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {cart.length} items
              </span>
            </div>

            {/* Clear Button */}
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-2.5 py-1 rounded-xl transition active:scale-95"
                title="Delete all selected items"
              >
                <RotateCcw className="w-3 h-3" /> Clear Bill
              </button>
            )}
          </div>

          {/* Customer Inputs */}
          <div className="space-y-2 my-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Customer Name (Optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-[#0b0f19] border border-slate-800 focus:border-amber-500/50 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none font-medium placeholder:text-slate-500"
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="WhatsApp Phone Number (e.g. 9876543210)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-[#0b0f19] border border-slate-800 focus:border-amber-500/50 text-slate-200 text-xs font-mono rounded-xl pl-9 pr-3 py-2.5 outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="max-h-[260px] overflow-y-auto pr-1 my-2 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
                <Receipt className="w-10 h-10 stroke-[1.2] text-slate-700 mb-2" />
                <p className="text-xs font-bold text-slate-400">No items added yet</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                  Select items from the left menu to start billing
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#0b0f19] border border-slate-800 p-2.5 rounded-xl flex items-center justify-between"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-semibold text-slate-200 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">₹{item.unitPrice} × {item.quantity}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-[#151c2e] border border-slate-800 rounded-lg p-0.5">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-300 hover:bg-slate-800 rounded"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono text-xs font-bold text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-300 hover:bg-slate-800 rounded"
                      >
                        +
                      </button>
                    </div>

                    <span className="font-bold text-emerald-400 font-mono text-xs w-12 text-right">
                      ₹{item.totalPrice}
                    </span>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Total Calculation & Payment Triggers */}
        {cart.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="bg-[#0b0f19] p-3.5 rounded-xl border border-slate-800 flex items-center justify-between font-mono">
              <span className="font-sans text-xs uppercase font-extrabold text-slate-300">TOTAL:</span>
              <span className="text-emerald-400 text-xl font-extrabold">₹{cartTotal}</span>
            </div>

            {/* Pay with GPay / UPI Button */}
            <button
              onClick={handleOpenGPayModal}
              className="w-full py-3 bg-gradient-to-r from-blue-600 via-csc-500 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Pay with GPay / UPI QR (₹{cartTotal})</span>
            </button>

            {/* Cash Pay & Card Pay */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleOpenCashModal}
                className="py-2.5 px-3 bg-[#1b2336] hover:bg-slate-800 text-slate-200 font-bold text-xs rounded-xl border border-slate-800 transition flex items-center justify-center gap-1.5"
              >
                <Banknote className="w-4 h-4 text-emerald-400" />
                <span>Cash Pay</span>
              </button>

              <button
                onClick={handleOpenCardModal}
                className="py-2.5 px-3 bg-[#1b2336] hover:bg-slate-800 text-slate-200 font-bold text-xs rounded-xl border border-slate-800 transition flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-4 h-4 text-rose-400" />
                <span>Card Pay</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD NEW SERVICE MODAL DIALOG */}
      {isAddServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0d1322]">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" /> Add New Service Item
              </h3>
              <button onClick={() => setIsAddServiceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewService} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Service Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Passport Size Photos (32 Pcs), Aadhaar Update"
                  value={newSrvName}
                  onChange={(e) => setNewSrvName(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 focus:border-amber-500 text-white text-xs rounded-xl p-3 outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category *</label>
                  <select
                    value={newSrvCategory}
                    onChange={(e) => setNewSrvCategory(e.target.value as ServiceCategory)}
                    className="w-full bg-[#0b0f19] border border-slate-800 text-white text-xs rounded-xl p-3 outline-none capitalize font-semibold"
                  >
                    <option value="xerox">Xerox & Copy</option>
                    <option value="photos">Photos</option>
                    <option value="esevai">E-Sevai Govt</option>
                    <option value="stationery">Stationery</option>
                    <option value="lamination">Lamination</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="10"
                    value={newSrvPrice}
                    onChange={(e) => setNewSrvPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0b0f19] border border-slate-800 focus:border-amber-500 font-mono text-white text-xs rounded-xl p-3 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Unit Description</label>
                  <input
                    type="text"
                    placeholder="per page, per app, per sheet"
                    value={newSrvUnit}
                    onChange={(e) => setNewSrvUnit(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-slate-800 text-white text-xs rounded-xl p-3 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Short Code</label>
                  <input
                    type="text"
                    placeholder="XRX-SS, ESV-PAN"
                    value={newSrvCode}
                    onChange={(e) => setNewSrvCode(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-slate-800 uppercase font-mono text-white text-xs rounded-xl p-3 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-slate-950 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/20"
                >
                  Save & Add Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT POPUP MODALS WITH CANCEL BUTTON & DONE TRIGGER */}
      {paymentModalType && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-slate-700/80 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                {paymentModalType === 'upi' && <QrCode className="w-4 h-4 text-csc-400" />}
                {paymentModalType === 'cash' && <Banknote className="w-4 h-4 text-emerald-400" />}
                {paymentModalType === 'credit' && <CreditCard className="w-4 h-4 text-rose-400" />}
                <span>
                  {paymentModalType === 'upi' ? 'Scan QR Code to Pay' : paymentModalType === 'cash' ? 'Cash Payment Collect' : 'Card POS Machine Pay'}
                </span>
              </h3>
              <button onClick={() => setPaymentModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content for UPI QR */}
            {paymentModalType === 'upi' && (
              <div className="bg-white p-3 rounded-2xl inline-block border-2 border-csc-500 shadow-xl">
                {upiQrUrl && <img src={upiQrUrl} alt="UPI QR Code" className="w-48 h-48 mx-auto" />}
              </div>
            )}

            {/* Content for Cash */}
            {paymentModalType === 'cash' && (
              <div className="bg-[#0b0f19] p-5 rounded-2xl border border-slate-800 space-y-2">
                <p className="text-xs text-slate-400">Collect Cash From Customer:</p>
                <p className="text-4xl font-extrabold text-emerald-400 font-mono">₹{cartTotal}</p>
                <p className="text-[11px] text-slate-500">Hand over receipt after collecting cash</p>
              </div>
            )}

            {/* Content for Card */}
            {paymentModalType === 'credit' && (
              <div className="bg-[#0b0f19] p-5 rounded-2xl border border-slate-800 space-y-2">
                <p className="text-xs text-slate-400">Charge on POS Machine Terminal:</p>
                <p className="text-4xl font-extrabold text-rose-400 font-mono">₹{cartTotal}</p>
                <p className="text-[11px] text-slate-500">Swipe or Tap Card on POS Device</p>
              </div>
            )}

            {paymentModalType === 'upi' && (
              <div>
                <p className="text-xs text-slate-400">Total Amount Payable:</p>
                <p className="text-3xl font-extrabold text-emerald-400 font-mono mt-0.5">₹{cartTotal}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-1">UPI ID: {settings.upiId}</p>
              </div>
            )}

            {/* Done Button & Cancel Button */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleCompletePayment}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Payment Complete / Done</span>
              </button>

              <button
                onClick={() => setPaymentModalType(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Cancel / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed Bill Thermal Receipt Modal */}
      {completedBill && (
        <ThermalReceiptModal
          bill={completedBill}
          onClose={() => setCompletedBill(null)}
        />
      )}
    </div>
  );
};
