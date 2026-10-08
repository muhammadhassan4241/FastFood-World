const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false, index: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: false, index: true },
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: false },
  productId: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
  product_id: { type: mongoose.Schema.Types.Mixed },
  customer_name: { type: String, default: "Anonymous" },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "", trim: true, maxlength: 1000 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

reviewSchema.virtual("productid").get(function () {
  return this.productId || this.product_id;
});

reviewSchema.pre("save", function () {
  if (!this.productId && this.product_id) this.productId = this.product_id;
  if (!this.product_id && this.productId) this.product_id = this.productId;
});

module.exports = mongoose.model("Review", reviewSchema);
