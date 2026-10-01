import { useState } from "react";
import {
  ShoppingBasket,
  Sun,
  Moon,
  LayoutDashboard,
  Menu as MenuIcon,
  Clock,
  Home,
  Utensils,
  X,
  ChevronRight,
  ShieldAlert,
  LogIn,
  LogOut,
  UserCircle,
} from "lucide-react";

function Header({
  page,
  setPage,
  cartCount,
  onOpenCart,
  theme,
  toggleTheme,
  onOwner,
  customer,
  onOpenCustomerAuth,
  onCustomerSignOut,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const navLinks = [
    { id: "home", label: "Home", icon: Home },
    { id: "menu", label: "Menu", icon: Utensils },
    { id: "tracking", label: "Track Order", icon: Clock },
  ];

  const handleNavClick = (id) => {
    setPage(id);
    setMobileMenuOpen(false);
  };

  const handleOwnerClick = () => {
    onOwner();
    setMobileMenuOpen(false);
  };

  // Customer display name / initials
  const customerInitial = customer
    ? (customer.user_metadata?.full_name || customer.email || "U").charAt(0).toUpperCase()
    : null;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-coal-200/80 bg-white/80 px-3 py-2.5 backdrop-blur-xl dark:border-white/10 dark:bg-coal-950/80 sm:px-6 md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo */}
          <button
            onClick={() => handleNavClick("home")}
            className="group flex items-center gap-2 text-left"
            aria-label="Food World home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-coal-900 text-white text-base font-black shadow-lg shadow-teal-500/20 transition duration-300 group-hover:rotate-[-8deg] group-hover:scale-105 sm:h-10 sm:w-10 sm:text-lg">
              F
            </span>
            <span className="hidden text-base font-black tracking-tight text-zinc-900 dark:text-white xs:inline sm:text-lg">
              FOOD <span className="text-teal-600 dark:text-teal-400">WORLD</span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 rounded-full border border-coal-200/80 bg-coal-50/80 p-1 dark:border-white/10 dark:bg-white/5 sm:flex">
            {navLinks.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleNavClick(id)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition duration-300 ${
                  page === id
                    ? "bg-coal-900 text-white shadow-md dark:bg-white dark:text-zinc-900"
                    : "text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Desktop Owner Portal Link */}
            <button
              onClick={handleOwnerClick}
              className="hidden items-center gap-2 rounded-full border border-teal-500/30 px-3.5 py-2 text-xs font-bold text-teal-600 dark:text-teal-400 transition hover:-translate-y-0.5 hover:bg-teal-500/10 md:inline-flex"
            >
              <LayoutDashboard size={15} />
              <span>Owner Portal</span>
            </button>

            {/* Mobile Owner Portal Quick Access Button */}
            <button
              onClick={handleOwnerClick}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-500/30 text-teal-600 dark:text-teal-400 transition hover:bg-teal-500/10 md:hidden"
              aria-label="Owner Portal"
              title="Owner Portal"
            >
              <LayoutDashboard size={16} />
            </button>

            {/* Mobile Track Order Quick Button */}
            <button
              onClick={() => handleNavClick("tracking")}
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-zinc-500 transition hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 sm:hidden ${
                page === "tracking"
                  ? "border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400"
                  : "border-coal-200 dark:border-coal-700"
              }`}
              aria-label="Track Order"
              title="Track Order"
            >
              <Clock size={16} />
            </button>

            {/* Customer Account Button */}
            <div className="relative">
              {customer ? (
                <>
                  {/* Logged-in customer avatar */}
                  <button
                    onClick={() => setAccountMenuOpen((v) => !v)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-600 font-black text-xs transition hover:bg-teal-500/25 dark:text-teal-400"
                    aria-label="Customer account menu"
                    title={customer.email}
                  >
                    {customerInitial}
                  </button>

                  {/* Account dropdown */}
                  {accountMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setAccountMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-11 z-20 w-56 rounded-2xl border border-coal-200 bg-white shadow-xl dark:border-coal-800 dark:bg-coal-900 overflow-hidden">
                        <div className="px-4 py-3 border-b border-coal-100 dark:border-coal-800">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            Signed in as
                          </p>
                          <p className="mt-0.5 text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">
                            {customer.user_metadata?.full_name || customer.email}
                          </p>
                          <p className="text-[10px] text-zinc-500 truncate">{customer.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            setAccountMenuOpen(false);
                            onCustomerSignOut();
                          }}
                          className="flex w-full items-center gap-2.5 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                        >
                          <LogOut size={14} />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                /* Login button for guests */
                <button
                  onClick={onOpenCustomerAuth}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-coal-200 px-3 py-2 text-xs font-bold text-zinc-600 transition hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 dark:border-coal-700 dark:text-zinc-300"
                  aria-label="Sign in to rate products"
                  title="Sign in to rate products"
                >
                  <LogIn size={14} />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Guest login on mobile (icon only) */}
            {!customer && (
              <button
                onClick={onOpenCustomerAuth}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-coal-200 text-zinc-500 transition hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 dark:border-coal-700 sm:hidden"
                aria-label="Sign in"
                title="Sign in to rate products"
              >
                <UserCircle size={17} />
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-coal-200 text-zinc-500 transition hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 dark:border-coal-700 sm:h-10 sm:w-10"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Mobile Hamburger Menu Drawer Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-coal-200 text-zinc-600 transition hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 dark:border-coal-700 dark:text-zinc-300 sm:hidden"
              aria-label="Open navigation menu"
            >
              <MenuIcon size={17} />
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-1.5 rounded-full bg-teal-600 px-3 py-2 text-xs font-black text-white shadow-lg shadow-teal-500/20 transition hover:-translate-y-0.5 hover:bg-teal-700 sm:px-3.5 sm:py-2.5 sm:text-sm"
              aria-label="View Cart"
            >
              <ShoppingBasket size={16} />
              <span>{cartCount}</span>
              {cartCount > 0 && (
                <span className="cart-pulse absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coal-950 px-1 text-[9px] font-black text-white dark:bg-white dark:text-zinc-950">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation Backdrop & Panel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-coal-950/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Content */}
          <div className="relative ml-auto flex h-full w-4/5 max-w-xs flex-col justify-between border-l border-coal-200 bg-white p-6 shadow-2xl dark:border-coal-800 dark:bg-coal-950">
            <div>
              <div className="flex items-center justify-between border-b border-coal-100 pb-4 dark:border-coal-800">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-coal-900 text-white font-black">
                    F
                  </span>
                  <span className="font-black tracking-tight text-zinc-900 dark:text-white">
                    FOOD <span className="text-teal-600 dark:text-teal-400">WORLD</span>
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl p-2 text-zinc-400 hover:bg-coal-100 hover:text-zinc-900 dark:hover:bg-coal-800 dark:hover:text-white"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="mt-6 space-y-1.5">
                <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Navigation
                </p>
                {navLinks.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleNavClick(id)}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition ${
                      page === id
                        ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
                        : "text-zinc-600 hover:bg-coal-100 dark:text-zinc-300 dark:hover:bg-coal-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
                      <span>{label}</span>
                    </div>
                    <ChevronRight size={14} className="opacity-60" />
                  </button>
                ))}
              </div>

              {/* Customer Account Section in Mobile Drawer */}
              <div className="mt-6 border-t border-coal-100 pt-5 dark:border-coal-800">
                <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  My Account
                </p>
                {customer ? (
                  <div className="mt-2 rounded-2xl border border-coal-200 dark:border-coal-800 p-3.5">
                    <p className="text-xs font-black text-zinc-900 dark:text-white truncate">
                      {customer.user_metadata?.full_name || "Customer"}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">{customer.email}</p>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onCustomerSignOut();
                      }}
                      className="mt-2.5 flex items-center gap-2 text-xs font-bold text-red-500 hover:underline"
                    >
                      <LogOut size={13} /> Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenCustomerAuth();
                    }}
                    className="mt-2 flex w-full items-center justify-between rounded-2xl border border-coal-200 dark:border-coal-700 px-4 py-3 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition"
                  >
                    <div className="flex items-center gap-3">
                      <LogIn size={18} />
                      <span>Sign In to Rate</span>
                    </div>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>

              {/* Owner Portal Link in Mobile Drawer */}
              <div className="mt-4 border-t border-coal-100 pt-4 dark:border-coal-800">
                <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Restaurant Staff
                </p>
                <button
                  onClick={handleOwnerClick}
                  className="mt-2 flex w-full items-center justify-between rounded-2xl border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm font-bold text-teal-600 transition hover:bg-teal-600 hover:text-white dark:text-teal-400"
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard size={18} />
                    <span>Owner Dashboard</span>
                  </div>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Bottom Info */}
            <div className="border-t border-coal-100 pt-4 text-xs text-zinc-400 dark:border-coal-800">
              <div className="flex items-center gap-2">
                <ShieldAlert size={14} className="text-teal-600 dark:text-teal-400" />
                <span>Food World POS v2.0</span>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">Fast, fresh & secure ordering</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
