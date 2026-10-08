import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  ChefHat,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { signIn } from "../services/apiClient";
import { selectRestaurantForUser } from "../services/productService";

function OwnerLogin({ onLoggedIn, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter both email address and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const session = await signIn(email.trim(), password);
      if (session?.user) {
        try {
          await selectRestaurantForUser(session.user);
        } catch {
          // It's ok if restaurant selection uses default
        }
        onLoggedIn(session.user);
      } else {
        setError("Sign in failed. Please check your credentials.");
      }
    } catch (err) {
      setError(err?.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-coal-950 px-4 py-8 sm:px-6 lg:px-8">
      {/* Dynamic Ambient Background Glows */}
      <div className="pointer-events-none fixed -left-36 -top-36 h-[32rem] w-[32rem] rounded-full bg-teal-500/20 blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-36 -right-36 h-[32rem] w-[32rem] rounded-full bg-zinc-500/10 blur-[120px]" />
      <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-teal-500/5 blur-[100px]" />

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-coal-900/70 shadow-2xl shadow-black/80 backdrop-blur-2xl transition-all">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Visual / Hero Section */}
          <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-coal-900 via-teal-800 to-teal-600 p-8 text-white sm:p-12 lg:col-span-6">
            {/* Background Pattern */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-teal-400/15 blur-2xl" />

            {/* Top Brand Bar */}
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-coal-900 text-white text-lg font-black shadow-xl">
                    F
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-white">
                      FOOD <span className="text-teal-300">WORLD</span>
                    </h2>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-white/75">
                      Enterprise POS & Kitchen OS
                    </p>
                  </div>
                </div>

                {onBack && (
                  <button
                    onClick={onBack}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-white hover:text-teal-700"
                  >
                    <Store size={14} />
                    <span>Storefront</span>
                  </button>
                )}
              </div>

              {/* Tagline */}
              <div className="mt-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                  <Sparkles size={13} />
                  <span>Restaurant Operations Portal</span>
                </div>
                <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                  Powering fresh bites & real-time kitchen efficiency.
                </h1>
                <p className="mt-3 text-sm font-medium leading-relaxed text-white/85">
                  Manage food & drink orders, configure menu pricing, monitor stock thresholds, and track live restaurant revenue in one unified terminal.
                </p>
              </div>
            </div>

            {/* Live Feature Highlights Pill Grid */}
            <div className="relative z-10 mt-8 grid grid-cols-3 gap-3 pt-6 border-t border-white/20">
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-white">
                  <ChefHat size={16} />
                  <span className="text-xs font-bold">KDS</span>
                </div>
                <p className="mt-1 text-[11px] font-semibold text-white/75">Live cooking queue</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-white">
                  <TrendingUp size={16} />
                  <span className="text-xs font-bold">Sales</span>
                </div>
                <p className="mt-1 text-[11px] font-semibold text-white/75">Real-time revenue</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-white">
                  <Receipt size={16} />
                  <span className="text-xs font-bold">POS</span>
                </div>
                <p className="mt-1 text-[11px] font-semibold text-white/75">Print receipts</p>
              </div>
            </div>
          </div>

          {/* Right Form Section */}
          <div className="flex flex-col justify-between p-6 sm:p-10 lg:col-span-6 lg:p-12">
            <div>
              {/* Top return link on mobile */}
              <div className="mb-6 flex items-center justify-between lg:hidden">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-coal-900 text-white text-sm font-black">
                    F
                  </span>
                  <span className="text-sm font-black text-white">
                    FOOD <span className="text-teal-300">WORLD</span>
                  </span>
                </div>
                {onBack && (
                  <button
                    onClick={onBack}
                    className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-teal-200"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Store</span>
                  </button>
                )}
              </div>

              {/* Header */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-white/10 px-3 py-1 text-xs font-bold text-teal-200">
                  <ShieldCheck size={14} />
                  <span>Owner Authentication</span>
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Sign in to Portal
                </h2>
                <p className="mt-1.5 text-xs text-zinc-400 sm:text-sm">
                  Access your restaurant inventory, orders, and sales analytics.
                </p>
              </div>

              {/* Error Message Box */}
              {error && (
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-semibold text-red-300 animate-fade-in">
                  <AlertCircle size={17} className="shrink-0 text-red-400" />
                  <p className="leading-relaxed">{error}</p>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Owner Email
                  </label>
                  <div className="relative mt-1.5">
                    <Mail
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@foodworld.com"
                      className="w-full rounded-2xl border border-coal-800 bg-coal-950/80 py-3.5 pl-11 pr-4 text-sm font-medium text-white outline-none transition placeholder:text-zinc-600 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                {/* Password with Show/Hide Toggle */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Password
                    </label>
                  </div>
                  <div className="relative mt-1.5">
                    <Lock
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-2xl border border-coal-800 bg-coal-950/80 py-3.5 pl-11 pr-11 text-sm font-medium text-white outline-none transition placeholder:text-zinc-600 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 py-4 text-sm font-black text-white shadow-xl shadow-teal-500/25 transition duration-300 hover:bg-teal-700 hover:shadow-teal-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Open Owner Dashboard</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom Footer & Store Return */}
            <div className="mt-8 border-t border-coal-800/80 pt-5 text-center text-xs text-zinc-500">
              <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
                <p>Protected by Food World Enterprise Auth</p>
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-1 font-bold text-teal-300 hover:underline"
                  >
                    <ArrowLeft size={13} />
                    <span>Return to Customer Store</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerLogin;
