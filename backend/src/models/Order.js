const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, index: true },
  order_id: { type: String, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false, index: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: false, index: true },
  customer_name: { type: String, default: "Guest" },
  mobile: { type: String, default: "N/A" },
  customer_phone: { type: String },
  customer_email: { type: String, default: "" },
  address: { type: String, default: "N/A" },
  deliveryAddress: {
    address: { type: String },
    city: { type: String },
    postalCode: { type: String, default: "" },
  },
  phone: { type: String },
  special_instructions: { type: String, default: "" },
  notes: { type: String, default: "", maxlength: 1000 },
  items: { type: mongoose.Schema.Types.Mixed, default: [] },
  subtotal: { type: Number, default: 0, min: 0 },
  deliveryFee: { type: Number, default: 150, min: 0 },
  delivery_fee: { type: Number, default: 150, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total: { type: Number, default: 0, min: 0 },
  total_amount: { type: Number, default: 0, min: 0 },
  paymentMethod: { type: String, default: "cash" },
  payment_method: { type: String, default: "cod" },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending", index: true },
  orderStatus: { type: String, default: "pending", index: true },
  status: { type: String, default: "pending", index: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

orderSchema.virtual("created_at").get(function () {
  return this.createdAt ? this.createdAt.toISOString() : new Date().toISOString();
});

orderSchema.pre("save", function () {
  if (!this.orderNumber && this.order_id) this.orderNumber = this.order_id;
  if (!this.order_id && this.orderNumber) this.order_id = this.orderNumber;
  if (!this.orderNumber && !this.order_id) {
    const random = Math.floor(10000 + Math.random() * 90000);
    this.orderNumber = `FW-${random}`;
    this.order_id = this.orderNumber;
  }
  if (!this.status && this.orderStatus) this.status = this.orderStatus;
  if (!this.orderStatus && this.status) this.orderStatus = this.status;
  if (!this.total && this.total_amount) this.total = this.total_amount;
  if (!this.total_amount && this.total) this.total_amount = this.total;
  if (!this.phone && this.mobile) this.phone = this.mobile;
  if (!this.mobile && this.phone) this.mobile = this.phone;
  if (!this.deliveryFee && this.delivery_fee) this.deliveryFee = this.delivery_fee;
  if (!this.delivery_fee && this.deliveryFee) this.delivery_fee = this.deliveryFee;
});

orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
