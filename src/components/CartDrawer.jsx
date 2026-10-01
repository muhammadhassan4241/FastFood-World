import { Clock3, ShoppingBasket, Sparkles, X } from "lucide-react";
import QtyStepper from "./QtyStepper";

function CartDrawer({ open, onClose, cart, products, onAdd, onRemove, onCheckout }) {
  const parsedItems = Object.entries(cart)
    .map(([key, val]) => {
      const quantity = typeof val === "number" ? val : val?.quantity || 0;
      if (quantity <= 0) return null;

      const prodId =
        typeof val === "object" && val?.productId
          ? val.productId
          : Number(key.split("_")[0]);
      const product = products.find((item) => item.id === prodId);
      if (!product) return null;

      const drink = typeof val === "object" ? val.drink : null;
      const foodPrice = Number(product.price || 0);
      const drinkPrice = drink ? Number(drink.price || 0) : 0;
      const unitPrice = foodPrice + drinkPrice;
      const subtotal = unitPrice * quantity;

      return {
        key,
        product,
        title: product.title || product.name,
        image: product.image,
        drink,
        drinkName: drink ? drink.name || drink.title : "No Drink",
        drinkPrice,
        unitPrice,
        subtotal,
        quantity,
      };
    })
    .filter(Boolean);

  const total = parsedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalCount = parsedItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-coal-950/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-coal-200 bg-white shadow-2xl transition-transform duration-500 dark:border-coal-800 dark:bg-coal-950 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-coal-200 px-6 py-5 dark:border-coal-800">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">
              Your order
            </p>
            <h2 className="mt-1 text-2xl font-black">
              Cart <span className="text-zinc-400">({totalCount})</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500 transition hover:bg-coal-100 hover:text-zinc-950 dark:hover:bg-coal-800 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {parsedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <ShoppingBasket size={30} />
              </div>
              <p className="font-black">Your cart is waiting</p>
              <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">
                Add your favorite meals and drinks, and they will stay here even when you refresh.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {parsedItems.map((item, index) => (
                <div
                  key={item.key}
                  className="animate-fade-up flex gap-3 rounded-2xl border border-coal-200 p-3 dark:border-coal-800 bg-white dark:bg-coal-900/60"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-20 w-20 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-zinc-900 dark:text-white">
                      {item.title}
                    </p>

                    {/* Drink Display */}
                    <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Drink:{" "}
                      <span className={item.drink ? "text-teal-600 dark:text-teal-400 font-bold" : "text-zinc-400"}>
                        {item.drink ? `${item.drinkName} (+Rs. ${item.drinkPrice})` : "No Drink"}
                      </span>
                    </p>

                    <p className="mt-1 text-xs font-black text-teal-600 dark:text-teal-400">
                      Rs. {item.subtotal.toLocaleString()}
                      {item.quantity > 1 && (
                        <span className="text-[10px] font-normal text-zinc-400 ml-1">
                          (Rs. {item.unitPrice} ea)
                        </span>
                      )}
                    </p>

                    <div className="mt-3">
                      <QtyStepper
                        qty={item.quantity}
                        onAdd={() => onAdd(item.key, item.drink)}
                        onRemove={() => onRemove(item.key)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {parsedItems.length > 0 && (
          <div className="border-t border-coal-200 px-6 py-5 dark:border-coal-800">
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Clock3 size={15} />
              Estimated delivery: 25–35 minutes
            </div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-zinc-500">Subtotal</span>
              <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
                Rs. {Number(total).toLocaleString()}
              </span>
            </div>
            <button
              onClick={() => {
                onCheckout();
                onClose();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 py-4 font-black text-white shadow-xl shadow-teal-500/20 transition hover:-translate-y-0.5 hover:bg-teal-700"
            >
              <Sparkles size={17} />
              Continue to checkout
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

export default CartDrawer;
