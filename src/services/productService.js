import { apiRequest, getSession } from "./apiClient";

const RESTAURANT_KEY = "foodworld-restaurant-id";
let activeRestaurantId = localStorage.getItem(RESTAURANT_KEY) || "";

const normalizeProduct = (item) => {
  const stockValue = Number(item?.stock_quantity ?? item?.quantity ?? item?.count ?? 99);

  return {
    ...item,
    id: item.id || item._id,
    title: item.name,
    category: typeof item.category === "object" ? item.category?.name || "Other" : "Other",
    is_available: item.isAvailable !== false,
    stock_quantity: Number.isFinite(stockValue) ? stockValue : 99,
    low_stock_threshold: item.low_stock_threshold ?? 5,
  };
};

export function getActiveRestaurantId() { return activeRestaurantId; }
export function setActiveRestaurantId(id) { activeRestaurantId = id || ""; if (id) localStorage.setItem(RESTAURANT_KEY, id); else localStorage.removeItem(RESTAURANT_KEY); }
export async function fetchRestaurants() { return apiRequest("/restaurants?limit=100", { token: null }); }
export async function selectRestaurantForUser(user) {
  const restaurants = await fetchRestaurants();
  const ownerId = user?.id || user?._id;
  const owned = restaurants.find((restaurant) => String(restaurant.owner?._id || restaurant.owner) === String(ownerId));
  const selected = owned || restaurants[0];
  if (!selected) throw new Error("No active restaurant is available. Run the backend seed first.");
  setActiveRestaurantId(selected._id || selected.id);
  return selected;
}
async function restaurantId() { if (activeRestaurantId) return activeRestaurantId; await selectRestaurantForUser(getSession()?.user); return activeRestaurantId; }
export async function fetchProducts() { const id = await restaurantId(); const data = await apiRequest(`/restaurants/${id}/menu?limit=100`, { token: null }); return data.map(normalizeProduct); }
async function categoryIdFor(name) { const id = await restaurantId(); const categories = await apiRequest(`/restaurants/${id}/categories`, { token: null }); const existing = categories.find((category) => category.name.toLowerCase() === String(name).toLowerCase()); if (existing) return existing._id || existing.id; const created = await apiRequest(`/restaurants/${id}/categories`, { method: "POST", body: { name: String(name || "Other"), sortOrder: categories.length + 1 } }); return created.category._id || created.category.id; }
function toMenuPayload(product, category) { return { category, name: product.name || product.title, description: product.description || "", price: Number(product.price), image: product.image || "", ingredients: product.ingredients || [], isAvailable: product.is_available !== false, preparationTime: Number(product.preparationTime || 15) }; }
export async function createProduct(product) { const id = await restaurantId(); const category = await categoryIdFor(product.category); const data = await apiRequest(`/restaurants/${id}/menu`, { method: "POST", body: toMenuPayload(product, category) }); return normalizeProduct(data.menuItem); }
export async function updateProduct(id, product) { const category = await categoryIdFor(product.category); const data = await apiRequest(`/menu/${id}`, { method: "PATCH", body: toMenuPayload(product, category) }); return normalizeProduct(data.menuItem); }
export async function deleteProduct(id) { return apiRequest(`/menu/${id}`, { method: "DELETE" }); }
export async function updateProductStock(id, stockQuantity, isAvailable) {
  const quantity = Number(stockQuantity ?? 0);
  return apiRequest(`/menu/${id}/availability`, {
    method: "PATCH",
    body: { isAvailable: Boolean(isAvailable && quantity > 0) },
  });
}
