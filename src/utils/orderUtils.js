// Unified Order Model & Utilities for Food World POS and Storefront

/**
 * Generates a human-readable unique Order ID.
 * Format: FW-XXXXX (e.g., FW-86712)
 */
export function generateOrderId() {
  const random5Digit = Math.floor(10000 + Math.random() * 90000);
  return `FW-${random5Digit}`;
}

/**
 * Returns a standardized, human-readable Order ID for display (e.g., FW-86712 or #FW-00104)
 */
export function formatOrderId(order) {
  if (!order) return "FW-00000";

  // Check top-level order_id
  if (order.order_id && typeof order.order_id === "string") {
    return order.order_id.startsWith("#") ? order.order_id.slice(1) : order.order_id;
  }

  // Check embedded order_id inside items object if saved as rich container
  if (order.items && typeof order.items === "object" && !Array.isArray(order.items)) {
    if (order.items.order_id) {
      return String(order.items.order_id);
    }
  }

  // Fallback to numeric database ID: #FW-00012
  if (order.id !== undefined && order.id !== null) {
    if (typeof order.id === "string" && order.id.startsWith("FW-")) {
      return order.id;
    }
    return `FW-${String(order.id).padStart(5, "0")}`;
  }

  return "FW-00000";
}

/**
 * Normalizes raw order items from any legacy or rich structure into a clean array:
 * [ { id, title, price, quantity, image, category } ]
 */
export function normalizeOrderItems(rawItems, productsCatalog = []) {
  if (!rawItems) return [];

  // Case 1: items wrapped inside a container object { items: [...] }
  if (typeof rawItems === "object" && !Array.isArray(rawItems) && Array.isArray(rawItems.items)) {
    return normalizeOrderItems(rawItems.items, productsCatalog);
  }

  // Case 2: Array of item objects
  if (Array.isArray(rawItems)) {
    return rawItems.map((item) => {
      const catalogMatch = productsCatalog.find(
        (p) => p.id === Number(item.id || item.product_id)
      );
      return {
        id: item.id || item.product_id || Math.random(),
        title: item.title || item.name || catalogMatch?.name || catalogMatch?.title || "Delicious Dish",
        price: Number(item.price ?? catalogMatch?.price ?? 0),
        quantity: Number(item.quantity || item.qty || 1),
        image: item.image || catalogMatch?.image || "",
        category: item.category || catalogMatch?.category || "Food",
      };
    });
  }

  // Case 3: Legacy format: { [productId]: quantity }
  if (typeof rawItems === "object") {
    const parsed = [];
    for (const [idKey, qtyVal] of Object.entries(rawItems)) {
      // Skip non-item metadata keys if any were stored
      if (["order_id", "subtotal", "delivery_fee", "tax", "discount", "payment_method", "special_instructions", "customer_email"].includes(idKey)) {
        continue;
      }
      const numericId = Number(idKey);
      const quantity = Number(qtyVal);
      if (quantity > 0) {
        const catalogMatch = productsCatalog.find((p) => p.id === numericId);
        parsed.push({
          id: numericId,
          title: catalogMatch?.name || catalogMatch?.title || `Dish #${idKey}`,
          price: Number(catalogMatch?.price || 0),
          quantity: quantity,
          image: catalogMatch?.image || "",
          category: catalogMatch?.category || "Food",
        });
      }
    }
    return parsed;
  }

  return [];
}

/**
 * Normalizes an entire order record into the unified Food World Order Model
 */
export function normalizeOrder(order, productsCatalog = []) {
  if (!order) return null;

  const rawItems = order.items;
  const embeddedMeta = typeof rawItems === "object" && !Array.isArray(rawItems) ? rawItems : {};
  const items = normalizeOrderItems(rawItems, productsCatalog);

  const rawSubtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const subtotal = order.subtotal !== undefined && order.subtotal !== null
    ? Number(order.subtotal)
    : embeddedMeta.subtotal !== undefined
    ? Number(embeddedMeta.subtotal)
    : rawSubtotal;

  const deliveryFee = order.delivery_fee !== undefined && order.delivery_fee !== null
    ? Number(order.delivery_fee)
    : embeddedMeta.delivery_fee !== undefined
    ? Number(embeddedMeta.delivery_fee)
    : 150;

  const tax = order.tax !== undefined && order.tax !== null
    ? Number(order.tax)
    : embeddedMeta.tax !== undefined
    ? Number(embeddedMeta.tax)
    : Math.round(subtotal * 0.15);

  const discount = order.discount ? Number(order.discount) : embeddedMeta.discount ? Number(embeddedMeta.discount) : 0;
  const totalAmount = Number(order.total_amount || order.total || embeddedMeta.total_amount || (subtotal + deliveryFee + tax - discount));

  const orderId = formatOrderId(order);
  const status = (order.status || "pending").toLowerCase();

  return {
    id: order.id,
    customer_id: order.customer_id || null,
    order_id: orderId,
    customer_name: order.customer_name || order.name || embeddedMeta.customer_name || "Guest Customer",
    mobile: order.mobile || order.customer_phone || order.phone || embeddedMeta.mobile || "N/A",
    customer_email: order.customer_email || order.email || embeddedMeta.customer_email || "",
    address: order.address || order.delivery_address || embeddedMeta.address || "N/A",
    special_instructions: order.special_instructions || order.instructions || embeddedMeta.special_instructions || "",
    items: items,
    subtotal: subtotal,
    delivery_fee: deliveryFee,
    tax: tax,
    discount: discount,
    total_amount: totalAmount,
    payment_method: order.payment_method || order.payment || embeddedMeta.payment_method || "cod",
    status: status === "delivered" ? "completed" : status,
    created_at: order.created_at || embeddedMeta.created_at || new Date().toISOString(),
  };
}

/**
 * Formats a currency number in PKR (Rs.)
 */
export function formatCurrency(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString()}`;
}

/**
 * Formats date and time into a clean human readable string
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return "Just now";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "Just now";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Just now";
  }
}

/**
 * Returns humanized relative time (e.g. "5m ago", "Just now")
 */
export function timeAgo(dateInput) {
  if (!dateInput) return "Just now";
  const now = new Date();
  const past = new Date(dateInput);
  const diffMs = now - past;
  if (diffMs < 0 || isNaN(diffMs)) return "Just now";

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * Standard status definitions with labels, badge colors, and progress index
 */
export const ORDER_STATUS_MAP = {
  pending: {
    label: "Pending",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    dotClass: "bg-amber-500",
    stepIndex: 0,
    description: "Order received & waiting for kitchen confirmation",
    icon: "Clock",
  },
  preparing: {
    label: "Preparing",
    badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    dotClass: "bg-blue-500",
    stepIndex: 1,
    description: "Kitchen is actively cooking & preparing your food",
    icon: "ChefHat",
  },
  ready: {
    label: "Ready",
    badgeClass: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    dotClass: "bg-cyan-500",
    stepIndex: 2,
    description: "Order is packed, hot & ready for pickup/delivery",
    icon: "PackageCheck",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    dotClass: "bg-emerald-500",
    stepIndex: 3,
    description: "Delivered & completed. Enjoy your delicious meal!",
    icon: "CheckCircle",
  },
  delivered: {
    label: "Completed",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    dotClass: "bg-emerald-500",
    stepIndex: 3,
    description: "Delivered & completed. Enjoy your delicious meal!",
    icon: "CheckCircle",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
    dotClass: "bg-red-500",
    stepIndex: -1,
    description: "This order was cancelled",
    icon: "XCircle",
  },
};

/**
 * Synthesizes a crisp Web Audio chime for incoming orders
 */
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.0, now + 0.12);
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch {
    // Gracefully ignore autoplay restrictions
  }
}
