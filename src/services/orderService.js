import { apiRequest } from "./apiClient";

export async function fetchOrders() {
  return apiRequest("/orders?limit=100");
}

export async function fetchMyOrders() {
  return apiRequest("/orders/my-orders?limit=100");
}

export async function fetchRestaurantOrders(restaurantId) {
  return apiRequest(`/restaurants/${restaurantId}/orders?limit=100`);
}

export async function fetchAllOrders() {
  return apiRequest("/orders?limit=100");
}

export async function clearServerCart() {
  return apiRequest("/cart", { method: "DELETE" });
}

export async function addServerCartItem(menuItemId, quantity) {
  return apiRequest("/cart/items", { method: "POST", body: { menuItemId, quantity } });
}

export async function placeOrder(payload) {
  const result = await apiRequest("/orders", { method: "POST", body: payload });
  return result?.order || result;
}

export async function updateOrderStatus(orderId, status) {
  return apiRequest(`/orders/${orderId}/status`, { method: "PATCH", body: { status } });
}

export async function trackOrder(orderNumber) {
  const result = await apiRequest(`/orders/track/${encodeURIComponent(orderNumber)}`, { token: null });
  return result?.order || result;
}

export async function searchOrders(query) {
  const result = await apiRequest(`/orders/search?q=${encodeURIComponent(query)}`, { token: null });
  return result || [];
}
