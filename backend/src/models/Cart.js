const mongoose = require("mongoose");
const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  items: [{ menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true }, quantity: { type: Number, required: true, min: 1, max: 99 }, price: { type: Number, required: true, min: 0 } }],
  subtotal: { type: Number, default: 0, min: 0 },
  deliveryFee: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
module.exports = mongoose.model("Cart", cartSchema);
