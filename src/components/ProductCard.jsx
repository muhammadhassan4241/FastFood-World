import { Plus, Star } from "lucide-react";
import QtyStepper from "./QtyStepper";

/**
 * ProductCard
 * Shows a product with its REAL average rating from Supabase.
 *
 * Props:
 *   ratingSummary: { avgRating: number, count: number } | null
 */
function ProductCard({ product, qty, onAdd, onRemove, onOpenDetail, ratingSummary }) {
  const title = product.title || product.name;
  const isAvailable = product.is_available !== false;
  const avgRating = ratingSummary?.avgRating || 0;
  const ratingCount = ratingSummary?.count || 0;

  return (
    <article
      onClick={() => onOpenDetail(product)}
      className="group relative overflow-hidden rounded-2xl border border-coal-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/20 dark:border-white/10 dark:bg-coal-900"
    >
      <div className="relative aspect-[1.25/1] overflow-hidden bg-coal-100 dark:bg-coal-800">
        {product.image ? (
          <img
            src={product.image}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-teal-500/10 text-4xl font-black text-teal-600 dark:text-teal-400">
            F
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-coal-950/75 via-transparent to-transparent opacity-80" />
        <span className="absolute left-4 top-4 rounded-lg border border-white/20 bg-coal-950/70 px-2.5 py-1 text-[10px] font-bold text-teal-200 backdrop-blur-sm">
          {product.category}
        </span>
        {!isAvailable && (
          <span className="absolute bottom-4 left-4 rounded-full bg-coal-950/75 px-3 py-1.5 text-xs font-bold text-zinc-300">
            Currently unavailable
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-1 text-lg font-black text-zinc-900 dark:text-white">
              {title}
            </h3>
            <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-500 dark:text-zinc-400">
              {product.description}
            </p>

            {/* ── Real Rating Display ── */}
            <div className="mt-2 flex items-center gap-1.5">
              {avgRating > 0 ? (
                <>
                  {/* Stars */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        className={
                          star <= Math.round(avgRating)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-zinc-200 text-zinc-300 dark:fill-zinc-700 dark:text-zinc-600"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-xs font-black text-zinc-800 dark:text-zinc-100">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    ({ratingCount})
                  </span>
                </>
              ) : (
                <span className="text-[11px] text-zinc-400 italic">No ratings yet</span>
              )}
            </div>
          </div>

          <span className="shrink-0 whitespace-nowrap text-lg font-black text-teal-600 dark:text-teal-400">
            Rs. {Number(product.price).toLocaleString()}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-end border-t border-coal-100 pt-4 dark:border-coal-800">
          {qty > 0 ? (
            <div onClick={(event) => event.stopPropagation()}>
              <QtyStepper
                qty={qty}
                onAdd={onAdd}
                onRemove={onRemove}
                maxQty={product.stock_quantity != null ? Number(product.stock_quantity) : Infinity}
                disabled={!isAvailable}
              />
            </div>
          ) : (
            <button
              disabled={!isAvailable}
              onClick={(event) => {
                event.stopPropagation();
                onAdd();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-teal-700 hover:shadow-md hover:shadow-teal-500/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={14} />
              Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
