import { useCallback, useState } from "react";
import { fetchReviewsFromDB, insertReview } from "../services/ratingService";
import {
  setReviews as setRatingReviews,
  addReview as addRatingReview,
} from "../data/productRating.js";

// Keeps the star ratings shown across the app (StarRating, MenuPage,
// HomePage, Product-filter) in sync with the real "reviews" table in
// Supabase, and exposes submitReview() for the product detail modal.
export function useRatings() {
  const [reviewsVersion, setReviewsVersion] = useState(0);

  const fetchReviews = useCallback(async () => {
    try {
      const mapped = await fetchReviewsFromDB();
      setRatingReviews(mapped);
      setReviewsVersion((v) => v + 1);
    } catch (err) {
      console.warn("Error fetching reviews from database:", err.message);
    }
  }, []);

  const submitReview = useCallback(
    async (productId, rating, comment = "") => {
      try {
        await insertReview(productId, rating, comment);
        addRatingReview({ productid: productId, rating });
        setReviewsVersion((v) => v + 1);
        // Re-sync with the database in the background so counts stay accurate
        fetchReviews();
        return { success: true };
      } catch (err) {
        console.error("submitReview error:", err);
        return { success: false, error: err?.message || "Could not submit review." };
      }
    },
    [fetchReviews]
  );

  return { reviewsVersion, fetchReviews, submitReview };
}