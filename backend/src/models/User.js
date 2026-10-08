const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  password: { type: String, required: true, select: false },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  role: { type: String, enum: ["customer", "restaurant_admin", "super_admin"], default: "customer", index: true },
  isActive: { type: Boolean, default: true, index: true },
  tokenVersion: { type: Number, default: 0, select: false },
}, { timestamps: true, toJSON: { virtuals: true, transform: (doc, ret) => { delete ret.password; delete ret.tokenVersion; delete ret.__v; return ret; } } });

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(password) { return bcrypt.compare(password, this.password); };
module.exports = mongoose.model("User", userSchema);
