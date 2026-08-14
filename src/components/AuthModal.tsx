import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Store, KeyRound, Mail, UserCheck, Shield, Sparkles, AlertCircle, ArrowRight, Lock } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { login, register } = useApp();
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // Login Form state
  const [loginEmail, setLoginEmail] = useState<string>('vle@cscexpress.com');
  const [loginPassword, setLoginPassword] = useState<string>('password123');

  // Register Form state
  const [regCenterName, setRegCenterName] = useState<string>('');
  const [regVleName, setRegVleName] = useState<string>('');
  const [regCscId, setRegCscId] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const err = await login(loginEmail, loginPassword);
      if (err) {
        setErrorMsg(err);
      }
    } catch (e: any) {
      setErrorMsg('Login failed. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!regCenterName.trim()) return setErrorMsg('Center Name is required');
    if (!regVleName.trim()) return setErrorMsg('VLE Name is required');
    if (!regEmail.trim() || !regPassword) return setErrorMsg('Email & Password are required');

    setLoading(true);
    try {
      const err = await register({
        email: regEmail,
        password: regPassword,
        vleName: regVleName,
        centerName: regCenterName,
        cscId: regCscId || `CSC-${Math.floor(100000 + Math.random() * 900000)}`
      });
      if (err) {
        setErrorMsg(err);
      }
    } catch (e: any) {
      setErrorMsg('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    await login('vle@cscexpress.com', 'password123');
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-800 p-6 text-center relative">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">CSC Digital Express</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">Multi-Tenant Billing & Store Operations System</p>
        </div>

        {/* Tab Switcher */}
        <div className="p-6 pb-2">
          <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => { setIsRegistering(false); setErrorMsg(null); }}
              className={`py-2 text-xs font-extrabold rounded-xl transition ${
                !isRegistering
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegistering(true); setErrorMsg(null); }}
              className={`py-2 text-xs font-extrabold rounded-xl transition ${
                isRegistering
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          {!isRegistering ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" /> Email / VLE Login
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="vle@cscexpress.com"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-3 outline-none focus:border-amber-500 transition font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-3 outline-none focus:border-amber-500 transition font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Authenticating...' : (
                  <>
                    Access My CSC Store <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">CSC Center Name</label>
                <input
                  type="text"
                  required
                  value={regCenterName}
                  onChange={(e) => setRegCenterName(e.target.value)}
                  placeholder="e.g. Sri Lakshmi Digital Express"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-2.5 outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">VLE Operator Name</label>
                  <input
                    type="text"
                    required
                    value={regVleName}
                    onChange={(e) => setRegVleName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-2.5 outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">CSC VLE ID (Optional)</label>
                  <input
                    type="text"
                    value={regCscId}
                    onChange={(e) => setRegCscId(e.target.value)}
                    placeholder="CSC-TN-12345"
                    className="w-full bg-slate-950 border border-slate-800 text-amber-400 font-mono text-xs rounded-xl p-2.5 outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Login Email</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="your.center@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-2.5 outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Choose Password</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-2.5 outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Creating CSC Account...' : (
                  <>
                    <UserCheck className="w-4 h-4" /> Create & Launch CSC Account
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Login Option */}
          <div className="mt-5 pt-4 border-t border-slate-800 text-center pb-6">
            <p className="text-[11px] text-slate-400 mb-2 font-medium">Want to quickly test the billing system?</p>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 active:scale-95 shadow-md"
            >
              <Sparkles className="w-4 h-4 text-amber-400" /> One-Click Demo Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
