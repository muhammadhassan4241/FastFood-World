const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: "", maxlength: 1000 },
  image: { type: String, default: "" },
  sortOrder: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });
categorySchema.index({ restaurant: 1, name: 1 }, { unique: true });
module.exports = mongoose.model("Category", categorySchema);
