const User = require("../models/User");
const AppError = require("../utils/AppError");
const { signToken } = require("../utils/jwt");

function authData(user) { return { user: user.toJSON(), accessToken: signToken(user) }; }

async function register(input) {
  const email = input.email.toLowerCase();
  if (await User.exists({ email })) throw new AppError("An account with this email already exists", 409);
  const user = await User.create({ ...input, email, role: "customer" });
  return authData(user);
}

async function login(input) {
  const user = await User.findOne({ email: input.email.toLowerCase() }).select("+password +tokenVersion");
  if (!user || !(await user.comparePassword(input.password))) throw new AppError("Invalid email or password", 401);
  if (!user.isActive) throw new AppError("This account has been blocked", 403);
  return authData(user);
}

async function changePassword(user, input) {
  const current = await User.findById(user.id).select("+password +tokenVersion");
  if (!current || !(await current.comparePassword(input.currentPassword))) throw new AppError("Current password is incorrect", 401);
  current.password = input.newPassword;
  current.tokenVersion += 1;
  await current.save();
  return authData(current);
}

async function logout(user) {
  await User.findByIdAndUpdate(user.id, { $inc: { tokenVersion: 1 } });
}

module.exports = { register, login, changePassword, logout };
