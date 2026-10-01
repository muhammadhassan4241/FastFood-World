import { useState, useMemo } from "react";
import { X, Check, GlassWater, Plus, Star, Loader2 } from "lucide-react";
import StarRating from "./StarRating";
import QtyStepper from "./QtyStepper";

function ProductDetailModal({
  product,
  products = [],
  cart = {},
  onAdd,
  onRemove,
  onClose,
  onSubmitReview,
  ratingSummary,
}) {
  const [drinkSelection, setDrinkSelection] = useState({ productId: null, drink: null });
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [ratedProducts, setRatedProducts] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("foodworld-rated-products") || "{}");
    } catch {
      return {};
    }
  });
  const selectedDrink = drinkSelection.productId === product?.id ? drinkSelection.drink : null;
  const setSelectedDrink = (drink) => setDrinkSelection({ productId: product?.id ?? null, drink });
  const isDrinkProduct = (product?.category || "").toLowerCase() === "drinks";

  // Dynamically load active, available drinks from the products catalog
  const availableDrinks = useMemo(() => {
    if (isDrinkProduct) return [];
    return (Array.isArray(products) ? products : [])
      .filter(
        (p) =>
          p &&
          (p.category || "").toLowerCase() === "drinks" &&
          p.is_available !== false
      )
      .map((d) => ({
        id: d.id,
        name: d.name || d.title,
        price: Number(d.price || 0),
        image: d.image || "",
      }));
  }, [products, isDrinkProduct]);

  // Reset the in-progress rating form whenever the modal switches to a
  // different product (adjusting state during render, per React's guidance,
  // instead of a useEffect that would cause an extra render pass).
  const [lastProductId, setLastProductId] = useState(product?.id);
  if (product?.id !== lastProductId) {
    setLastProductId(product?.id);
    setMyRating(0);
    setHoverRating(0);
    setReviewComment("");
    setReviewError("");
  }

  if (!product || typeof product !== "object") return null;

  const alreadyRated = Boolean(product && ratedProducts[product.id]);

  const handleSubmitReview = async () => {
    if (!myRating || submitting || !onSubmitReview) return;
    setSubmitting(true);
    setReviewError("");
    const result = await onSubmitReview(product.id, myRating, reviewComment);
    setSubmitting(false);
    if (result?.success) {
      const updated = { ...ratedProducts, [product.id]: myRating };
      setRatedProducts(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem("foodworld-rated-products", JSON.stringify(updated));
      }
    } else {
      setReviewError(result?.error || "Could not submit your rating. Please try again.");
    }
  };


  // Pricing calculation
  const foodPrice = Number(product.price || 0);
  const drinkPrice = selectedDrink ? Number(selectedDrink.price || 0) : 0;
  const singleItemPrice = foodPrice + drinkPrice;

  // Cart key for the specific food + drink combination
  const cartKey = selectedDrink
    ? `${product.id}_drink_${selectedDrink.id}`
    : `${product.id}`;

  const currentItemInCart = cart[cartKey];
  const comboQty = currentItemInCart
    ? typeof currentItemInCart === "number"
      ? currentItemInCart
      : currentItemInCart.quantity || 0
    : 0;

  const displayPrice = comboQty > 0 ? singleItemPrice * comboQty : singleItemPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-coal-950/70 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-coal-900 border border-coal-200 dark:border-coal-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/40 z-10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-coal-950/60 hover:bg-coal-950 text-white backdrop-blur-md transition-colors"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Product Image Banner */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-coal-100 dark:bg-coal-800">
          <img
            src={product.image}
            alt={product.title || product.name || "Product"}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-coal-950/60 via-transparent to-transparent" />
          <span className="absolute bottom-4 left-5 text-[11px] font-black uppercase tracking-wider text-teal-300 bg-coal-950/70 px-3 py-1 rounded-full backdrop-blur-md border border-teal-400/20">
            {product.category}
          </span>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-zinc-900 dark:text-white">
              {product.title || product.name}
            </h2>
            <div className="shrink-0">
              <StarRating
                value={ratingSummary?.avgRating || 0}
                count={ratingSummary?.count || 0}
                showCount
              />
            </div>
          </div>

          <p className="text-zinc-600 dark:text-zinc-400 mt-3 text-xs sm:text-sm leading-relaxed">
            {product.description}
          </p>

          {/* CUSTOMER RATING SECTION */}
          <div className="mt-5 pt-5 border-t border-coal-100 dark:border-coal-800">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white">
              Rate this product
            </h3>

            {alreadyRated ? (
              <p className="mt-2 text-xs text-zinc-500">
                Thanks — you rated this{" "}
                <span className="font-bold text-teal-600 dark:text-teal-400">{ratedProducts[product.id]} / 5</span>.
              </p>
            ) : (
              <>
                <div className="mt-2.5 flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMyRating(value)}
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`Rate ${value} out of 5`}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        size={22}
                        className={
                          (hoverRating || myRating) >= value
                            ? "fill-amber-400 text-amber-400"
                            : "text-zinc-300 dark:text-zinc-700"
                        }
                      />
                    </button>
                  ))}
                </div>

                {myRating > 0 && (
                  <div className="mt-3">
                    <textarea
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      placeholder="Share a quick word about this product (optional)"
                      rows={2}
                      className="w-full resize-none rounded-xl border border-coal-200 bg-coal-50 px-3 py-2 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-teal-400 focus:outline-none dark:border-coal-800 dark:bg-coal-950/60 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={handleSubmitReview}
                      disabled={submitting}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting && <Loader2 size={13} className="animate-spin" />}
                      {submitting ? "Submitting..." : "Submit rating"}
                    </button>
                    {reviewError && (
                      <p className="mt-1.5 text-[11px] font-medium text-red-500">{reviewError}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* CHOOSE YOUR DRINK SECTION (Only for food products) */}
          {!isDrinkProduct && availableDrinks.length > 0 && (
            <div className="mt-6 pt-5 border-t border-coal-100 dark:border-coal-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                    Choose Your Drink
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Complete your meal with a refreshing drink.
                  </p>
                </div>
                {selectedDrink && (
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                    +{selectedDrink.name}
                  </span>
                )}
              </div>

              {/* Drink Selection Cards Grid */}
              <div className="mt-3.5 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* Option: No Drink */}
                <button
                  type="button"
                  onClick={() => setSelectedDrink(null)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    selectedDrink === null
                      ? "border-teal-500 bg-teal-500/10 shadow-sm ring-1 ring-teal-500/30"
                      : "border-coal-200 dark:border-coal-800 bg-coal-50/70 dark:bg-coal-950/60 hover:border-teal-500/40"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      selectedDrink === null
                        ? "bg-teal-600 text-white"
                        : "bg-coal-200 dark:bg-coal-800 text-zinc-500"
                    }`}
                  >
                    <GlassWater size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                      No Drink
                    </p>
                    <p className="text-[10px] text-zinc-500 font-medium">+Rs. 0</p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedDrink === null
                        ? "border-teal-500 bg-teal-600 text-white"
                        : "border-coal-300 dark:border-coal-700"
                    }`}
                  >
                    {selectedDrink === null && <Check size={10} strokeWidth={3} />}
                  </div>
                </button>

                {/* Drink Options */}
                {availableDrinks.map((drink) => {
                  const isSelected = selectedDrink?.id === drink.id;
                  return (
                    <button
                      key={drink.id}
                      type="button"
                      onClick={() => setSelectedDrink(drink)}
                      className={`flex items-center gap-3 p-2.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "border-teal-500 bg-teal-500/10 shadow-sm ring-1 ring-teal-500/30"
                          : "border-coal-200 dark:border-coal-800 bg-coal-50/70 dark:bg-coal-950/60 hover:border-teal-500/40"
                      }`}
                    >
                      {drink.image ? (
                        <img
                          src={drink.image}
                          alt={drink.name}
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {drink.name?.charAt(0).toUpperCase() || "D"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {drink.name}
                        </p>
                        <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">
                          +Rs. {drink.price}
                        </p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "border-teal-500 bg-teal-600 text-white"
                            : "border-coal-300 dark:border-coal-700"
                        }`}
                      >
                        {isSelected && <Check size={10} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Action / Price Bar */}
          <div className="flex items-center justify-between mt-7 pt-5 border-t border-coal-100 dark:border-coal-800">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {selectedDrink ? "Meal Total (Food + Drink)" : "Item Price"}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
                  Rs. {Number(displayPrice).toLocaleString()}
                </span>
                {selectedDrink && (
                  <span className="text-xs text-zinc-400 line-through">
                    Rs. {foodPrice}
                  </span>
                )}
              </div>
            </div>

            {comboQty > 0 ? (
              <div className="flex items-center gap-2">
                <QtyStepper
                  qty={comboQty}
                  onAdd={() => onAdd(product.id, selectedDrink)}
                  onRemove={() => onRemove(cartKey)}
                />
              </div>
            ) : (
              <button
                onClick={() => onAdd(product.id, selectedDrink)}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-full px-5 py-3 shadow-lg shadow-teal-500/20 transition hover:-translate-y-0.5 active:scale-95"
              >
                <Plus size={16} />
                <span>Add to cart</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailModal;