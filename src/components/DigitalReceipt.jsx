import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Download, Check, Phone, MapPin, Calendar, CreditCard, ShieldCheck } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  formatCurrency,
  formatDateTime,
  formatOrderId,
  normalizeOrder,
  ORDER_STATUS_MAP,
} from "../utils/orderUtils";

function DigitalReceipt({ order, products = [], showActions = true }) {
  const receiptRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const normalized = normalizeOrder(order, products);
  const orderIdText = formatOrderId(normalized);
  const cleanId = normalized.order_id || String(normalized.id || "0000");
  const trackingUrl = typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}?tracking=${encodeURIComponent(cleanId)}`
    : `https://foodworld.app/track/${cleanId}`;

  const statusKey = (normalized.status || "pending").toLowerCase();
  const statusInfo = ORDER_STATUS_MAP[statusKey] || ORDER_STATUS_MAP.pending;
  const paymentMethodLabel = normalized.payment_method === "card"
    ? "Credit / Debit Card"
    : "Cash On Delivery (COD)";

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, Math.max(160, (canvas.height * 80) / canvas.width)],
      });
      pdf.addImage(imgData, "PNG", 0, 0, 80, (canvas.height * 80) / canvas.width);
      pdf.save(`FoodWorld_Receipt_${orderIdText.replace("#", "")}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Could not generate PDF. You can also use the Print button to save as PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Top Action Bar */}
      {showActions && (
        <div className="no-print mb-4 flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-full bg-coal-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-teal-600 dark:bg-white dark:text-zinc-900 dark:hover:bg-teal-600 dark:hover:text-white"
          >
            <Printer size={14} />
            <span>Print Receipt</span>
          </button>

          <button
            disabled={downloading}
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-teal-500/20 transition hover:bg-teal-700 disabled:opacity-50"
          >
            <Download size={14} />
            <span>{downloading ? "Preparing PDF..." : "Download PDF"}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 rounded-full border border-coal-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 transition hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 dark:border-coal-700 dark:bg-coal-900 dark:text-zinc-300"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <ShieldCheck size={14} />}
            <span>{copied ? "Link Copied!" : "Copy Order Link"}</span>
          </button>
        </div>
      )}

      {/* Printable Receipt Container */}
      <div className="print-area w-full max-w-md">
        <div
          ref={receiptRef}
          className="receipt-card relative overflow-hidden rounded-3xl border border-coal-200 bg-white p-6 text-zinc-900 shadow-xl transition-all dark:border-coal-800 dark:bg-coal-900 dark:text-zinc-100 sm:p-8"
        >
          {/* Header Brand */}
          <div className="border-b border-dashed border-coal-200 pb-5 text-center dark:border-coal-800">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-coal-900 text-white text-xl font-black shadow-lg shadow-teal-500/20">
              F
            </div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
              FOOD <span className="text-teal-600 dark:text-teal-400">WORLD</span>
            </h2>
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              Digital Official Receipt
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Fresh & Fast • Quality Meals Delivered
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="my-4 grid grid-cols-2 gap-3 border-b border-dashed border-coal-200 pb-4 text-xs dark:border-coal-800">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Order ID
              </span>
              <span className="font-mono text-sm font-black text-teal-600 dark:text-teal-400">
                {orderIdText}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Status
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize ${statusInfo.badgeClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`} />
                {statusInfo.label}
              </span>
            </div>

            <div>
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <Calendar size={11} /> Date & Time
              </span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {formatDateTime(normalized.created_at)}
              </span>
            </div>

            <div className="text-right">
              <span className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <CreditCard size={11} /> Payment
              </span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {paymentMethodLabel}
              </span>
            </div>
          </div>

          {/* Customer Details */}
          <div className="mb-4 rounded-2xl bg-coal-50 p-3.5 text-xs dark:bg-coal-950/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Customer Information
            </p>
            <p className="mt-1 font-bold text-zinc-900 dark:text-white">
              {normalized.customer_name || "Guest Customer"}
            </p>
            {normalized.mobile && (
              <p className="mt-0.5 flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                <Phone size={12} className="text-teal-600 dark:text-teal-400" />
                {normalized.mobile}
              </p>
            )}
            {normalized.address && (
              <p className="mt-0.5 flex items-start gap-1.5 text-zinc-600 dark:text-zinc-400">
                <MapPin size={12} className="mt-0.5 shrink-0 text-teal-600 dark:text-teal-400" />
                <span className="line-clamp-2">{normalized.address}</span>
              </p>
            )}
            {normalized.special_instructions && (
              <p className="mt-1.5 rounded-lg bg-teal-500/10 px-2 py-1 text-[11px] font-medium text-teal-600 dark:text-teal-400">
                Note: {normalized.special_instructions}
              </p>
            )}
          </div>

          {/* Ordered Items Table */}
          <div className="mb-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Ordered Items ({normalized.items.reduce((acc, i) => acc + i.quantity, 0)})
            </p>
            <div className="space-y-2.5">
              {normalized.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex-1 pr-3">
                    <p className="font-bold text-zinc-900 dark:text-white">
                      {item.title}{" "}
                      <span className="font-normal text-zinc-400">× {item.quantity}</span>
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {formatCurrency(item.price)} each
                    </p>
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              {normalized.items.length === 0 && (
                <p className="text-center text-xs text-zinc-400 italic">No item details stored.</p>
              )}
            </div>
          </div>

          {/* Pricing Calculation Summary */}
          <div className="border-t border-dashed border-coal-200 pt-3 text-xs dark:border-coal-800">
            <div className="flex justify-between py-1 text-zinc-500 dark:text-zinc-400">
              <span>Subtotal</span>
              <span className="font-medium text-zinc-900 dark:text-white">{formatCurrency(normalized.subtotal)}</span>
            </div>
            <div className="flex justify-between py-1 text-zinc-500 dark:text-zinc-400">
              <span>Delivery Charges</span>
              <span className="font-medium text-zinc-900 dark:text-white">{formatCurrency(normalized.delivery_fee)}</span>
            </div>
            <div className="flex justify-between py-1 text-zinc-500 dark:text-zinc-400">
              <span>GST / Sales Tax (15%)</span>
              <span className="font-medium text-zinc-900 dark:text-white">{formatCurrency(normalized.tax)}</span>
            </div>
            {normalized.discount > 0 && (
              <div className="flex justify-between py-1 text-emerald-600 dark:text-emerald-400">
                <span>Discount Applied</span>
                <span className="font-medium">-{formatCurrency(normalized.discount)}</span>
              </div>
            )}
            <div className="mt-2 flex items-baseline justify-between border-t border-coal-200 pt-2.5 dark:border-coal-800">
              <span className="text-sm font-black text-zinc-900 dark:text-white">Grand Total</span>
              <span className="text-lg font-black text-teal-600 dark:text-teal-400">{formatCurrency(normalized.total_amount)}</span>
            </div>
          </div>

          {/* QR Code & Verification */}
          <div className="mt-6 flex flex-col items-center justify-center border-t border-dashed border-coal-200 pt-5 text-center dark:border-coal-800">
            <div className="rounded-2xl border border-coal-200 bg-white p-2.5 shadow-sm dark:border-coal-700">
              <QRCodeSVG
                value={trackingUrl}
                size={96}
                level="M"
                includeMargin={false}
                fgColor="#09090b"
              />
            </div>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Scan to track order or view live status
            </p>
            <p className="mt-0.5 text-[9px] font-mono text-zinc-400">
              {trackingUrl}
            </p>
          </div>

          {/* Footer note */}
          <div className="mt-5 border-t border-coal-100 pt-3 text-center text-[10px] text-zinc-400 dark:border-coal-800">
            <p className="font-semibold text-zinc-500 dark:text-zinc-400">
              Thank you for dining with Food World!
            </p>
            <p className="mt-0.5">Please keep this receipt for order verification.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DigitalReceipt;
