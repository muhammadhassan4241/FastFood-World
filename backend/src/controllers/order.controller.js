const mongoose = require("mongoose");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const { getPagination, paginationMeta } = require("../utils/pagination");
const { assertObjectId, isObjectId } = require("../utils/objectId");
const restaurantService = require("../services/restaurant.service");
const orderService = require("../services/order.service");

async function findOrderFlexible(identifier) {
  if (!identifier) throw new AppError("Order identifier is required", 400);

  let order = null;
  if (isObjectId(identifier)) {
    order = await Order.findById(identifier).populate("restaurant", "name owner").populate("user", "name email phone");
  }

  if (!order) {
    order = await Order.findOne({
      $or: [
        { orderNumber: identifier },
        { order_id: identifier },
        { order_id: identifier.toUpperCase() },
        { orderNumber: identifier.toUpperCase() },
      ],
    }).populate("restaurant", "name owner").populate("user", "name email phone");
  }

  if (!order) throw new AppError("Order not found", 404);
  return order;
}

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.user?.role === "restaurant_admin") {
    const ownedRestaurants = await Restaurant.find({ owner: req.user._id }).select("_id");
    const restaurantIds = ownedRestaurants.map((r) => r._id);
    if (restaurantIds.length > 0) {
      filter.$or = [{ restaurant: { $in: restaurantIds } }, { restaurant: null }];
    }
  }

  if (req.query.status) {
    filter.$or = [{ orderStatus: req.query.status }, { status: req.query.status }];
  }

  if (req.query.search) {
    const searchRegex = { $regex: req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    filter.$or = [
      { orderNumber: searchRegex },
      { order_id: searchRegex },
      { customer_name: searchRegex },
      { mobile: searchRegex },
      { phone: searchRegex },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("restaurant", "name image")
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  success(res, { data: orders, pagination: paginationMeta({ page, limit, total }) });
});

exports.create = asyncHandler(async (req, res) => {
  // Check if direct storefront/POS payload
  const isDirectOrder = Array.isArray(req.body.items) || req.body.customer_name || req.body.order_id || req.body.total_amount;

  if (isDirectOrder) {
    const orderData = {
      order_id: req.body.order_id || req.body.orderNumber,
      orderNumber: req.body.orderNumber || req.body.order_id,
      customer_name: req.body.customer_name || req.user?.name || "Guest",
      mobile: req.body.mobile || req.body.customer_phone || req.body.phone || req.user?.phone || "N/A",
      customer_phone: req.body.customer_phone || req.body.mobile || req.body.phone || "N/A",
      customer_email: req.body.customer_email || req.body.email || req.user?.email || "",
      address: req.body.address || req.body.deliveryAddress?.address || "N/A",
      deliveryAddress: typeof req.body.deliveryAddress === "object"
        ? req.body.deliveryAddress
        : { address: req.body.address || "N/A", city: "Local", postalCode: "" },
      special_instructions: req.body.special_instructions || req.body.notes || "",
      notes: req.body.notes || req.body.special_instructions || "",
      items: req.body.items || [],
      subtotal: Number(req.body.subtotal || 0),
      deliveryFee: Number(req.body.delivery_fee ?? req.body.deliveryFee ?? 150),
      delivery_fee: Number(req.body.delivery_fee ?? req.body.deliveryFee ?? 150),
      tax: Number(req.body.tax || 0),
      discount: Number(req.body.discount || 0),
      total: Number(req.body.total_amount ?? req.body.total ?? 0),
      total_amount: Number(req.body.total_amount ?? req.body.total ?? 0),
      paymentMethod: req.body.paymentMethod || req.body.payment_method || "cash",
      payment_method: req.body.payment_method || req.body.paymentMethod || "cod",
      status: req.body.status || "pending",
      orderStatus: req.body.status || req.body.orderStatus || "pending",
      user: req.user?._id || null,
      restaurant: req.body.restaurantId && isObjectId(req.body.restaurantId) ? req.body.restaurantId : null,
    };

    const order = await Order.create(orderData);
    return success(res, { status: 201, message: "Order placed successfully", data: { order } });
  }

  // Fallback to server cart-based checkout
  if (!req.user) {
    throw new AppError("Authentication required for cart checkout", 401);
  }

  const order = await orderService.createOrder(req.user.id, req.body);
  success(res, { status: 201, message: "Order placed successfully", data: { order } });
});

exports.track = asyncHandler(async (req, res) => {
  const param = req.params.orderNumber;
  const filter = {
    $or: [
      { orderNumber: param },
      { order_id: param },
      { orderNumber: param.toUpperCase() },
      { order_id: param.toUpperCase() },
    ],
  };

  if (isObjectId(param)) {
    filter.$or.push({ _id: param });
  }

  const order = await Order.findOne(filter).populate("restaurant", "name image").lean();
  if (!order) throw new AppError("Order not found", 404);

  success(res, {
    data: {
      order: {
        ...order,
        id: order._id,
      },
    },
  });
});

exports.search = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return success(res, { data: [] });

  const searchRegex = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  const filter = {
    $or: [
      { orderNumber: searchRegex },
      { order_id: searchRegex },
      { customer_name: searchRegex },
      { mobile: searchRegex },
      { phone: searchRegex },
    ],
  };

  if (isObjectId(q)) {
    filter.$or.push({ _id: q });
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(15).lean();
  success(res, { data: orders });
});

exports.myOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { user: req.user.id };
  const [orders, total] = await Promise.all([
    Order.find(filter).populate("restaurant", "name image").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  success(res, { data: orders, pagination: paginationMeta({ page, limit, total }) });
});

exports.getOne = asyncHandler(async (req, res) => {
  const order = await findOrderFlexible(req.params.orderId);
  success(res, { data: { order } });
});

exports.cancel = asyncHandler(async (req, res) => {
  const order = await findOrderFlexible(req.params.orderId);
  if (req.user && order.user && order.user.toString() !== req.user.id) {
    throw new AppError("You can only cancel your own orders", 403);
  }
  const currentStatus = order.status || order.orderStatus;
  if (!["pending", "confirmed"].includes(currentStatus)) {
    throw new AppError("This order can no longer be cancelled", 422);
  }
  order.orderStatus = "cancelled";
  order.status = "cancelled";
  await order.save();
  success(res, { message: "Order cancelled successfully", data: { order } });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const order = await findOrderFlexible(req.params.orderId);
  const nextStatus = req.body.status || req.body.orderStatus;
  if (!nextStatus) throw new AppError("New status is required", 400);

  order.orderStatus = nextStatus;
  order.status = nextStatus;
  await order.save();

  success(res, { message: "Order status updated", data: { order } });
});

exports.restaurantOrders = asyncHandler(async (req, res) => {
  const restaurantId = assertObjectId(req.params.restaurantId, "restaurantId");
  if (req.user) {
    await restaurantService.assertRestaurantManager(req.user, restaurantId);
  }
  const { page, limit, skip } = getPagination(req.query);
  const filter = { restaurant: restaurantId };
  if (req.query.status) {
    filter.$or = [{ orderStatus: req.query.status }, { status: req.query.status }];
  }
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) {
      const until = new Date(req.query.to);
      until.setUTCHours(23, 59, 59, 999);
      filter.createdAt.$lte = until;
    }
  }
  if (req.query.search) {
    filter.orderNumber = { $regex: req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  }
  const [orders, total] = await Promise.all([
    Order.find(filter).populate("user", "name email phone").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  success(res, { data: orders, pagination: paginationMeta({ page, limit, total }) });
});
