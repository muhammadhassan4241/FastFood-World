const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const AppError = require("../utils/AppError");
const generateOrderNumber = require("../utils/generateOrderNumber");
const { DELIVERY_FEE, effectivePrice } = require("./cart.service");

const transitions = {
  pending: ["confirmed", "rejected", "cancelled"],
  confirmed: ["preparing", "cancelled", "rejected"],
  preparing: ["ready"],
  ready: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
  rejected: [],
};

async function createOrderInSession(userId, input, session) {
  const cartQuery = Cart.findOne({ user: userId });
  if (session) cartQuery.session(session);
  const cart = await cartQuery;
  if (!cart || !cart.items.length) throw new AppError("Your cart is empty", 422);

  const restQuery = Restaurant.findOne({ _id: cart.restaurant, isActive: true });
  if (session) restQuery.session(session);
  const restaurant = await restQuery;
  if (!restaurant) throw new AppError("Restaurant is no longer accepting orders", 422);

  const ids = cart.items.map((item) => item.menuItem);
  const menuQuery = MenuItem.find({ _id: { $in: ids }, restaurant: cart.restaurant, isActive: true, isAvailable: true });
  if (session) menuQuery.session(session);
  const menuItems = await menuQuery;
  if (menuItems.length !== ids.length) throw new AppError("One or more cart items are unavailable", 422);

  const itemMap = new Map(menuItems.map((item) => [item.id, item]));
  const items = cart.items.map((line) => {
    const menuItem = itemMap.get(line.menuItem.toString());
    const price = effectivePrice(menuItem);
    return {
      menuItem: menuItem.id,
      name: menuItem.name,
      price,
      quantity: line.quantity,
      subtotal: price * line.quantity,
    };
  });

  const subtotal = items.reduce((total, item) => total + item.subtotal, 0);
  const orderNumber = generateOrderNumber();
  const createOpts = session ? { session } : {};

  const [order] = await Order.create([{
    orderNumber,
    order_id: orderNumber,
    user: userId,
    restaurant: restaurant.id,
    items,
    deliveryAddress: input.deliveryAddress,
    address: input.deliveryAddress?.address || "",
    phone: input.phone,
    mobile: input.phone,
    subtotal,
    deliveryFee: DELIVERY_FEE,
    delivery_fee: DELIVERY_FEE,
    discount: 0,
    total: subtotal + DELIVERY_FEE,
    total_amount: subtotal + DELIVERY_FEE,
    paymentMethod: input.paymentMethod || "cash",
    payment_method: input.paymentMethod === "cash" ? "cod" : (input.paymentMethod || "cod"),
    notes: input.notes || "",
    special_instructions: input.notes || "",
  }], createOpts);

  const delQuery = Cart.deleteOne({ _id: cart.id });
  if (session) delQuery.session(session);
  await delQuery;

  return order;
}

async function createOrder(userId, input) {
  const isReplicaSet = Boolean(mongoose.connection.client?.topology?.description?.type?.includes("ReplicaSet"));
  if (isReplicaSet) {
    const session = await mongoose.startSession();
    try {
      let order;
      await session.withTransaction(async () => {
        order = await createOrderInSession(userId, input, session);
      });
      return order;
    } finally {
      await session.endSession();
    }
  } else {
    return await createOrderInSession(userId, input, null);
  }
}

function canTransition(from, to) {
  const fromNormalized = (from || "pending").toLowerCase();
  const toNormalized = (to || "").toLowerCase();
  // Allow direct transitions if same or in transition map
  if (fromNormalized === toNormalized) return true;
  return Boolean(transitions[fromNormalized]?.includes(toNormalized));
}

module.exports = { createOrder, canTransition };
