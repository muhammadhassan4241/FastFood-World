const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, default: "", maxlength: 2000 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true, index: true },
  image: { type: String, default: "" },
  openingTime: { type: String, default: "09:00" },
  closingTime: { type: String, default: "23:00" },
  isOpen: { type: Boolean, default: true, index: true },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });
restaurantSchema.index({ name: "text", description: "text", city: "text" });
module.exports = mongoose.model("Restaurant", restaurantSchema);
