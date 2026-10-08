const Restaurant = require("../models/Restaurant");
const AppError = require("../utils/AppError");

async function findRestaurant(id, { includeInactive = false } = {}) {
  const filter = { _id: id };
  if (!includeInactive) filter.isActive = true;
  const restaurant = await Restaurant.findOne(filter);
  if (!restaurant) throw new AppError("Restaurant not found", 404);
  return restaurant;
}

async function assertRestaurantManager(user, restaurantId) {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) throw new AppError("Restaurant not found", 404);
  if (user.role !== "super_admin" && restaurant.owner.toString() !== user.id) throw new AppError("You can only manage your own restaurant", 403);
  return restaurant;
}

module.exports = { findRestaurant, assertRestaurantManager };
