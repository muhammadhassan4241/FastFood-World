const User = require("../models/User");
const AppError = require("../utils/AppError");
const { verifyToken } = require("../utils/jwt");
const asyncHandler = require("../utils/asyncHandler");

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) throw new AppError("Authentication token is required", 401);
  const payload = verifyToken(header.slice(7));
  const user = await User.findById(payload.sub).select("+tokenVersion");
  if (!user) throw new AppError("User no longer exists", 401);
  if (!user.isActive) throw new AppError("This account has been blocked", 403);
  if (payload.tokenVersion !== user.tokenVersion) throw new AppError("Session has expired", 401);
  req.user = user;
  next();
});

const authenticateOptional = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return next();
  try {
    const payload = verifyToken(header.slice(7));
    const user = await User.findById(payload.sub).select("+tokenVersion");
    if (user && user.isActive && payload.tokenVersion === user.tokenVersion) {
      req.user = user;
    }
  } catch (err) {
    // Optional auth silently continues
  }
  next();
});

module.exports = { authenticate, authenticateOptional };
