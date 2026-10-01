import { useMemo, useState } from "react";
import { Filter, Search, SlidersHorizontal, Star, X, Sparkles } from "lucide-react";
import ProductCard from "./ProductCard";

/**
 * Returns the total quantity in cart for a given product ID,
 * including all combo keys like "5_drink_9" that belong to the same product.
 */
function getProductQty(cart, productId) {
  return Object.entries(cart).reduce((sum, [key, val]) => {
    const pid =
      typeof val === "object" && val?.productId
        ? val.productId
        : Number(key.split("_")[0]);
    const q = typeof val === "number" ? val : val?.quantity || 0;
    return pid === productId ? sum + q : sum;
  }, 0);
}

/**
 * Returns the first cart key that belongs to the given product ID.
 * Used to ensure +/- in the grid card operates on the correct combo entry.
 */
function getProductCartKey(cart, productId) {
  const entry = Object.entries(cart).find(([key, val]) => {
    const pid =
      typeof val === "object" && val?.productId
        ? val.productId
        : Number(key.split("_")[0]);
    return pid === productId;
  });
  return entry ? entry[0] : String(productId);
}

const MENU_CATEGORIES = [
  { id: "All", label: "All", sidebarLabel: "All" },
  { id: "Burger", label: "Burgers", sidebarLabel: "Burger" },
  { id: "Pizza", label: "Pizza", sidebarLabel: "Pizza" },
  { id: "Shawarma", label: "Shawarma", sidebarLabel: "Shawarma" },
  { id: "Drinks", label: "Drinks", sidebarLabel: "Drinks" },
];

// Rating filter options
const RATING_FILTERS = [
  { id: "all", label: "All Ratings", minRating: 0 },
  { id: "4", label: "4+ Stars", minRating: 4 },
  { id: "3", label: "3+ Stars", minRating: 3 },
  { id: "2", label: "2+ Stars", minRating: 2 },
  { id: "1", label: "1+ Stars", minRating: 1 },
];

function MenuPage({
  products = [],
  cart,
  onAdd,
  onRemove,
  initialCategory,
  onOpenDetail,
  ratingSummaries = {},
}) {
  const [category, setCategory] = useState(initialCategory || "All");
  const [maxPrice, setMaxPrice] = useState(2000);
  const [query, setQuery] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [ratingFilter, setRatingFilter] = useState("all"); // 'all' | '4' | '3' | '2' | '1'

  const selectedRatingOption = RATING_FILTERS.find((f) => f.id === ratingFilter) || RATING_FILTERS[0];

  const visible = useMemo(() => {
    return products.filter((product) => {
      const title = product.title || product.name || "";
      const prodCat = (product.category || "").toLowerCase();

      // Category filter: "All" includes everything (food & drinks)
      let matchesCategory = true;
      if (category !== "All") {
        if (category === "Burger" || category === "Burgers") {
          matchesCategory = prodCat.includes("burger");
        } else {
          matchesCategory = prodCat === category.toLowerCase();
        }
      }

      // Price filter
      const matchesPrice = Number(product.price || 0) <= maxPrice;

      // Search query filter: search by title, name, description, or category
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        title.toLowerCase().includes(q) ||
        (product.description || "").toLowerCase().includes(q) ||
        prodCat.includes(q);

      // Rating filter — uses the REAL average rating from Supabase
      let matchesRating = true;
      if (selectedRatingOption.minRating > 0) {
        const summary = ratingSummaries[product.id];
        // Products with no ratings don't appear when a specific rating is selected
        const avg = summary?.avgRating || 0;
        matchesRating = avg >= selectedRatingOption.minRating;
      }

      return matchesCategory && matchesPrice && matchesQuery && matchesRating;
    });
  }, [products, category, maxPrice, query, selectedRatingOption, ratingSummaries]);

  const handleResetFilters = () => {
    setCategory("All");
    setMaxPrice(2000);
    setQuery("");
    setRatingFilter("all");
  };

  const hasActiveFilters =
    category !== "All" || maxPrice < 2000 || query.length > 0 || ratingFilter !== "all";

  return (
    <div className="min-h-[75vh] px-4 pb-20 pt-6 sm:px-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="animate-fade-up flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/25 bg-teal-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-teal-700 dark:text-teal-400">
              <Sparkles size={13} />
              <span>Full Store Menu</span>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-4xl md:text-5xl">
              Fresh Food &amp; Chilled Drinks.
            </h1>
            <p className="mt-2 max-w-xl text-xs sm:text-sm leading-relaxed text-zinc-500">
              From flame-grilled smash burgers and stone-baked pizza to authentic shawarma and ice-cold drinks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="inline-flex items-center gap-2 rounded-2xl border border-coal-200 bg-white px-3.5 py-2.5 text-xs font-bold shadow-sm dark:border-coal-800 dark:bg-coal-900 lg:hidden"
            >
              <SlidersHorizontal size={15} className="text-teal-600 dark:text-teal-400" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[9px] font-black text-white">
                  !
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 rounded-2xl border border-coal-200 bg-white px-4 py-2.5 shadow-sm dark:border-coal-800 dark:bg-coal-900 text-xs sm:text-sm">
              <Filter size={15} className="text-teal-600 dark:text-teal-400" />
              <span className="font-bold text-zinc-900 dark:text-white">
                {visible.length} items
              </span>
            </div>
          </div>
        </div>

        {/* Top Horizontal Category Scroll Bar (Mobile & Tablet Friendly) */}
        <div className="mt-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {MENU_CATEGORIES.map((item) => {
              const active = category.toLowerCase() === item.id.toLowerCase();
              return (
                <button
                  key={item.id}
                  onClick={() => setCategory(item.id)}
                  className={`rounded-2xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    active
                      ? "bg-teal-600 text-white shadow-lg shadow-teal-500/25 scale-[1.02]"
                      : "border border-coal-200/90 bg-white text-zinc-600 hover:border-teal-500/40 hover:text-teal-600 dark:hover:text-teal-400 dark:border-coal-800 dark:bg-coal-900 dark:text-zinc-300"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Filters Sidebar + Products Display */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Filters Sidebar */}
          <aside
            className={`rounded-3xl border border-coal-200 bg-white p-5 shadow-sm dark:border-coal-800 dark:bg-coal-900 lg:sticky lg:top-24 h-fit ${
              mobileFilterOpen ? "block" : "hidden lg:block"
            }`}
          >
            <div className="mb-5 flex items-center justify-between border-b border-coal-100 pb-3 dark:border-coal-800">
              <p className="flex items-center gap-2 text-sm font-black text-zinc-900 dark:text-white">
                <SlidersHorizontal size={16} className="text-teal-600 dark:text-teal-400" />
                <span>Filters</span>
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Search Input */}
            <label className="relative block">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search food or drinks..."
                className="w-full rounded-2xl border border-coal-200 bg-coal-50 py-2.5 pl-9 pr-3 text-xs font-medium outline-none transition focus:border-teal-500 dark:border-coal-700 dark:bg-coal-950"
              />
            </label>

            {/* Categories */}
            <div className="mt-6">
              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                Category
              </p>
              <div className="flex flex-col gap-1">
                {MENU_CATEGORIES.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCategory(item.id)}
                    className={`rounded-xl px-3 py-2 text-left text-xs font-bold transition ${
                      category.toLowerCase() === item.id.toLowerCase()
                        ? "bg-teal-600 text-white font-bold"
                        : "text-zinc-600 hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400 dark:text-zinc-300 dark:hover:bg-coal-800"
                    }`}
                  >
                    {item.sidebarLabel || item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div className="mt-6 border-t border-coal-100 pt-5 dark:border-coal-800">
              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                Rating
              </p>
              <div className="flex flex-col gap-1">
                {RATING_FILTERS.map((option) => {
                  const isActive = ratingFilter === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setRatingFilter(option.id)}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold transition ${
                        isActive
                          ? "bg-teal-600 text-white"
                          : "text-zinc-600 hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400 dark:text-zinc-300 dark:hover:bg-coal-800"
                      }`}
                    >
                      {option.minRating > 0 && (
                        <Star
                          size={12}
                          className={isActive ? "fill-white text-white" : "fill-amber-400 text-amber-400"}
                        />
                      )}
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Max Price Slider */}
            <div className="mt-6 border-t border-coal-100 pt-5 dark:border-coal-800">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  Max Price
                </p>
                <span className="text-xs font-black text-teal-600 dark:text-teal-400">Rs. {maxPrice}</span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="50"
                value={maxPrice}
                onChange={(event) => setMaxPrice(Number(event.target.value))}
                className="w-full accent-teal-600"
              />
            </div>
          </aside>

          {/* Products Grid */}
          <main className="min-w-0">
            {/* Status Bar */}
            <div className="mb-4 flex items-center justify-between text-xs text-zinc-500">
              <p>
                Showing{" "}
                <span className="font-bold text-zinc-900 dark:text-white">
                  {visible.length}
                </span>{" "}
                delicious {category === "All" ? "items" : category.toLowerCase()}
                {ratingFilter !== "all" && (
                  <span className="ml-1 inline-flex items-center gap-0.5 text-teal-600 dark:text-teal-400 font-bold">
                    · <Star size={11} className="fill-amber-400 text-amber-400" />
                    {selectedRatingOption.label}
                  </span>
                )}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Clear filters <X size={13} />
                </button>
              )}
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
                >
                  <ProductCard
                    product={product}
                    qty={getProductQty(cart, product.id)}
                    onAdd={() => onAdd(getProductCartKey(cart, product.id) === String(product.id) ? product.id : getProductCartKey(cart, product.id))}
                    onRemove={() => onRemove(getProductCartKey(cart, product.id))}
                    onOpenDetail={onOpenDetail}
                    ratingSummary={ratingSummaries[product.id] || null}
                  />
                </div>
              ))}
            </div>

            {/* Empty State */}
            {!visible.length && (
              <div className="rounded-3xl border border-dashed border-coal-300 p-12 text-center dark:border-coal-700">
                <p className="text-base font-black text-zinc-800 dark:text-zinc-200">
                  No products or drinks match this filter.
                </p>
                <p className="mt-1.5 text-xs text-zinc-500">
                  {ratingFilter !== "all"
                    ? `No items currently have a ${selectedRatingOption.label} average rating. Try a lower rating filter.`
                    : "Try clearing your search or switching to another category."}
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-teal-700"
                >
                  View All Menu Items
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default MenuPage;
