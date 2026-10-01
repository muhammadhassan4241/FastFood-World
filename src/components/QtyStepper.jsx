import { Plus, Minus } from "lucide-react";

/**
 * QtyStepper
 * Props:
 *   qty      - current quantity
 *   onAdd    - callback when + is clicked
 *   onRemove - callback when - is clicked
 *   maxQty   - (optional) maximum allowed quantity; disables + when qty >= maxQty
 *   disabled - (optional) if true, disables both buttons (e.g. item is unavailable)
 */
function QtyStepper({ qty, onAdd, onRemove, maxQty = Infinity, disabled = false }) {
  return (
    <div className="flex items-center gap-2 bg-coal-100 dark:bg-coal-800 rounded-full px-1 py-1">
      <button
        onClick={onRemove}
        disabled={disabled}
        className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-coal-200 dark:hover:bg-coal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Minus size={13} />
      </button>
      <span className="text-sm font-semibold text-zinc-900 dark:text-white w-5 text-center">{qty}</span>
      <button
        onClick={onAdd}
        disabled={disabled || qty >= maxQty}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}

export default QtyStepper;