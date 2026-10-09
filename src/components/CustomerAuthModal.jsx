import { useState } from 'react';
import { X, LogIn, UserPlus, Eye, EyeOff, User } from 'lucide-react';
import { signIn, signUp } from '../services/apiClient';

/**
 * CustomerAuthModal
 * Lightweight sign in / sign up modal for storefront customers.
 * Completely separate from the Owner Portal login.
 */
function CustomerAuthModal({ onClose, onAuthenticated }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await signIn(email.trim(), password);
      onAuthenticated(data.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Sign in failed. Please check your credentials.');
    } finally { setLoading(false); }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!email.trim() || !password || !name.trim() || !phone.trim()) {
      setError('Please enter your name, phone number, email, and password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const data = await signUp({ name: name.trim(), phone: phone.trim(), email: email.trim(), password });
      onAuthenticated(data.user);
      onClose();
    } catch (err) { setError(err.message || 'Sign up failed. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-coal-950/70 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-3xl border border-coal-200 bg-white shadow-2xl shadow-black/40 dark:border-coal-800 dark:bg-coal-900 z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-coal-100 dark:border-coal-800 px-6 py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">
              Customer Account
            </p>
            <h2 className="mt-0.5 text-xl font-black text-zinc-900 dark:text-white">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-coal-100 hover:text-zinc-900 dark:hover:bg-coal-800 dark:hover:text-white transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}
          className="px-6 py-6 space-y-4"
        >
          {mode === 'signup' && (
            <>
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Your Name
                </span>
                <div className="relative mt-1.5">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ali Hassan"
                    className="w-full rounded-xl border border-coal-200 bg-coal-50 py-2.5 pl-9 pr-3.5 text-sm font-medium text-zinc-900 outline-none transition focus:border-teal-500 dark:border-coal-700 dark:bg-coal-950 dark:text-white"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Phone Number
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +923001234567"
                  className="mt-1.5 w-full rounded-xl border border-coal-200 bg-coal-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none transition focus:border-teal-500 dark:border-coal-700 dark:bg-coal-950 dark:text-white"
                />
              </label>
            </>
          )}

          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Email Address
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="mt-1.5 w-full rounded-xl border border-coal-200 bg-coal-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none transition focus:border-teal-500 dark:border-coal-700 dark:bg-coal-950 dark:text-white"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Password
            </span>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Minimum 6 characters' : '••••••••'}
                className="w-full rounded-xl border border-coal-200 bg-coal-50 py-2.5 pl-3.5 pr-10 text-sm font-medium text-zinc-900 outline-none transition focus:border-teal-500 dark:border-coal-700 dark:bg-coal-950 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>

          {/* Error */}
          {error && (
            <p className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs font-semibold text-red-600 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
              {error}
            </p>
          )}

          {/* Success */}
          {successMsg && (
            <p className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400">
              {successMsg}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-teal-500/20 transition hover:bg-teal-700 hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
              </span>
            ) : mode === 'signin' ? (
              <>
                <LogIn size={15} /> Sign In
              </>
            ) : (
              <>
                <UserPlus size={15} /> Create Account
              </>
            )}
          </button>

          {/* Mode toggle */}
          <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
                setSuccessMsg('');
              }}
              className="font-bold text-teal-600 dark:text-teal-400 hover:underline"
            >
              {mode === 'signin' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </form>

        {/* Footer note */}
        <div className="border-t border-coal-100 dark:border-coal-800 px-6 py-3 bg-coal-50/60 dark:bg-coal-950/40">
          <p className="text-center text-[11px] text-zinc-400">
            Your account is used to rate products. It is separate from the Owner Portal.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CustomerAuthModal;
