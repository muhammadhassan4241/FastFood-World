import { X } from "lucide-react";
import DigitalReceipt from "./DigitalReceipt";

function OrderReceiptModal({ order, products = [], isOpen, onClose }) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-coal-950/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative my-8 w-full max-w-lg rounded-3xl border border-coal-200 bg-coal-50 p-4 shadow-2xl dark:border-coal-800 dark:bg-coal-950 sm:p-6">
        <div className="mb-3 flex items-center justify-between px-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">
            Order Receipt
          </span>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500 hover:bg-coal-200 dark:hover:bg-coal-800"
            aria-label="Close receipt"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-1 py-2">
          <DigitalReceipt order={order} products={products} onClose={onClose} showActions={true} />
        </div>
      </div>
    </div>
  );
}

export default OrderReceiptModal;
