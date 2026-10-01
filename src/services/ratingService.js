import { supabase } from "../supabaseClient";

// Fetch every review row from Supabase, shaped to match the
// { productid, rating } format used by src/data/Product-Rating.js
export async function fetchReviewsFromDB() {
  const { data, error } = await supabase.from("reviews").select("*");
  if (error) throw error;
  return (data || []).map((row) => ({
    productid: row.product_id,
    rating: Number(row.rating) || 0,
  }));
}

// Insert a single customer review into the "reviews" table
export async function insertReview(productId, rating, comment) {
  const payload = {
    product_id: productId,
    rating,
    comment: comment?.trim() || null,
  };
  const { error } = await supabase.from("reviews").insert([payload]);
  if (error) throw error;
}