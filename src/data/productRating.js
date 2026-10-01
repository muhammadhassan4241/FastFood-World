// Rating filter options (used by Rating filter UI)
export const ratings = [5, 4, 3, 2, 1];

// In-memory reviews list — starts empty.
// Populated from Supabase once real reviews are fetched.
// No fake/seed fallback: products with no real reviews will show "No ratings yet".
let reviews = [];

// Replace the in-memory reviews list with real data from Supabase.
// If the list is empty (no reviews yet), reviews stays empty — no fake fallback.
export const setReviews = (list) => {
  reviews = Array.isArray(list) ? list : [];
};

// Append a single newly submitted review without waiting for a refetch.
export const addReview = (review) => {
  reviews = [...reviews, review];
};

export const countReviews = (productID) => {
  let sum = 0;
  reviews.forEach((review) => {
    if (review.productid === productID) sum++;
  });
  return sum;
};

// Average rating for a single product, based on its reviews
export const getAverageRating = (productID) => {
  const productReviews = reviews.filter((review) => review.productid === productID);

  if (productReviews.length === 0) return 0;

  const total = productReviews.reduce((sum, r) => sum + r.rating, 0);
  return total / productReviews.length;
};