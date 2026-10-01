import { useState } from "react";
import {
  Clock,
  ChefHat,
  PackageCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Receipt,
  Search,
  Flame,
} from "lucide-react";
import {
  formatCurrency,
  formatDateTime,
  formatOrderId,
  normalizeOrder,
  ORDER_STATUS_MAP,
  timeAgo,
} from "../utils/orderUtils";

const FILTER_TABS = [
  { id: "all", label: "All Orders" },
  { id: "pending", label: "Pending", icon: Clock },
  { id: "preparing", label: "Preparing", icon: ChefHat },
  { id: "ready", label: "Ready", icon: PackageCheck },
  { id: "completed", label: "Completed", icon: CheckCircle },
  { id: "cancelled", label: "Cancelled", icon: XCircle },
];

function KitchenDisplay({ orders = [], products = [], onStatusChange, onViewReceipt }) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedOrders = orders.map((o) => normalizeOrder(o, products));

  const filteredOrders = normalizedOrders
    .filter((order) => {
      const rawStatus = (order.status || "pending").toLowerCase();
      const matchesStatus =
        filterStatus === "all"
          ? true
          : filterStatus === "completed"
          ? rawStatus === "completed" || rawStatus === "delivered"
          : rawStatus === filterStatus;

      const idStr = String(order.id || "");
      const orderIdStr = String(order.order_id || "");
      const customerStr = String(order.customer_name || "");
      const phoneStr = String(order.mobile || "");
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        !searchQuery ||
        idStr.includes(query) ||
        orderIdStr.toLowerCase().includes(query) ||
        customerStr.toLowerCase().includes(query) ||
        phoneStr.includes(query);

      return matchesStatus && matchesSearch;
    })
    // FIFO: oldest orders first so kitchen processes them in arrival order
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const getStatusCount = (statusKey) => {
    if (statusKey === "all") return normalizedOrders.length;
    if (statusKey === "completed") {
      return normalizedOrders.filter(
        (o) => (o.status || "").toLowerCase() === "completed" || (o.status || "").toLowerCase() === "delivered"
      ).length;
    }
    return normalizedOrders.filter((o) => (o.status || "pending").toLowerCase() === statusKey).length;
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white">
              <Flame size={16} />
            </span>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
              Kitchen Order Management (KDS)
            </h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Real-time kitchen queue · <span className="font-bold text-teal-600 dark:text-teal-400">Oldest first · FIFO</span> — process top-left orders first.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search size={16} className="absolute left-3 top-3 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, customer, phone..."
            className="w-full rounded-xl border border-coal-200 bg-white py-2.5 pl-9 pr-3 text-xs outline-none focus:border-teal-500 dark:border-coal-800 dark:bg-coal-900"
          />
        </div>
      </div>

      {/* Filter Tabs with Live Count Badges */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => {
          const count = getStatusCount(tab.id);
          const active = filterStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition duration-200 ${
                active
                  ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
                  : "border border-coal-200 bg-white text-zinc-600 hover:border-teal-500/50 dark:border-coal-800 dark:bg-coal-900 dark:text-zinc-400"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  active ? "bg-white/20 text-white" : "bg-coal-100 text-zinc-700 dark:bg-coal-800 dark:text-zinc-300"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredOrders.map((order) => {
          const items = order.items || [];
          const statusKey = order.status || "pending";
          const statusInfo = ORDER_STATUS_MAP[statusKey] || ORDER_STATUS_MAP.pending;
          const orderIdText = formatOrderId(order);

          return (
            <div
              key={order.id}
              className={`flex flex-col justify-between rounded-3xl border bg-white p-5 shadow-sm transition hover:shadow-lg dark:bg-coal-900 ${
                statusKey === "pending"
                  ? "border-amber-500/40 dark:border-amber-500/30"
                  : statusKey === "preparing"
                  ? "border-blue-500/40 dark:border-blue-500/30"
                  : statusKey === "ready"
                  ? "border-teal-500/40 dark:border-teal-500/30"
                  : "border-coal-200 dark:border-coal-800"
              }`}
            >
              {/* Order Card Header */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-black text-teal-600 dark:text-teal-400">
                        {orderIdText}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold capitalize ${statusInfo.badgeClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`} />
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-400">
                      <Clock size={11} />
                      <span>{timeAgo(order.created_at)}</span>
                      <span>•</span>
                      <span>{formatDateTime(order.created_at)}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => onViewReceipt(order)}
                    className="rounded-xl border border-coal-200 p-2 text-zinc-500 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 dark:border-coal-800"
                    title="View Digital Receipt"
                  >
                    <Receipt size={16} />
                  </button>
                </div>

                {/* Customer Info */}
                <div className="mt-3 rounded-2xl bg-coal-50 p-3 text-xs dark:bg-coal-950/60">
                  <div className="flex justify-between">
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {order.customer_name || "Guest Customer"}
                    </span>
                    <span className="font-semibold text-zinc-500">
                      {order.mobile || "No phone"}
                    </span>
                  </div>
                  {order.address && (
                    <p className="mt-1 line-clamp-1 text-[11px] text-zinc-400">
                      {order.address}
                    </p>
                  )}
                  {order.special_instructions && (
                    <div className="mt-2 flex items-start gap-1 rounded-lg bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      <AlertCircle size={12} className="mt-0.5 shrink-0" />
                      <span>Special Note: {order.special_instructions}</span>
                    </div>
                  )}
                </div>

                {/* Items Checklist */}
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    Kitchen Items ({items.reduce((s, i) => s + i.quantity, 0)})
                  </p>
                  <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl bg-coal-50/70 px-2.5 py-1.5 text-xs dark:bg-coal-800/40"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-teal-600 text-[10px] font-black text-white">
                            {item.quantity}x
                          </span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {item.title}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <p className="text-xs text-zinc-400 italic">No item list found</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons & Status Advancement */}
              <div className="mt-5 border-t border-coal-100 pt-3 dark:border-coal-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-500">Order Total</span>
                  <span className="font-black text-teal-600 dark:text-teal-400">
                    {formatCurrency(order.total_amount || 0)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {statusKey === "pending" && (
                    <button
                      onClick={() => onStatusChange(order.id, "preparing")}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-500"
                    >
                      <ChefHat size={14} />
                      <span>Start Cooking</span>
                    </button>
                  )}

                  {statusKey === "preparing" && (
                    <button
                      onClick={() => onStatusChange(order.id, "ready")}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-teal-500"
                    >
                      <PackageCheck size={14} />
                      <span>Mark Ready</span>
                    </button>
                  )}

                  {statusKey === "ready" && (
                    <button
                      onClick={() => onStatusChange(order.id, "completed")}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500"
                    >
                      <CheckCircle size={14} />
                      <span>Complete Order</span>
                    </button>
                  )}

                  {/* Quick Dropdown for Direct Selection */}
                  <select
                    value={statusKey}
                    onChange={(e) => onStatusChange(order.id, e.target.value)}
                    className="rounded-xl border border-coal-200 bg-coal-50 px-2.5 py-2 text-xs font-bold text-zinc-700 outline-none hover:border-teal-500 dark:border-coal-700 dark:bg-coal-800 dark:text-zinc-300"
                  >
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  {statusKey !== "cancelled" && statusKey !== "completed" && (
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to cancel this order?")) {
                          onStatusChange(order.id, "cancelled");
                        }
                      }}
                      className="rounded-xl p-2 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                      title="Cancel Order"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="rounded-3xl border border-dashed border-coal-200 p-14 text-center dark:border-coal-800">
          <ChefHat className="mx-auto text-zinc-400" size={36} />
          <h3 className="mt-3 text-base font-black text-zinc-900 dark:text-white">
            No orders in this category
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            {filterStatus === "all"
              ? "No customer orders have been placed yet."
              : `There are currently 0 orders with status "${filterStatus}".`}
          </p>
        </div>
      )}
    </div>
  );
}

export default KitchenDisplay;
