import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Save, Download, Upload, RotateCcw, Printer, Shield, QrCode, CheckCircle2, X, Smartphone, Laptop } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetAllData } = useApp();
  const [formData, setFormData] = useState(settings);
  const [showSavePopup, setShowSavePopup] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setShowSavePopup(true);
  };

  const exportJSONBackup = () => {
    const backupObj = {
      services: localStorage.getItem('csc_services'),
      bills: localStorage.getItem('csc_bills'),
      applications: localStorage.getItem('csc_applications'),
      khata: localStorage.getItem('csc_khata'),
      settings: localStorage.getItem('csc_settings'),
      exportedAt: new Date().toISOString(),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `CSC_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importJSONBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.services) localStorage.setItem('csc_services', parsed.services);
          if (parsed.bills) localStorage.setItem('csc_bills', parsed.bills);
          if (parsed.applications) localStorage.setItem('csc_applications', parsed.applications);
          if (parsed.khata) localStorage.setItem('csc_khata', parsed.khata);
          if (parsed.settings) localStorage.setItem('csc_settings', parsed.settings);
          alert('Data restored successfully! Refreshing portal...');
          window.location.reload();
        } catch (err) {
          alert('Invalid JSON backup file format.');
        }
      };
    }
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-1 max-w-4xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-400" /> Center & System Settings
          </h2>
          <p className="text-xs text-slate-400">
            Configure CSC branding, VLE details, UPI payment QR settings, thermal printing layout, and backups.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition shrink-0 active:scale-95"
        >
          <Save className="w-4 h-4" /> Save System Settings
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store & VLE Metadata */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Shield className="w-4 h-4 text-csc-400" /> CSC Center & VLE Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Center Name</label>
              <input
                type="text"
                required
                value={formData.centerName}
                onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-3 outline-none focus:border-csc-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">CSC VLE ID</label>
              <input
                type="text"
                required
                value={formData.cscId}
                onChange={(e) => setFormData({ ...formData, cscId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-csc-400 font-mono text-xs rounded-xl p-3 outline-none focus:border-csc-500 uppercase font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">VLE Operator Name</label>
              <input
                type="text"
                required
                value={formData.vleName}
                onChange={(e) => setFormData({ ...formData, vleName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-3 outline-none focus:border-csc-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs rounded-xl p-3 outline-none focus:border-csc-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Full Center Address</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-3 outline-none focus:border-csc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">District</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-3 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">State & Pincode</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-3 outline-none"
              />
            </div>
          </div>
        </div>

        {/* UPI & Printer Settings */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <QrCode className="w-4 h-4 text-emerald-400" /> UPI QR & Printer Configuration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">UPI Virtual Payment Address (VPA)</label>
              <input
                type="text"
                placeholder="e.g. 9876543210@paytm or csc.express@upi"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs rounded-xl p-3 outline-none focus:border-emerald-500 font-bold"
              />
              <p className="text-[10px] text-slate-500 mt-1">Generates payable QR code on billing screen.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Thermal Printer Paper Width</label>
              <select
                value={formData.thermalPrinterWidth}
                onChange={(e) => setFormData({ ...formData, thermalPrinterWidth: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-3 outline-none"
              >
                <option value="3inch">3 Inch (80mm POS Paper) - Recommended</option>
                <option value="2inch">2 Inch (58mm POS Paper)</option>
              </select>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition active:scale-95"
            >
              <Save className="w-4 h-4" /> Save System Settings
            </button>
          </div>
        </div>
      </form>

      {/* Sync Explanation Box: Why Mobile & Laptop Data are Saved Separately */}
      <div className="bg-[#121827] border border-amber-500/30 p-5 rounded-2xl space-y-3">
        <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
          <Smartphone className="w-4 h-4" /> Why Data Saved on Mobile is Stored Locally (Local Storage)
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          The app operates 100% offline-first using <code className="text-amber-300 font-mono bg-[#0b0f19] px-1.5 py-0.5 rounded">localStorage</code> memory inside each device browser. This ensures your sales transactions stay private and accessible without needing expensive servers.
        </p>

        <div className="bg-[#0b0f19] p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
          <p className="font-bold text-white flex items-center gap-1.5">
            <Laptop className="w-4 h-4 text-emerald-400" /> How to Transfer & Sync Data Between Laptop & Mobile:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] pl-1">
            <li>On the device with your latest data (Phone or Laptop), click <strong>Export Complete Backup (JSON)</strong> below.</li>
            <li>Send or air-drop the downloaded JSON file to your other device.</li>
            <li>On the target device, click <strong>Restore Backup (JSON)</strong> to instantly import all services, bills & settings!</li>
          </ol>
        </div>
      </div>

      {/* Backup & Data Restore */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <Download className="w-4 h-4 text-indigo-400" /> Offline Local Storage Backup & Data Export
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportJSONBackup}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-csc-400 border border-slate-700 font-bold text-xs rounded-xl transition active:scale-95"
          >
            <Download className="w-4 h-4" /> Export Complete Backup (JSON)
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold text-xs rounded-xl cursor-pointer transition active:scale-95">
            <Upload className="w-4 h-4" /> Restore Backup (JSON)
            <input type="file" accept=".json" onChange={importJSONBackup} className="hidden" />
          </label>

          <button
            onClick={resetAllData}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" /> Reset Initial Demo Data
          </button>
        </div>
      </div>

      {/* SAVE SETTINGS POPUP MODAL */}
      {showSavePopup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-emerald-500/40 rounded-2xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-bold text-white text-base">System Settings Saved!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your CSC center details, VLE profile, and payment settings have been saved successfully to your browser storage.
              </p>
            </div>

            <button
              onClick={() => setShowSavePopup(false)}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition active:scale-95"
            >
              Done / OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
