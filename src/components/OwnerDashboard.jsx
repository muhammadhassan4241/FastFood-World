import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Boxes,
  ChefHat,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  PackagePlus,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  createProduct,
  updateProduct,
  deleteProduct as deleteProductFromMongo,
} from "../services/productService";
import { updateOrderStatus as updateOrderStatusApi } from "../services/orderService";
import {
  formatCurrency,
  formatDateTime, 
  formatOrderId,
  normalizeOrder,
  ORDER_STATUS_MAP,
  playNotificationSound,
} from "../utils/orderUtils";
import KitchenDisplay from "./KitchenDisplay";
import SalesAnalytics from "./SalesAnalytics";
import OrderReceiptModal from "./OrderReceiptModal";
import { NotificationBell, NotificationToast } from "./NotificationToast";

const PRODUCT_CATEGORIES = [
  "Burger",
  "Pizza",
  "Fries",
  "Chicken",
  "Shawarma",
  "Drinks",
  "Dessert",
  "Other",
];

const EMPTY_PRODUCT = {
  name: "",
  price: "",
  image: "",
  category: "Burger",
  description: "",
  stock_quantity: 25,
  low_stock_threshold: 5,
  is_available: true,
};

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "kitchen", label: "Kitchen (KDS)", icon: ChefHat },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "products", label: "Products & Drinks", icon: Boxes },
  { id: "inventory", label: "Inventory", icon: ShoppingBag },
  { id: "customers", label: "Customers", icon: Users },
  { id: "reports", label: "Sales Analytics", icon: BarChart3 },
];

function money(value) {
  return formatCurrency(value);
}

function StatCard({ label, value, change, icon: Icon, tone = "brand" }) {
  const tones = {
    brand: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    blue: "bg-blue-500/10 text-blue-500",
    green: "bg-emerald-500/10 text-emerald-500",
    purple: "bg-violet-500/10 text-violet-500",
  };
  return (
    <div className="rounded-3xl border border-coal-200 dark:border-coal-800 bg-white dark:bg-coal-900 p-4 sm:p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl ${tones[tone]}`}>
          <Icon size={20} />
        </div>
        <span className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-emerald-500">
          <ArrowUpRight size={13} />
          {change}
        </span>
      </div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white truncate">
        {value}
      </p>
    </div>
  );
}

function ProductModal({ product, onClose, onSave, saving }) {
  const [form, setForm] = useState(product || EMPTY_PRODUCT);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-coal-950/70 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative my-auto w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-coal-200 bg-white shadow-2xl dark:border-coal-800 dark:bg-coal-900 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-coal-100 dark:border-coal-800 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">Catalog</p>
            <h2 className="mt-0.5 text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
              {product.id ? "Edit product / drink" : "Add new product / drink"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-coal-100 hover:text-zinc-900 dark:hover:bg-coal-800 dark:hover:text-white"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body with Scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Product Name */}
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              Name / Title *
              <input
                type="text"
                required
                value={form.name ?? form.title ?? ""}
                onChange={(e) => {
                  update("name", e.target.value);
                  update("title", e.target.value);
                }}
                placeholder="e.g. Coca Cola or Crispy Zinger"
                className="mt-1.5 w-full rounded-xl border border-coal-200 bg-coal-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none transition focus:border-teal-500 dark:border-coal-700 dark:bg-coal-950 dark:text-white"
              />
            </label>

            {/* Category Dropdown */}
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              Category *
              <select
                value={form.category || "Burger"}
                onChange={(e) => update("category", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-coal-200 bg-coal-50 px-3.5 py-2.5 text-sm font-semibold text-zinc-900 outline-none transition focus:border-teal-500 dark:border-coal-700 dark:bg-coal-950 dark:text-white"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>

            {/* Price */}
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              Price (Rs.) *
              <input
                type="number"
                min="0"
                step="1"
                required
                value={form.price ?? ""}
                onChange={(e) => update("price", Number(e.target.value))}
                placeholder="e.g. 150"
                className="mt-1.5 w-full rounded-xl border border-coal-200 bg-coal-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none transition focus:border-teal-500 dark:border-coal-700 dark:bg-coal-950 dark:text-white"
              />
            </label>

            {/* Stock Quantity */}
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              Stock Quantity
              <input
                type="number"
                min="0"
                value={form.stock_quantity ?? 25}
                onChange={(e) => update("stock_quantity", Number(e.target.value))}
                placeholder="25"
                className="mt-1.5 w-full rounded-xl border border-coal-200 bg-coal-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none transition focus:border-teal-500 dark:border-coal-700 dark:bg-coal-950 dark:text-white"
              />
            </label>

            {/* Low-stock Threshold */}
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              Low-stock Alert Level
              <input
                type="number"
                min="1"
                value={form.low_stock_threshold ?? 5}
                onChange={(e) => update("low_stock_threshold", Number(e.target.value))}
                placeholder="5"
                className="mt-1.5 w-full rounded-xl border border-coal-200 bg-coal-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none transition focus:border-teal-500 dark:border-coal-700 dark:bg-coal-950 dark:text-white"
              />
            </label>

            {/* Image URL */}
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              Image URL
              <input
                type="url"
                value={form.image ?? ""}
                onChange={(e) => update("image", e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="mt-1.5 w-full rounded-xl border border-coal-200 bg-coal-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none transition focus:border-teal-500 dark:border-coal-700 dark:bg-coal-950 dark:text-white"
              />
            </label>

            {/* Description */}
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 sm:col-span-2">
              Description
              <textarea
                value={form.description ?? ""}
                onChange={(e) => update("description", e.target.value)}
                rows={2}
                placeholder="Crisp, chilled 350ml beverage or meal details..."
                className="mt-1.5 w-full resize-none rounded-xl border border-coal-200 bg-coal-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none transition focus:border-teal-500 dark:border-coal-700 dark:bg-coal-950 dark:text-white"
              />
            </label>

            {/* Availability Checkbox */}
            <div className="sm:col-span-2 rounded-2xl border border-coal-200 bg-coal-50/70 p-3.5 dark:border-coal-800 dark:bg-coal-950/60">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.is_available !== false)}
                  onChange={(e) => update("is_available", e.target.checked)}
                  className="h-5 w-5 rounded-md accent-teal-600 cursor-pointer"
                />
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">
                    Available on Customer Storefront
                  </p>
                  <p className="text-xs text-zinc-500">
                    If disabled, this item will be hidden from the menu without deleting it.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-coal-100 dark:border-coal-800 px-5 py-4 sm:px-6 bg-coal-50/60 dark:bg-coal-950/40">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-zinc-500 hover:bg-coal-200/60 dark:hover:bg-coal-800"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            onClick={() => onSave(form)}
            className="rounded-xl bg-teal-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-teal-500/20 transition hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Product / Drink"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OwnerDashboard({
  products = [],
  orders = [],
  ordersLoading = false,
  ordersError = "",
  user,
  onSignOut,
  onProductsChanged,
  onOrdersChanged,
  onBackToStore,
  ratingSummaries = {},
}) {
  const [section, setSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [modalProduct, setModalProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [activeReceiptOrder, setActiveReceiptOrder] = useState(null);

  // Real-time notifications state
  const [notifications, setNotifications] = useState([]);
  const [currentToast, setCurrentToast] = useState(null);

  const normalizedOrdersList = useMemo(() => {
    return orders.map((o) => normalizeOrder(o, products));
  }, [orders, products]);

  // Live polling & order tracking for incoming orders
  useEffect(() => {
    let lastOrderCount = orders.length;

    const interval = setInterval(async () => {
      try {
        if (typeof onOrdersChanged === "function") {
          await onOrdersChanged();
        }
      } catch (err) {
        console.warn("Live order refresh notice:", err?.message);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [onOrdersChanged, orders.length]);

  // Notify on new incoming orders
  useEffect(() => {
    if (!orders || orders.length === 0) return;
    const latestOrder = orders[0];
    const latestKey = latestOrder.id || latestOrder._id || latestOrder.order_id;
    const storedLatest = sessionStorage.getItem("foodworld-last-seen-order");

    if (storedLatest && storedLatest !== String(latestKey)) {
      if (typeof window !== "undefined" && localStorage.getItem("foodworld-sound") !== "disabled") {
        playNotificationSound();
      }

      const toastData = {
        id: Date.now(),
        title: "New Order Placed!",
        message: `Order ${formatOrderId(latestOrder)} from ${latestOrder.customer_name || "Guest"}`,
        amount: latestOrder.total_amount || latestOrder.total,
        order: latestOrder,
        time: new Date(),
        read: false,
      };
      setCurrentToast(toastData);
      setNotifications((prev) => [toastData, ...prev.slice(0, 20)]);
    }

    if (latestKey) {
      sessionStorage.setItem("foodworld-last-seen-order", String(latestKey));
    }
  }, [orders]);

  const stats = useMemo(() => {
    // Only count completed/delivered orders for revenue — matches SalesAnalytics
    const revenue = normalizedOrdersList
      .filter((o) => ["completed", "delivered"].includes((o.status || "").toLowerCase()))
      .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const pending = normalizedOrdersList.filter(
      (order) => (order.status || "pending").toLowerCase() === "pending"
    ).length;
    const stock = products.reduce((sum, product) => sum + Number(product.stock_quantity ?? 0), 0);
    const lowStock = products.filter(
      (product) => Number(product.stock_quantity ?? 0) <= Number(product.low_stock_threshold ?? 5)
    ).length;
    return { revenue, pending, stock, lowStock };
  }, [normalizedOrdersList, products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      [product.name, product.title, product.category, product.description]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }, [products, query]);

  const customers = useMemo(() => {
    // Reverse so the LATEST order for each customer is the one that overwrites in the Map
    return [
      ...new Map(
        [...normalizedOrdersList]
          .reverse()
          .map((order) => [order.mobile || order.customer_name, order])
      ).values(),
    ].reverse(); // restore recency order for display
  }, [normalizedOrdersList]);

const saveProduct = async (form) => {
  setSaving(true);
  setNotice("");

  const payload = {
    name: form.name || form.title,
    title: form.title || form.name,
    price: Number(form.price),
    image: form.image || "",
    category: form.category || "Burger",
    description: form.description || "",
    stock_quantity: Number(form.stock_quantity || 0),
    low_stock_threshold: Number(form.low_stock_threshold || 5),
    is_available: Boolean(form.is_available !== false),
  };

  try {
    if (form.id) {
      await updateProduct(form.id, payload);
      setNotice("Product updated successfully in catalog.");
    } else {
      await createProduct(payload);
      setNotice("New product added successfully to catalog.");
    }

    setModalProduct(null);
    await onProductsChanged();
  } catch (error) {
    console.error("Product save error:", error);
    setNotice(`Notice: ${error.message}`);
  } finally {
    setSaving(false);
  }
};

const deleteProduct = async (id) => {
  if (
    !window.confirm(
      "Are you sure you want to delete this product/drink from the catalog?"
    )
  ) {
    return;
  }

  try {
    await deleteProductFromMongo(id);

    setNotice("Product deleted from catalog.");
    await onProductsChanged();
  } catch (error) {
    console.error("Product delete error:", error);
    setNotice(`Note: ${error.message}`);
  }
};

  const updateOrderStatus = async (id, status) => {
    try {
      await updateOrderStatusApi(id, status);
      setNotice(`Order #${id} status updated to ${status}.`);
      onOrdersChanged();
    } catch (error) {
      setNotice(`Update notice: ${error.message}`);
    }
  };

  const title = navItems.find((item) => item.id === section)?.label || "Overview";

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 dark:bg-coal-950 dark:text-zinc-100 overflow-x-hidden">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-coal-950/60 backdrop-blur-sm transition-opacity lg:hidden"
        />
      )}

      {/* Sidebar Navigation Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col justify-between border-r border-coal-200 bg-white p-5 transition-transform duration-300 dark:border-coal-800 dark:bg-coal-900 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand & Mobile Close Button */}
          <div className="flex items-center justify-between px-1 py-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-coal-900 text-white text-lg font-black shadow-lg shadow-teal-500/20">
                F
              </div>
              <div>
                <p className="font-black tracking-tight">
                  FOOD <span className="text-teal-600 dark:text-teal-400">WORLD</span>
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">
                  Owner POS & KDS
                </p>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-xl p-1.5 text-zinc-400 hover:bg-coal-100 hover:text-zinc-900 dark:hover:bg-coal-800 dark:hover:text-white lg:hidden"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Workspace Info Card */}
          <div className="my-5 rounded-2xl bg-teal-500/10 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">Workspace</p>
            <p className="mt-0.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Main Kitchen & POS</p>
            <p className="mt-0.5 truncate text-xs text-zinc-500">{user?.email}</p>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setSection(id);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  section === id
                    ? "bg-teal-600 text-white shadow-lg shadow-teal-500/20 font-bold"
                    : "text-zinc-500 hover:bg-coal-100 hover:text-zinc-900 dark:hover:bg-coal-800 dark:hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
                {id === "kitchen" && stats.pending > 0 && (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-black ${
                      section === id ? "bg-white/20 text-white" : "bg-teal-600 text-white"
                    }`}
                  >
                    {stats.pending}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Bottom Controls */}
        <div className="space-y-2 border-t border-coal-100 pt-4 dark:border-coal-800">
          {onBackToStore && (
            <button
              onClick={onBackToStore}
              className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-zinc-600 hover:bg-coal-100 dark:text-zinc-300 dark:hover:bg-coal-800 transition"
            >
              <Store size={17} />
              <span>Back to Storefront</span>
            </button>
          )}

          <button
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
          >
            <LogOut size={17} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="min-h-screen lg:pl-72 flex flex-col justify-between">
        <div>
          {/* Top Navbar */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-coal-200 bg-white/85 px-3 py-3 backdrop-blur-xl dark:border-coal-800 dark:bg-coal-950/85 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl p-2 text-zinc-600 hover:bg-coal-100 dark:text-zinc-300 dark:hover:bg-coal-800 lg:hidden"
                aria-label="Toggle navigation"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-zinc-400">Owner Dashboard</p>
                <h1 className="text-base sm:text-xl font-black truncate">{title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {onBackToStore && (
                <button
                  onClick={onBackToStore}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-coal-200 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 dark:border-coal-800 dark:text-zinc-300"
                >
                  <Store size={14} />
                  <span>Storefront</span>
                </button>
              )}

              <NotificationBell
                notifications={notifications}
                onClear={() => setNotifications([])}
                onViewOrder={(order) => {
                  setActiveReceiptOrder(order);
                }}
              />

              <button
                onClick={() => {
                  onProductsChanged();
                  onOrdersChanged();
                }}
                className="rounded-xl border border-coal-200 p-2 sm:p-2.5 text-zinc-500 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 dark:border-coal-800"
                title="Refresh Live Data"
              >
                <RefreshCw size={16} />
              </button>

              <div className="hidden md:block text-right">
                <p className="text-xs font-bold">Food World Owner</p>
                <p className="text-[10px] text-zinc-500">{new Date().toLocaleDateString()}</p>
              </div>

              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-teal-100 text-xs sm:text-sm font-black text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
                {(user?.email?.[0] || "O").toUpperCase()}
              </div>
            </div>
          </header>

          {/* Body Content Container */}
          <div className="mx-auto max-w-[1500px] p-3 sm:p-6 lg:p-8">
            {notice && (
              <div className="mb-5 flex items-center justify-between rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-xs sm:text-sm text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300 animate-fade-in">
                <span>{notice}</span>
                <button onClick={() => setNotice("")} className="p-1">
                  <X size={16} />
                </button>
              </div>
            )}

            {section === "overview" && (
              <Overview
                stats={stats}
                orders={normalizedOrdersList}
                products={products}
                ratingSummaries={ratingSummaries}
                setSection={setSection}
                onViewReceipt={setActiveReceiptOrder}
              />
            )}
            {section === "kitchen" && (
              <KitchenDisplay
                orders={normalizedOrdersList}
                products={products}
                onStatusChange={updateOrderStatus}
                onViewReceipt={setActiveReceiptOrder}
              />
            )}
            {section === "orders" && (
              <OrdersSection
                orders={normalizedOrdersList}
                onStatus={updateOrderStatus}
                onViewReceipt={setActiveReceiptOrder}
              />
            )}
            {section === "products" && (
              <ProductsSection
                products={filteredProducts}
                query={query}
                setQuery={setQuery}
                onAdd={() => setModalProduct({ ...EMPTY_PRODUCT })}
                onEdit={setModalProduct}
                onDelete={deleteProduct}
              />
            )}
            {section === "inventory" && (
              <InventorySection products={products} onEdit={setModalProduct} />
            )}
            {section === "customers" && (
              <CustomersSection customers={customers} orders={normalizedOrdersList} />
            )}
            {section === "reports" && (
              <SalesAnalytics
                orders={normalizedOrdersList}
                products={products}
                loading={ordersLoading}
                error={ordersError}
                onRetry={onOrdersChanged}
              />
            )}
          </div>
        </div>

        {/* Dashboard Footer */}
        <footer className="border-t border-coal-200 dark:border-coal-800/80 px-4 py-4 text-center text-[11px] text-zinc-400">
          Food World Operations Terminal · Fully Responsive POS
        </footer>
      </main>

      {/* Edit/Add Product Modal */}
      <ProductModal
        product={modalProduct}
        onClose={() => setModalProduct(null)}
        onSave={saveProduct}
        saving={saving}
      />

      {/* Digital Receipt Modal */}
      <OrderReceiptModal
        order={activeReceiptOrder}
        products={products}
        isOpen={Boolean(activeReceiptOrder)}
        onClose={() => setActiveReceiptOrder(null)}
      />

      {/* Live Toast Pop-up Notification */}
      <NotificationToast
        toast={currentToast}
        onDismiss={() => setCurrentToast(null)}
        onViewOrder={(order) => {
          setActiveReceiptOrder(order);
        }}
      />
    </div>
  );
}

function Overview({ stats, orders, products, ratingSummaries = {}, setSection, onViewReceipt }) {
  const recent = orders.slice(0, 6);
  const max = Math.max(...orders.map((order) => Number(order.total_amount || 0)), 1);

  // Compute real rating stats from Supabase data
  const ratingStats = useMemo(() => {
    const entries = Object.entries(ratingSummaries);
    if (!entries.length) return { avgAll: 0, totalCount: 0, bestProduct: null };

    const totalCount = entries.reduce((sum, [, s]) => sum + (s.count || 0), 0);
    const weightedSum = entries.reduce((sum, [, s]) => sum + (s.avgRating || 0) * (s.count || 0), 0);
    const avgAll = totalCount > 0 ? weightedSum / totalCount : 0;

    let bestProductId = null;
    let bestAvg = 0;
    for (const [pid, s] of entries) {
      if ((s.avgRating || 0) > bestAvg) {
        bestAvg = s.avgRating;
        bestProductId = Number(pid);
      }
    }
    const bestProduct = bestProductId
      ? products.find((p) => p.id === bestProductId)
      : null;

    return { avgAll, totalCount, bestProduct, bestAvg };
  }, [ratingSummaries, products]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
              Today's Restaurant Snapshot
            </h2>
            <p className="text-xs text-zinc-500">Live operational overview and fast kitchen queue.</p>
          </div>
          <button
            onClick={() => setSection("kitchen")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-teal-500/20 hover:bg-teal-700"
          >
            <ChefHat size={15} />
            <span>Open Kitchen Display (KDS)</span>
          </button>
        </div>

        {/* Responsive KPI Grid */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Completed Revenue" value={money(stats.revenue)} change="Delivered orders" icon={TrendingUp} />
          <StatCard label="Total orders" value={orders.length} change="All-time" icon={ClipboardList} tone="blue" />
          <StatCard label="Items in stock" value={stats.stock} change="Healthy" icon={Boxes} tone="green" />
          <StatCard
            label="Pending orders"
            value={stats.pending}
            change={stats.lowStock ? `${stats.lowStock} low stock` : "Live queue"}
            icon={PackagePlus}
            tone="purple"
          />
        </div>

        {/* Real Rating Stats Row */}
        {ratingStats.totalCount > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-coal-200 dark:border-coal-800 bg-white dark:bg-coal-900 p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Avg Product Rating</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-2xl font-black text-zinc-900 dark:text-white">
                <span className="text-amber-400">⭐</span>
                {ratingStats.avgAll.toFixed(1)}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">across all products</p>
            </div>
            <div className="rounded-3xl border border-coal-200 dark:border-coal-800 bg-white dark:bg-coal-900 p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Total Ratings</p>
              <p className="mt-1.5 text-2xl font-black text-zinc-900 dark:text-white">{ratingStats.totalCount}</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">from verified customers</p>
            </div>
            {ratingStats.bestProduct && (
              <div className="rounded-3xl border border-coal-200 dark:border-coal-800 bg-white dark:bg-coal-900 p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Best Rated Product</p>
                <p className="mt-1.5 truncate text-base font-black text-zinc-900 dark:text-white">
                  {ratingStats.bestProduct.name || ratingStats.bestProduct.title}
                </p>
                <p className="mt-0.5 text-[11px] text-teal-600 dark:text-teal-400 font-bold">⭐ {ratingStats.bestAvg.toFixed(1)} avg</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Middle Grid: Revenue & Alerts */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-coal-200 bg-white p-5 sm:p-6 dark:border-coal-800 dark:bg-coal-900 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black text-zinc-900 dark:text-white">Revenue Snapshot</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Latest customer orders by value</p>
            </div>
            <button
              onClick={() => setSection("reports")}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
            >
              Full Analytics →
            </button>
          </div>

          <div className="mt-6 flex h-48 sm:h-56 items-end gap-2 sm:gap-3 overflow-x-auto pb-2">
            {recent.length ? (
              recent.map((order) => (
                <div key={order.id} className="flex min-w-[40px] flex-1 flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t-xl bg-teal-500/80 transition hover:bg-teal-600"
                    style={{ height: `${Math.max((Number(order.total_amount || 0) / max) * 100, 8)}%` }}
                    title={`Rs. ${order.total_amount}`}
                  />
                  <span className="text-[9px] sm:text-[10px] font-mono text-zinc-400 truncate max-w-full">
                    #{order.id}
                  </span>
                </div>
              ))
            ) : (
              <p className="self-center text-sm text-zinc-500">No orders yet.</p>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-3xl border border-coal-200 bg-white p-5 sm:p-6 dark:border-coal-800 dark:bg-coal-900 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black text-zinc-900 dark:text-white">Inventory Alerts</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Products & drinks needing attention</p>
            </div>
            <AlertTriangle className="text-amber-500" size={20} />
          </div>
          <div className="mt-5 space-y-3">
            {products
              .filter((p) => Number(p.stock_quantity ?? 0) <= Number(p.low_stock_threshold ?? 5))
              .slice(0, 5)
              .map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-2xl bg-amber-50 px-3.5 py-3 dark:bg-amber-500/10"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={product.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80"}
                      alt=""
                      className="h-10 w-10 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{product.name || product.title}</p>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{product.category}</span>
                    </div>
                  </div>
                  <span className="ml-2 whitespace-nowrap text-xs font-bold text-amber-700 dark:text-amber-400">
                    {product.stock_quantity ?? 0} left
                  </span>
                </div>
              ))}
            {!stats.lowStock && <p className="text-sm text-zinc-500">All items are sufficiently stocked.</p>}
          </div>
        </div>
      </div>

      {/* Recent Orders Card */}
      <div className="rounded-3xl border border-coal-200 bg-white p-4 sm:p-6 dark:border-coal-800 dark:bg-coal-900 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-black text-zinc-900 dark:text-white">Recent Customer Orders</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Keep an eye on latest activity & print receipts</p>
          </div>
          <button
            onClick={() => setSection("orders")}
            className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
          >
            View all →
          </button>
        </div>
        <OrdersTable orders={recent} compact onViewReceipt={onViewReceipt} />
      </div>
    </div>
  );
}

function ProductsSection({ products, query, setQuery, onAdd, onEdit, onDelete }) {
  const [activeCategory, setActiveCategory] = useState("All");

  const categoryOptions = ["All", ...new Set(products.map((p) => p.category).filter(Boolean))];

  const displayedProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCategory === "All" || p.category === activeCategory;
      return matchCat;
    });
  }, [products, activeCategory]);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-black">Menu Products & Drinks</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Manage food and drink items displayed on the customer storefront.
          </p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-teal-500/20 hover:bg-teal-700 transition"
        >
          <Plus size={17} />
          <span>Add Product / Drink</span>
        </button>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {categoryOptions.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                activeCategory === cat
                  ? "bg-teal-600 text-white shadow-sm"
                  : "border border-coal-200 bg-white text-zinc-600 dark:border-coal-800 dark:bg-coal-900 dark:text-zinc-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full rounded-2xl border border-coal-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-teal-500 dark:border-coal-800 dark:bg-coal-900"
          />
        </div>
      </div>

      {/* Mobile Card Grid (Visible on small screens < 640px) */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {displayedProducts.map((product) => {
          const title = product.name || product.title;
          const isLow = Number(product.stock_quantity ?? 0) <= Number(product.low_stock_threshold ?? 5);
          return (
            <div
              key={product.id}
              className="rounded-2xl border border-coal-200 bg-white p-4 dark:border-coal-800 dark:bg-coal-900 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <img
                  src={product.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80"}
                  alt=""
                  className="h-14 w-14 rounded-2xl object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">{title}</p>
                    <span className="text-xs font-black text-teal-600 dark:text-teal-400 shrink-0">{money(product.price)}</span>
                  </div>
                  <p className="line-clamp-1 text-xs text-zinc-500 mt-0.5">{product.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-600 dark:text-teal-400">
                      {product.category}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        product.is_available === false
                          ? "bg-coal-100 text-zinc-500 dark:bg-coal-800"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                      }`}
                    >
                      {product.is_available === false ? "Hidden" : "Live"}
                    </span>
                    <span
                      className={`text-[10px] font-bold ml-auto ${
                        isLow ? "text-amber-600 dark:text-amber-400" : "text-zinc-500"
                      }`}
                    >
                      Stock: {product.stock_quantity ?? "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 flex items-center justify-end gap-2 border-t border-coal-100 pt-3 dark:border-coal-800">
                <button
                  onClick={() => onEdit(product)}
                  className="inline-flex items-center gap-1 rounded-xl border border-coal-200 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 dark:border-coal-700 dark:text-zinc-300"
                >
                  <Pencil size={13} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => onDelete(product.id)}
                  className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/30"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop/Tablet Table (Visible on screens >= 640px) */}
      <div className="hidden sm:block overflow-hidden rounded-3xl border border-coal-200 bg-white dark:border-coal-800 dark:bg-coal-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-coal-200 bg-coal-50 text-xs uppercase tracking-wider text-zinc-500 dark:border-coal-800 dark:bg-coal-950">
              <tr>
                <th className="px-5 py-4">Item</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coal-100 dark:divide-coal-800">
              {displayedProducts.map((product) => {
                const title = product.name || product.title;
                return (
                  <tr key={product.id} className="hover:bg-coal-50 dark:hover:bg-coal-950">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80"}
                          alt=""
                          className="h-11 w-11 rounded-2xl object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-900 dark:text-white truncate max-w-xs">{title}</p>
                          <p className="max-w-xs truncate text-xs text-zinc-500">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-zinc-500">{product.category}</td>
                    <td className="px-5 py-4 font-bold text-zinc-900 dark:text-white">{money(product.price)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={
                          Number(product.stock_quantity ?? 0) <= Number(product.low_stock_threshold ?? 5)
                            ? "font-bold text-amber-600 dark:text-amber-400"
                            : "text-zinc-600 dark:text-zinc-300"
                        }
                      >
                        {product.stock_quantity ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          product.is_available === false
                            ? "bg-coal-100 text-zinc-500 dark:bg-coal-800"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        }`}
                      >
                        {product.is_available === false ? "Hidden" : "Live"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onEdit(product)}
                          className="rounded-xl p-2 text-zinc-500 hover:bg-teal-50 hover:text-teal-600 dark:hover:text-teal-400 dark:hover:bg-teal-500/10"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(product.id)}
                          className="rounded-xl p-2 text-zinc-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!displayedProducts.length && (
          <div className="p-8 text-center text-sm text-zinc-500">No products or drinks found.</div>
        )}
      </div>
    </div>
  );
}

function InventorySection({ products, onEdit }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-black">Stock & Inventory</h2>
        <p className="mt-0.5 text-xs text-zinc-500">Monitor stock levels for food items and drinks.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const title = product.name || product.title;
          const stock = Number(product.stock_quantity ?? 0);
          const threshold = Number(product.low_stock_threshold ?? 5);
          const low = stock <= threshold;

          return (
            <div
              key={product.id}
              className="rounded-3xl border border-coal-200 bg-white p-5 dark:border-coal-800 dark:bg-coal-900 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <img
                  src={product.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80"}
                  alt=""
                  className="h-14 w-14 rounded-2xl object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="truncate font-bold text-zinc-900 dark:text-white">{title}</p>
                  <p className="text-xs text-zinc-500">{product.category}</p>
                </div>
              </div>

              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-xs text-zinc-500">Current stock</p>
                  <p className={`text-2xl font-black ${low ? "text-amber-600 dark:text-amber-400" : "text-zinc-900 dark:text-white"}`}>
                    {product.stock_quantity ?? "—"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    low
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                  }`}
                >
                  {low ? "Low stock" : "Healthy"}
                </span>
              </div>

              <button
                onClick={() => onEdit(product)}
                className="mt-5 w-full rounded-2xl border border-coal-200 py-2.5 text-xs sm:text-sm font-bold hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 dark:border-coal-700 transition"
              >
                Update Stock
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrdersTable({ orders, compact = false, onStatus, onViewReceipt }) {
  return (
    <div>
      {/* Mobile Orders Card View (< 640px) */}
      <div className="space-y-3 sm:hidden">
        {orders.map((order) => {
          const rawStatus = (order.status || "pending").toLowerCase();
          const statusKey = rawStatus === "delivered" ? "completed" : rawStatus;
          const statusInfo = ORDER_STATUS_MAP[statusKey] || ORDER_STATUS_MAP.pending;

          return (
            <div
              key={order.id}
              className="rounded-2xl border border-coal-200 bg-white p-4 dark:border-coal-800 dark:bg-coal-900/90 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-sm font-black text-teal-600 dark:text-teal-400">
                    {formatOrderId(order)}
                  </span>
                  <p className="font-bold text-zinc-900 dark:text-white mt-0.5">{order.customer_name || "Guest"}</p>
                  <p className="text-xs text-zinc-500">{order.mobile}</p>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold capitalize ${statusInfo.badgeClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`} />
                  {statusInfo.label}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-coal-100 pt-2.5 dark:border-coal-800 text-xs">
                <span className="text-zinc-400">{formatDateTime(order.created_at)}</span>
                <span className="font-black text-zinc-900 dark:text-white">{money(order.total_amount || 0)}</span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-coal-100 pt-2.5 dark:border-coal-800">
                <button
                  onClick={() => onViewReceipt(order)}
                  className="inline-flex items-center gap-1 rounded-xl border border-coal-200 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 dark:border-coal-700 dark:text-zinc-300"
                >
                  <Receipt size={13} />
                  <span>Receipt</span>
                </button>

                {!compact && onStatus && (
                  <select
                    value={statusKey}
                    onChange={(event) => onStatus(order.id, event.target.value)}
                    className="rounded-xl border border-coal-200 bg-transparent px-2.5 py-1.5 text-xs font-semibold text-zinc-700 dark:border-coal-700 dark:text-zinc-300"
                  >
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop/Tablet Orders Table (>= 640px) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="border-b border-coal-200 text-xs uppercase tracking-wider text-zinc-500 dark:border-coal-800">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-coal-100 dark:divide-coal-800">
            {orders.map((order) => {
              const rawStatus = (order.status || "pending").toLowerCase();
              const statusKey = rawStatus === "delivered" ? "completed" : rawStatus;
              const statusInfo = ORDER_STATUS_MAP[statusKey] || ORDER_STATUS_MAP.pending;

              return (
                <tr key={order.id} className="hover:bg-coal-50/60 dark:hover:bg-coal-800/30">
                  <td className="px-4 py-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                    {formatOrderId(order)}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-zinc-900 dark:text-white">{order.customer_name || "Guest"}</p>
                    <p className="text-xs text-zinc-500">{order.mobile}</p>
                  </td>
                  <td className="px-4 py-4 text-xs text-zinc-500">{formatDateTime(order.created_at)}</td>
                  <td className="px-4 py-4 font-bold text-zinc-900 dark:text-white">
                    {money(order.total_amount || 0)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusInfo.badgeClass}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`} />
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewReceipt(order)}
                        className="inline-flex items-center gap-1 rounded-xl border border-coal-200 px-2.5 py-1.5 text-xs font-bold text-zinc-600 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 dark:border-coal-700 dark:text-zinc-300"
                        title="View & Print Digital Receipt"
                      >
                        <Receipt size={13} />
                        <span>Receipt</span>
                      </button>

                      {!compact && onStatus && (
                        <select
                          value={statusKey}
                          onChange={(event) => onStatus(order.id, event.target.value)}
                          className="rounded-xl border border-coal-200 bg-transparent px-2.5 py-1.5 text-xs font-semibold text-zinc-700 dark:border-coal-700 dark:text-zinc-300"
                        >
                          <option value="pending">Pending</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!orders.length && <p className="p-8 text-center text-sm text-zinc-500">No orders found.</p>}
    </div>
  );
}

function OrdersSection({ orders, onStatus, onViewReceipt }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const raw = (o.status || "pending").toLowerCase();
      const st = raw === "delivered" ? "completed" : raw;
      const matchesFilter = filter === "all" ? true : st === filter;
      const query = search.toLowerCase();
      const matchesSearch =
        !search ||
        String(o.id).includes(query) ||
        String(o.order_id || "").toLowerCase().includes(query) ||
        String(o.customer_name || "").toLowerCase().includes(query) ||
        String(o.mobile || "").includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [orders, filter, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-black">All Customer Orders</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Track and update every customer order lifecycle.</p>
        </div>

        <div className="relative min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders..."
            className="w-full rounded-2xl border border-coal-200 bg-white py-2 pl-9 pr-3 text-xs outline-none dark:border-coal-800 dark:bg-coal-900"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1">
        {["all", "pending", "preparing", "ready", "completed", "cancelled"].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize whitespace-nowrap transition ${
              filter === st
                ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
                : "border border-coal-200 bg-white text-zinc-600 dark:border-coal-800 dark:bg-coal-900 dark:text-zinc-400"
            }`}
          >
            {st === "all" ? "All Orders" : st} (
            {st === "all"
              ? orders.length
              : orders.filter((o) => {
                  const s = (o.status || "pending").toLowerCase();
                  return st === "completed" ? s === "completed" || s === "delivered" : s === st;
                }).length}
            )
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-coal-200 bg-white p-4 sm:p-5 dark:border-coal-800 dark:bg-coal-900 shadow-sm">
        <OrdersTable orders={filtered} onStatus={onStatus} onViewReceipt={onViewReceipt} />
      </div>
    </div>
  );
}

function CustomersSection({ customers, orders }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-black">Customers Directory</h2>
        <p className="mt-0.5 text-xs text-zinc-500">Registered and guest customer orders and spend history.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {customers.map((customer) => {
          const count = orders.filter(
            (order) => (order.mobile || order.customer_name) === (customer.mobile || customer.customer_name)
          ).length;
          const totalSpent = orders
            .filter((order) => (order.mobile || order.customer_name) === (customer.mobile || customer.customer_name))
            .reduce((s, o) => s + Number(o.total_amount || 0), 0);

          return (
            <div
              key={customer.id}
              className="rounded-3xl border border-coal-200 bg-white p-5 dark:border-coal-800 dark:bg-coal-900 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 font-black text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 shrink-0">
                  {(customer.customer_name || "G")[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 dark:text-white truncate">
                    {customer.customer_name || "Guest Customer"}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">{customer.mobile || "No mobile"}</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 border-t border-coal-100 pt-4 text-xs dark:border-coal-800">
                <div>
                  <span className="text-zinc-400">Total Orders</span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{count}</p>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400">Total Spent</span>
                  <p className="text-sm font-bold text-teal-600 dark:text-teal-400">{money(totalSpent)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OwnerDashboard;
