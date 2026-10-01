import { useState } from "react";
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  CheckCheck,
} from "lucide-react";
import { formatCurrency, timeAgo } from "../utils/orderUtils";

export function NotificationToast({ toast, onDismiss, onViewOrder }) {
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-slide-up rounded-2xl border border-teal-500/30 bg-coal-950 p-4 text-white shadow-2xl shadow-teal-950/40 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-500/30">
          <Sparkles size={18} />
        </div>
        <div className="flex-1 pr-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-400">
              {toast.title || "New Order Alert"}
            </span>
            <span className="text-[10px] text-zinc-400">Just now</span>
          </div>
          <p className="mt-0.5 text-xs font-bold text-zinc-100">{toast.message}</p>
          {toast.amount && (
            <p className="mt-1 text-xs font-black text-teal-400">
              Total: {formatCurrency(toast.amount)}
            </p>
          )}

          {toast.order && (
            <button
              onClick={() => {
                onViewOrder(toast.order);
                onDismiss();
              }}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-teal-400 hover:text-teal-300"
            >
              <span>View details</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="rounded-lg p-1 text-zinc-400 hover:bg-coal-800 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export function NotificationBell({ notifications = [], onClear, onViewOrder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("foodworld-sound") !== "disabled";
    }
    return true;
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("foodworld-sound", next ? "enabled" : "disabled");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-xl border border-coal-200 p-2.5 text-zinc-500 transition hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 dark:border-coal-800 dark:text-zinc-400"
        title="Notifications"
        aria-label="Order notifications"
      >
        {unreadCount > 0 ? (
          <BellRing size={18} className="text-teal-600 dark:text-teal-400 animate-bounce" />
        ) : (
          <Bell size={18} />
        )}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-black text-white shadow-md">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-coal-200 bg-white p-4 shadow-2xl dark:border-coal-800 dark:bg-coal-900 animate-fade-in sm:w-96">
          <div className="flex items-center justify-between border-b border-coal-100 pb-3 dark:border-coal-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-zinc-900 dark:text-white">
                Live Alerts
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-600 dark:text-teal-400">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={toggleSound}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-coal-100 hover:text-zinc-700 dark:hover:bg-coal-800 dark:hover:text-zinc-200"
                title={soundEnabled ? "Mute alert chime" : "Unmute alert chime"}
              >
                {soundEnabled ? <Volume2 size={15} className="text-teal-600 dark:text-teal-400" /> : <VolumeX size={15} />}
              </button>
              {notifications.length > 0 && (
                <button
                  onClick={onClear}
                  className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400"
                >
                  <CheckCheck size={13} />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* List of alerts */}
          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (notif.order) {
                    onViewOrder(notif.order);
                    setIsOpen(false);
                  }
                }}
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl p-2.5 text-xs transition ${
                  notif.read
                    ? "bg-coal-50 dark:bg-coal-800/40 text-zinc-500"
                    : "bg-teal-500/10 text-zinc-900 dark:text-zinc-100 font-medium"
                } hover:bg-teal-500/20`}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white">
                  <ShoppingBag size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="truncate font-bold">{notif.title}</p>
                    <span className="text-[10px] text-zinc-400">{timeAgo(notif.time)}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{notif.message}</p>
                  {notif.amount && (
                    <p className="mt-0.5 text-[11px] font-bold text-teal-600 dark:text-teal-400">
                      {formatCurrency(notif.amount)}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <p className="py-8 text-center text-xs text-zinc-400 italic">
                No recent order notifications
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
