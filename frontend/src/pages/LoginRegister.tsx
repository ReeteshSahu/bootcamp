import React, { useState } from 'react';
import { Mail, Lock, User, Shield, KeyRound, CheckCircle2 } from 'lucide-react';

const getApiUrl = (path: string) => {
  const base = window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;
  return `${base}${path}`;
};

interface LoginRegisterProps {
  onLoginSuccess: (token: string, user: { name: string; email: string; role: string }) => void;
}

const LoginRegister: React.FC<LoginRegisterProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('public');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(getApiUrl('/api/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Register submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(getApiUrl('/api/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setMessage(data.message);
      setIsVerified(true); // Direct to simulated email verification screen
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mock Forgot Password submission
  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage(`Password reset link sent to ${email} (Simulated)`);
  };

  // Preset accounts quick-click handler
  const loginAsPreset = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.18),rgba(255,255,255,0))] px-6 py-12">
      <div className="w-full max-w-md p-8 rounded-2xl glass shadow-2xl relative border border-slate-700/50">
        
        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg mb-3">
            <span className="text-white font-extrabold text-2xl tracking-wider">A</span>
          </div>
          <h2 className="text-2xl font-black tracking-wide text-primary">AeroShield</h2>
          <p className="text-xs text-slate-400 font-semibold tracking-wider mt-1">Raipur-Bhilai Industrial Air Corridor</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg font-semibold">
            {error}
          </div>
        )}

        {message && !isVerified && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg font-semibold">
            {message}
          </div>
        )}

        {/* 1. VERIFICATION SCREEN */}
        {isVerified ? (
          <div className="text-center py-4">
            <div className="flex justify-center text-emerald-500 mb-4 animate-bounce">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Simulated Email Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              A registration confirmation token has been mocked for <strong>{email}</strong>. 
              Clicking verify completes the process.
            </p>
            <button
              onClick={() => {
                setIsVerified(false);
                setIsRegister(false);
                setMessage('Email verified. You can now login.');
              }}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all"
            >
              Verify & Complete Registration
            </button>
          </div>
        ) : isForgot ? (
          /* 2. FORGOT PASSWORD */
          <form onSubmit={handleForgot} className="space-y-4">
            <h3 className="text-base font-bold text-slate-200">Reset Password</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your email address and we'll simulate sending you a password reset URL.
            </p>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-500"><Mail size={16} /></span>
              <input
                type="email"
                required
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800/70 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-bold transition-all"
            >
              Send Reset Link
            </button>
            <button
              type="button"
              onClick={() => setIsForgot(false)}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-200 font-semibold"
            >
              Back to Login
            </button>
          </form>
        ) : isRegister ? (
          /* 3. REGISTER SCREEN */
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-500"><User size={16} /></span>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800/70 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-500"><Mail size={16} /></span>
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800/70 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-500"><Lock size={16} /></span>
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/70 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-500"><Shield size={16} /></span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-800/70 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
              >
                <option value="public" className="bg-slate-800">Role: Public User</option>
                <option value="manager" className="bg-slate-800">Role: Fleet Manager</option>
                <option value="admin" className="bg-slate-800">Role: System Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all"
            >
              {loading ? 'Registering...' : 'Create Account'}
            </button>

            <p className="text-center text-xs text-slate-400 mt-4">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="text-primary font-bold hover:underline"
              >
                Sign In
              </button>
            </p>
          </form>
        ) : (
          /* 4. LOGIN SCREEN */
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-500"><Mail size={16} /></span>
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800/70 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-500"><Lock size={16} /></span>
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/70 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsForgot(true)}
                className="text-[11px] text-slate-400 hover:text-slate-200 font-semibold"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all"
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>

            <p className="text-center text-xs text-slate-400 mt-4">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="text-primary font-bold hover:underline"
              >
                Sign Up
              </button>
            </p>

            {/* QUICK PRESETS SECTION */}
            <div className="border-t border-slate-800 pt-6 mt-6">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-3 text-center">
                Quick Role Sandbox Presets
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => loginAsPreset('admin@aeroshield.com')}
                  className="py-2 px-1 text-[10px] font-bold text-center border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition"
                >
                  ADMIN
                </button>
                <button
                  type="button"
                  onClick={() => loginAsPreset('manager@aeroshield.com')}
                  className="py-2 px-1 text-[10px] font-bold text-center border border-amber-500/20 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 rounded-lg transition"
                >
                  MANAGER
                </button>
                <button
                  type="button"
                  onClick={() => loginAsPreset('public@aeroshield.com')}
                  className="py-2 px-1 text-[10px] font-bold text-center border border-emerald-500/20 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-lg transition"
                >
                  PUBLIC
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default LoginRegister;
