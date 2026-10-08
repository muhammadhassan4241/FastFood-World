const mongoose = require("mongoose");
const menuItemSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, default: "", maxlength: 2000 },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, min: 0, default: null },
  image: { type: String, default: "" },
  ingredients: [{ type: String, trim: true, maxlength: 100 }],
  isAvailable: { type: Boolean, default: true, index: true },
  isActive: { type: Boolean, default: true, index: true },
  preparationTime: { type: Number, default: 0, min: 0, max: 360 },
}, { timestamps: true });
menuItemSchema.index({ name: "text", description: "text" });
menuItemSchema.pre("validate", function validateDiscount() {
  if (this.discountPrice != null && this.discountPrice > this.price) {
    throw new Error("discountPrice cannot exceed price");
  }
});
module.exports = mongoose.model("MenuItem", menuItemSchema);
