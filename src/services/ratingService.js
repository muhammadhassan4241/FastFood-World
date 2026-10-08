import { apiRequest } from "./apiClient";

// Fetch every review from MongoDB backend, shaped to match
// the { productid, rating } format used by ratings calculations
export async function fetchReviewsFromDB() {
  try {
    const data = await apiRequest("/reviews", { token: null });
    return (data || []).map((row) => ({
      productid: row.productId || row.product_id || row.menuItem,
      rating: Number(row.rating) || 0,
      comment: row.comment || "",
      customer_name: row.customer_name || "Customer",
    }));
  } catch (error) {
    console.warn("Could not fetch reviews from backend:", error.message);
    return [];
  }
}

// Insert a single customer review into MongoDB backend
export async function insertReview(productId, rating, comment) {
  const payload = {
    productId: String(productId),
    product_id: String(productId),
    rating: Number(rating),
    comment: comment?.trim() || null,
  };
  return apiRequest("/reviews", { method: "POST", body: payload });
}