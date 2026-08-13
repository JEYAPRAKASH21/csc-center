import React, { useState, useEffect, useRef } from 'react';
import { Bill } from '../types';
import { useApp } from '../context/AppContext';
import { Printer, X, Share2, CheckCircle2, Image as ImageIcon, Send, Download, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';

interface ThermalReceiptModalProps {
  bill: Bill;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({ bill, onClose }) => {
  const { settings } = useApp();
  const [viewFormat, setViewFormat] = useState<'thermal' | 'a4'>('thermal');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [whatsappPhone, setWhatsappPhone] = useState<string>(
    bill.customerPhone !== 'N/A' ? bill.customerPhone : ''
  );
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (settings.upiId) {
      const upiUrl = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.upiName || settings.centerName)}&am=${bill.totalAmount}&cu=INR&tn=Bill%20${bill.billNumber}`;
      QRCode.toDataURL(upiUrl, { width: 140, margin: 1 })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [settings.upiId, settings.upiName, settings.centerName, bill.totalAmount, bill.billNumber]);

  const handlePrint = () => {
    window.print();
  };

  const handleDoneClick = () => {
    setShowWhatsAppPrompt(true);
  };

  // Download receipt as PNG image file
  const handleDownloadBillImage = async () => {
    if (!receiptRef.current) return;
    setIsGeneratingImage(true);

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      const fileName = `CSC_Bill_${bill.billNumber}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download bill image:', err);
    } fontally: {
      setIsGeneratingImage(false);
    }
  };

  // Generate exact PNG image of receipt and share image format to WhatsApp
  const handleSendBillImageWhatsApp = async () => {
    if (!receiptRef.current) return;
    setIsGeneratingImage(true);

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsGeneratingImage(false);
          return;
        }

        const fileName = `CSC_Bill_${bill.billNumber}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });
        const cleanPhone = whatsappPhone.replace(/[^0-9]/g, '');
        const waNumber = cleanPhone ? (cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone) : '';

        // 1. Mobile Web Share API: Attaches actual IMAGE format file directly into WhatsApp
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `${settings.centerName} Bill Image - ${bill.billNumber}`,
              text: `Receipt from ${settings.centerName} for ₹${bill.totalAmount}`,
            });
            setIsGeneratingImage(false);
            onClose();
            return;
          } catch (shareErr) {
            console.log('Native file share skipped or canceled, proceeding with copy & open fallback');
          }
        }

        // 2. Copy PNG image to clipboard for instant Paste (Cmd+V / Ctrl+V)
        try {
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
          }
        } catch (clipErr) {
          console.log('Clipboard image copy error:', clipErr);
        }

        // 3. Trigger PNG image file download
        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 4. Open WhatsApp directly to target phone number
        const waUrl = waNumber ? `https://api.whatsapp.com/send?phone=${waNumber}` : `https://api.whatsapp.com/send`;
        window.open(waUrl, '_blank');

        alert(`Bill PNG Image saved & copied to clipboard!\n\nSimply press Ctrl+V (or Cmd+V) in the WhatsApp chat window to send the bill picture directly!`);

        setIsGeneratingImage(false);
        onClose();
      }, 'image/png');
    } catch (err) {
      console.error('Image capture error:', err);
      setIsGeneratingImage(false);
    }
  };

  const formattedDate = new Date(bill.date).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#121827] border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Controls */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-800 bg-[#0d1322]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">Receipt Generated</h3>
              <p className="text-xs text-slate-400 font-mono">Bill No: {bill.billNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Format Selector */}
            <div className="flex bg-[#151c2e] p-1 rounded-xl text-xs font-semibold border border-slate-800">
              <button
                onClick={() => setViewFormat('thermal')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  viewFormat === 'thermal' ? 'bg-csc-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Thermal (3")
              </button>
              <button
                onClick={() => setViewFormat('a4')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  viewFormat === 'a4' ? 'bg-csc-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                A4 Invoice
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0b0f19] flex justify-center">
          <div ref={receiptRef}>
            {viewFormat === 'thermal' ? (
              /* THERMAL POS RECEIPT FORMAT */
              <div className="print-area thermal-receipt bg-white text-slate-950 p-5 rounded-lg shadow-xl border border-slate-300 w-full max-w-[80mm] font-mono text-xs select-text">
                <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
                  <h2 className="font-bold text-base uppercase tracking-tight">{settings.centerName}</h2>
                  <p className="text-[11px] text-slate-700">{settings.address}</p>
                  <p className="text-[11px] text-slate-700">{settings.district}, {settings.state}</p>
                  <p className="text-[11px] font-semibold mt-1">Ph: {settings.phone}</p>
                  <div className="mt-1.5 pt-1 border-t border-dotted border-slate-300 text-[10px] text-slate-600">
                    <span>CSC ID: {settings.cscId}</span> &bull; <span>VLE: {settings.vleName}</span>
                  </div>
                </div>

                {/* Bill & Customer Metadata */}
                <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-400 pb-2 mb-2">
                  <div className="flex justify-between">
                    <span>Bill No:</span>
                    <span className="font-bold">{bill.billNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-semibold">{bill.customerName}</span>
                  </div>
                  {bill.customerPhone !== 'N/A' && (
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span>{bill.customerPhone}</span>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <table className="w-full text-left text-[11px] border-b border-dashed border-slate-400 pb-2 mb-2">
                  <thead>
                    <tr className="border-b border-slate-400 font-bold">
                      <th className="pb-1">Item</th>
                      <th className="text-center pb-1">Qty</th>
                      <th className="text-right pb-1">Rate</th>
                      <th className="text-right pb-1">Amt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {bill.items.map((item, idx) => (
                      <tr key={idx} className="align-top">
                        <td className="py-1 pr-1 font-sans">
                          <div>{item.name}</div>
                        </td>
                        <td className="py-1 text-center font-mono">{item.quantity}</td>
                        <td className="py-1 text-right font-mono">₹{item.unitPrice}</td>
                        <td className="py-1 text-right font-bold font-mono">₹{item.totalPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Total */}
                <div className="text-[11px] space-y-1 border-b border-dashed border-slate-400 pb-2 mb-2 font-mono">
                  <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-400">
                    <span>TOTAL:</span>
                    <span>₹{bill.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-700">
                    <span>Payment Mode:</span>
                    <span className="uppercase font-bold">{bill.paymentMethod}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-2">
                  {qrCodeUrl && (
                    <div className="flex flex-col items-center justify-center my-1">
                      <img src={qrCodeUrl} alt="UPI Payment QR" className="w-20 h-20 border border-slate-300 p-1" />
                      <span className="text-[9px] text-slate-600 mt-0.5">Scan to Pay via UPI</span>
                    </div>
                  )}
                  <p className="font-bold text-[11px] mt-2">*** THANK YOU! VISIT AGAIN ***</p>
                </div>
              </div>
            ) : (
              /* A4 TAX INVOICE */
              <div className="print-area bg-white text-slate-900 p-8 rounded-lg shadow-xl border border-slate-300 w-full max-w-xl font-sans text-xs select-text">
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-4">
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">{settings.centerName}</h1>
                    <p className="text-slate-600 text-xs mt-0.5">{settings.address}, {settings.district}</p>
                    <p className="text-slate-600 text-xs">{settings.state} &bull; Ph: {settings.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs uppercase rounded">
                      INVOICE
                    </span>
                    <p className="font-bold text-sm mt-2">{bill.billNumber}</p>
                    <p className="text-slate-500 text-[11px]">{formattedDate}</p>
                  </div>
                </div>

                <div className="bg-slate-100 p-3 rounded-lg border border-slate-300 mb-4 flex justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500">Bill To Customer:</p>
                    <p className="font-bold text-sm text-slate-900">{bill.customerName}</p>
                    <p className="text-slate-600 text-xs">Phone: {bill.customerPhone}</p>
                  </div>
                </div>

                <table className="w-full text-left border-collapse mb-6">
                  <thead>
                    <tr className="bg-slate-800 text-white text-[11px] uppercase">
                      <th className="p-2 rounded-l">#</th>
                      <th className="p-2">Service / Product</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right rounded-r">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {bill.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="p-2 font-medium">{item.name}</td>
                        <td className="p-2 text-center font-mono">{item.quantity}</td>
                        <td className="p-2 text-right font-mono">₹{item.unitPrice}</td>
                        <td className="p-2 text-right font-bold font-mono">₹{item.totalPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-between items-end border-t border-slate-300 pt-4">
                  <div className="text-slate-600 text-[11px]">
                    <p className="font-bold text-slate-800">Terms & Conditions:</p>
                    <p>Computer generated invoice.</p>
                  </div>
                  <div className="w-48 space-y-1 font-mono text-xs">
                    <div className="flex justify-between font-extrabold text-base border-t-2 border-slate-800 pt-1 text-slate-900">
                      <span>Total Amount:</span>
                      <span>₹{bill.totalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-t border-slate-800 bg-[#0d1322]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWhatsAppPrompt(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition active:scale-95"
            >
              <ImageIcon className="w-4 h-4 text-emerald-400" /> Send Bill Image to WhatsApp
            </button>

            <button
              onClick={handleDownloadBillImage}
              disabled={isGeneratingImage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition active:scale-95"
              title="Download Receipt Image (PNG)"
            >
              {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Download className="w-4 h-4 text-amber-400" />}
              <span className="hidden sm:inline">Save Image</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDoneClick}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition active:scale-95"
            >
              Done
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-csc-600 to-blue-600 hover:from-csc-500 hover:to-blue-500 text-white shadow-lg transition active:scale-95"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
          </div>
        </div>
      </div>

      {/* WHATSAPP PROMPT MODAL */}
      {showWhatsAppPrompt && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-slate-700 rounded-2xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-white text-base">Send Bill Image Format</h3>
            <p className="text-xs text-slate-400">
              Generates PNG bill image & sends image format via WhatsApp:
            </p>

            <input
              type="text"
              placeholder="Customer Phone (e.g. 9876543210)"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              className="w-full bg-[#0b0f19] border border-slate-800 text-white font-mono text-xs rounded-xl p-3 outline-none text-center"
              autoFocus
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Skip / Close
              </button>
              <button
                onClick={handleSendBillImageWhatsApp}
                disabled={isGeneratingImage}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 active:scale-95"
              >
                {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Send WhatsApp Image</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
