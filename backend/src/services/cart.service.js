const Cart = require("../models/Cart");
const MenuItem = require("../models/MenuItem");
const Restaurant = require("../models/Restaurant");
const AppError = require("../utils/AppError");

const DELIVERY_FEE = 150;
const effectivePrice = (item) => item.discountPrice ?? item.price;

function recalculate(cart) {
  cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cart.deliveryFee = cart.items.length ? DELIVERY_FEE : 0;
  cart.discount = 0;
  cart.total = cart.subtotal + cart.deliveryFee;
}

async function getCart(userId) {
  return Cart.findOne({ user: userId }).populate("restaurant", "name image isActive").populate("items.menuItem", "name image isAvailable isActive restaurant");
}

async function addItem(userId, { menuItemId, quantity }) {
  const item = await MenuItem.findOne({ _id: menuItemId, isActive: true, isAvailable: true });
  if (!item) throw new AppError("Menu item is unavailable", 422);
  const restaurant = await Restaurant.findOne({ _id: item.restaurant, isActive: true });
  if (!restaurant) throw new AppError("Restaurant is not accepting orders", 422);
  let cart = await Cart.findOne({ user: userId });
  if (cart && cart.restaurant.toString() !== item.restaurant.toString()) throw new AppError("Your cart can contain items from only one restaurant", 422);
  if (!cart) cart = new Cart({ user: userId, restaurant: item.restaurant, items: [] });
  const line = cart.items.find((entry) => entry.menuItem.toString() === item.id);
  if (line) { line.quantity = Math.min(99, line.quantity + quantity); line.price = effectivePrice(item); }
  else cart.items.push({ menuItem: item.id, quantity, price: effectivePrice(item) });
  recalculate(cart);
  await cart.save();
  return getCart(userId);
}

async function updateItem(userId, menuItemId, quantity) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new AppError("Cart not found", 404);
  const line = cart.items.find((entry) => entry.menuItem.toString() === menuItemId);
  if (!line) throw new AppError("Item is not in your cart", 404);
  const item = await MenuItem.findOne({ _id: menuItemId, isActive: true, isAvailable: true });
  if (!item) throw new AppError("Menu item is unavailable", 422);
  line.quantity = quantity;
  line.price = effectivePrice(item);
  recalculate(cart);
  await cart.save();
  return getCart(userId);
}

async function removeItem(userId, menuItemId) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new AppError("Cart not found", 404);
  const count = cart.items.length;
  cart.items = cart.items.filter((entry) => entry.menuItem.toString() !== menuItemId);
  if (count === cart.items.length) throw new AppError("Item is not in your cart", 404);
  if (!cart.items.length) { await cart.deleteOne(); return null; }
  recalculate(cart); await cart.save(); return getCart(userId);
}

async function clearCart(userId) { await Cart.deleteOne({ user: userId }); }
module.exports = { DELIVERY_FEE, effectivePrice, getCart, addItem, updateItem, removeItem, clearCart };
