import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Clock,
  ChefHat,
  PackageCheck,
  CheckCircle,
  XCircle,
  Receipt,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Phone,
  MapPin,
  RefreshCw,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { trackOrder, searchOrders } from "../services/orderService";
import {
  formatCurrency,
  formatDateTime,
  formatOrderId,
  normalizeOrder,
  ORDER_STATUS_MAP,
} from "../utils/orderUtils";
import OrderReceiptModal from "./OrderReceiptModal";

const STEPS = [
  {
    key: "pending",
    label: "Order Placed",
    subtext: "We have received your order",
    icon: Clock,
  },
  {
    key: "preparing",
    label: "In Kitchen",
    subtext: "Chef is preparing your fresh meal",
    icon: ChefHat,
  },
  {
    key: "ready",
    label: "Ready for Delivery",
    subtext: "Packed & hot for pickup or courier",
    icon: PackageCheck,
  },
  {
    key: "completed",
    label: "Delivered",
    subtext: "Order fulfilled! Enjoy your meal",
    icon: CheckCircle,
  },
];

function getActiveStepIndex(status) {
  const s = (status || "pending").toLowerCase();
  if (s === "pending") return 0;
  if (s === "preparing") return 1;
  if (s === "ready") return 2;
  if (s === "completed" || s === "delivered") return 3;
  if (s === "cancelled") return -1;
  return 0;
}

function OrderTrackingPage({ products = [], initialOrderId = "", goToMenu }) {
  const [searchInput, setSearchInput] = useState(initialOrderId || "");
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [receiptOpen, setReceiptOpen] = useState(false);

  /**
   * Resilient order lookup function that searches by:
   * 1. Direct ID (if numeric)
   * 2. Embedded order_id in items json
   * 3. Mobile phone number or customer name
   */
  const performSearch = useCallback(async (queryText) => {
    const raw = queryText.trim().replace(/^#/, "").trim();
    if (!raw) {
      return { order: null, error: "Please enter a valid Order ID or Mobile Number." };
    }

    try {
      // 1. Try directly tracking by Order Number / ID
      try {
        const found = await trackOrder(raw);
        if (found) {
          const normalized = normalizeOrder(found, products);
          return { order: normalized, error: "" };
        }
      } catch {
        // Continue to search endpoint
      }

      // 2. Search by phone, name, or order id
      const matches = await searchOrders(raw);
      if (matches && matches.length > 0) {
        const normalized = normalizeOrder(matches[0], products);
        return { order: normalized, error: "" };
      }

      return { order: null, error: "Order not found. Please check your Order ID or phone number." };
    } catch (err) {
      console.error("Order lookup error:", err);
      return {
        order: null,
        error: "Unable to connect to the order service. Please try again.",
      };
    }
  }, [products]);

  // Auto-search asynchronously on mount when initialOrderId is provided
  useEffect(() => {
    let active = true;
    if (initialOrderId) {
      performSearch(initialOrderId).then((res) => {
        if (!active) return;
        setSearched(true);
        if (res.error) {
          setErrorMessage(res.error);
          setCurrentOrder(null);
        } else if (res.order) {
          setCurrentOrder(res.order);
          setErrorMessage("");
        } else {
          setCurrentOrder(null);
          setErrorMessage("Order not found. Please check your Order ID.");
        }
      });
    }

    return () => {
      active = false;
    };
  }, [initialOrderId, performSearch]);

  // Live status refresh for the actively tracked order
  useEffect(() => {
    const orderKey = currentOrder?.order_id || currentOrder?.orderNumber || currentOrder?.id;
    if (!orderKey) return;

    const interval = setInterval(async () => {
      try {
        const updated = await trackOrder(orderKey);
        if (updated) {
          setCurrentOrder(normalizeOrder(updated, products));
        }
      } catch {
        // ignore polling error
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentOrder?.id, currentOrder?.orderNumber, currentOrder?.order_id, products]);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setLoading(true);
    setErrorMessage("");
    setSearched(true);

    const result = await performSearch(searchInput);
    setLoading(false);

    if (result.error) {
      setErrorMessage(result.error);
      setCurrentOrder(null);
    } else if (result.order) {
      setCurrentOrder(result.order);
      setErrorMessage("");
    } else {
      setCurrentOrder(null);
      setErrorMessage("Order not found. Please check your Order ID.");
    }
  };

  const activeStep = currentOrder ? getActiveStepIndex(currentOrder.status) : 0;
  const isCancelled = (currentOrder?.status || "").toLowerCase() === "cancelled";
  const items = currentOrder?.items || [];
  const statusConfig = ORDER_STATUS_MAP[(currentOrder?.status || "pending").toLowerCase()] || ORDER_STATUS_MAP.pending;
  const trackingUrl = typeof window !== "undefined" && currentOrder
    ? `${window.location.origin}${window.location.pathname}?tracking=${encodeURIComponent(currentOrder.order_id || currentOrder.id)}`
    : "";
  return (
    <div className="min-h-[80vh] px-4 py-10 sm:px-6 md:px-10">
      <div className="mx-auto max-w-4xl">
        {/* Title Header */}
        <div className="text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">
            <Sparkles size={14} /> Live Kitchen Tracking
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-5xl">
            Track Your <span className="text-teal-600 dark:text-teal-400">Order</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-500 dark:text-zinc-400">
            Enter your unique Order ID (e.g. <span className="font-mono font-bold text-teal-600 dark:text-teal-400">FW-86712</span>) to see real-time progress.
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-2xl border border-coal-200 bg-white p-2 shadow-xl shadow-coal-300/40 transition focus-within:border-teal-500 dark:border-coal-800 dark:bg-coal-900 dark:shadow-none"
          >
            <div className="flex flex-1 items-center pl-3">
              <Search size={18} className="text-zinc-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Order ID (e.g. FW-86712) or Mobile Number..."
                className="w-full bg-transparent px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchInput.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-3 text-xs font-black text-white shadow-md shadow-teal-500/25 transition hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Track</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Informative Error State */}
        {errorMessage && (
          <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center text-xs font-semibold text-red-600 dark:text-red-400 animate-fade-in flex items-center justify-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Active Order Details View */}
        {currentOrder && (
          <div className="mt-10 space-y-6 animate-fade-up">
            {/* Status Header Card */}
            <div className="rounded-3xl border border-coal-200 bg-white p-6 shadow-sm dark:border-coal-800 dark:bg-coal-900 sm:p-8">
              <div className="flex flex-col justify-between gap-4 border-b border-coal-100 pb-6 dark:border-coal-800 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Order</span>
                    <span className="font-mono text-lg font-black text-teal-600 dark:text-teal-400">
                      {formatOrderId(currentOrder)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusConfig.badgeClass}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${statusConfig.dotClass} animate-pulse`} />
                      {statusConfig.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    Placed on {formatDateTime(currentOrder.created_at)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      performSearch(searchInput || currentOrder.order_id).then((res) => {
                        if (res.order) setCurrentOrder(res.order);
                      });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-coal-200 px-3 py-2 text-xs font-bold text-zinc-600 transition hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 dark:border-coal-700 dark:text-zinc-300"
                    title="Refresh order status"
                  >
                    <RefreshCw size={13} />
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={() => setReceiptOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-teal-500/20 transition hover:bg-teal-700"
                  >
                    <Receipt size={14} />
                    <span>Digital Receipt</span>
                  </button>
                </div>
              </div>

              {/* Visual Order Progress Stepper */}
              {isCancelled ? (
                <div className="my-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
                  <XCircle className="mx-auto text-red-500" size={36} />
                  <h3 className="mt-2 text-lg font-bold text-red-600 dark:text-red-400">Order Cancelled</h3>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    This order has been cancelled by the restaurant or customer.
                  </p>
                </div>
              ) : (
                <div className="my-8">
                  {/* Stepper Progress Bar */}
                  <div className="relative">
                    {/* Track line */}
                    <div className="absolute left-0 top-6 hidden h-1 w-full bg-coal-200 dark:bg-coal-800 sm:block">
                      <div
                        className="h-1 bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-700"
                        style={{
                          width: `${(Math.max(0, activeStep) / (STEPS.length - 1)) * 100}%`,
                        }}
                      />
                    </div>

                    {/* Step Nodes */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 sm:gap-2">
                      {STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        const isDone = activeStep > idx;
                        const isCurrent = activeStep === idx;

                        return (
                          <div key={step.key} className="relative flex items-center gap-4 sm:flex-col sm:text-center">
                            {/* Node circle */}
                            <div
                              className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 transition duration-500 ${
                                isDone
                                  ? "border-teal-500 bg-teal-600 text-white shadow-lg shadow-teal-500/30"
                                  : isCurrent
                                  ? "border-teal-500 bg-white text-teal-600 dark:text-teal-400 shadow-xl shadow-teal-500/30 ring-4 ring-teal-500/20 dark:bg-coal-900"
                                  : "border-coal-200 bg-coal-100 text-zinc-400 dark:border-coal-800 dark:bg-coal-800"
                              }`}
                            >
                              <Icon size={20} className={isCurrent ? "animate-bounce" : ""} />
                            </div>

                            {/* Node Label & text */}
                            <div>
                              <p
                                className={`text-xs font-black sm:mt-2 ${
                                  isCurrent
                                    ? "text-teal-600 dark:text-teal-400"
                                    : isDone
                                    ? "text-zinc-900 dark:text-white"
                                    : "text-zinc-400 dark:text-zinc-500"
                                }`}
                              >
                                {step.label}
                              </p>
                              <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                                {step.subtext}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Step Highlight Box */}
                  <div className="mt-8 flex items-center gap-3 rounded-2xl bg-teal-500/10 p-4 text-xs font-medium text-teal-700 dark:text-teal-300">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white font-bold">
                      {activeStep + 1}
                    </span>
                    <div>
                      <p className="font-bold">{statusConfig.description}</p>
                      <p className="text-[11px] opacity-80">
                        Estimated preparation & delivery: 25–35 minutes
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Details & Summary Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              {/* Items List */}
              <div className="rounded-3xl border border-coal-200 bg-white p-6 shadow-sm dark:border-coal-800 dark:bg-coal-900 md:col-span-7 sm:p-7">
                <h3 className="flex items-center gap-2 text-base font-black text-zinc-900 dark:text-white">
                  <ShoppingBag size={18} className="text-teal-600 dark:text-teal-400" />
                  <span>Ordered Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                </h3>

                <div className="mt-4 divide-y divide-coal-100 dark:divide-coal-800">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-12 w-12 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 font-bold text-teal-600 dark:text-teal-400">
                            F
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.title}</p>
                          <p className="text-xs text-zinc-500">
                            {formatCurrency(item.price)} × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right"><span className="text-sm font-black text-zinc-900 dark:text-white">{formatCurrency(item.price * item.quantity)}</span></div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="py-4 text-xs text-zinc-400 italic">No item breakdown found.</p>
                  )}
                </div>

                <div className="mt-4 border-t border-dashed border-coal-200 pt-4 text-xs dark:border-coal-800">
                  <div className="flex justify-between py-1 text-zinc-500">
                    <span>Subtotal</span>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {formatCurrency(currentOrder.subtotal || currentOrder.total_amount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-zinc-500">
                    <span>Delivery Charge</span>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {formatCurrency(currentOrder.delivery_fee ?? 150)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-zinc-500">
                    <span>GST / Tax (15%)</span>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {formatCurrency(currentOrder.tax ?? 0)}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-coal-100 pt-2 text-sm font-black dark:border-coal-800">
                    <span className="text-zinc-900 dark:text-white">Total Amount</span>
                    <span className="text-base text-teal-600 dark:text-teal-400">
                      {formatCurrency(currentOrder.total_amount || currentOrder.total || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery & QR Code Panel */}
              <div className="flex flex-col gap-6 md:col-span-5">
                {/* Customer & Address */}
                <div className="rounded-3xl border border-coal-200 bg-white p-6 shadow-sm dark:border-coal-800 dark:bg-coal-900">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                    Delivery Details
                  </h3>
                  <div className="mt-3 space-y-2 text-xs">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">
                      {currentOrder.customer_name || "Guest Customer"}
                    </p>
                    {currentOrder.mobile && (
                      <p className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                        <Phone size={13} className="text-teal-600 dark:text-teal-400" />
                        <span>{currentOrder.mobile}</span>
                      </p>
                    )}
                    {currentOrder.address && (
                      <p className="flex items-start gap-1.5 text-zinc-600 dark:text-zinc-400">
                        <MapPin size={13} className="mt-0.5 shrink-0 text-teal-600 dark:text-teal-400" />
                        <span>{currentOrder.address}</span>
                      </p>
                    )}
                    {currentOrder.special_instructions && (
                      <p className="mt-2 rounded-xl bg-teal-500/10 p-2.5 text-[11px] font-medium text-teal-700 dark:text-teal-300">
                        <span className="font-bold">Instructions:</span> {currentOrder.special_instructions}
                      </p>
                    )}
                  </div>
                </div>

                {/* QR Code Quick Card */}
                <div className="flex flex-col items-center rounded-3xl border border-coal-200 bg-white p-6 text-center shadow-sm dark:border-coal-800 dark:bg-coal-900">
                  <div className="rounded-2xl border border-coal-200 bg-white p-2.5 shadow-sm dark:border-coal-700">
                    <QRCodeSVG
                      value={trackingUrl}
                      size={100}
                      level="M"
                      fgColor="#09090b"
                    />
                  </div>
                  <p className="mt-3 text-xs font-bold text-zinc-900 dark:text-white">
                    Unique Order QR Code
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    Scan with smartphone camera to instantly reopen this tracking screen.
                  </p>
                </div>
              </div>
            </div>

            {/* Back to menu button */}
            <div className="pt-4 text-center">
              <button
                onClick={goToMenu}
                className="inline-flex items-center gap-2 rounded-full border border-coal-300 px-6 py-3 text-sm font-bold text-zinc-700 transition hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 dark:border-coal-700 dark:text-zinc-300"
              >
                <span>Order More Food</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Empty state when no search performed */}
        {!currentOrder && !searched && (
          <div className="mt-14 rounded-3xl border border-dashed border-coal-200 p-12 text-center dark:border-coal-800">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Clock size={28} />
            </div>
            <h3 className="mt-4 text-lg font-black text-zinc-900 dark:text-white">
              Ready to check your order status?
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-xs text-zinc-500">
              Enter your Order ID (e.g. <span className="font-mono font-bold text-teal-600 dark:text-teal-400">FW-86712</span>) from your confirmation to get live updates.
            </p>
          </div>
        )}
      </div>

      {/* Modal for Digital Receipt */}
      {receiptOpen && currentOrder && (
        <OrderReceiptModal
          order={currentOrder}
          products={products}
          isOpen={receiptOpen}
          onClose={() => setReceiptOpen(false)}
        />
      )}
    </div>
  );
}

export default OrderTrackingPage;
