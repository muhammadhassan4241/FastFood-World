const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, uppercase: true, trim: true, unique: true, index: true },
  discountType: { type: String, enum: ["percentage", "fixed"], default: "fixed" },
  discountValue: { type: Number, required: true, min: 0 },
  minimumOrder: { type: Number, default: 0, min: 0 },
  maximumDiscount: { type: Number, default: null, min: 0 },
  expiryDate: { type: Date, default: null },
  usageLimit: { type: Number, default: null, min: 1 },
  usedCount: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model("Coupon", couponSchema);
