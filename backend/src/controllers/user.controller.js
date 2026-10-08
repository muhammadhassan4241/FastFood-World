const User = require("../models/User"); const authService = require("../services/auth.service"); const asyncHandler = require("../utils/asyncHandler"); const { success } = require("../utils/apiResponse");
exports.me = asyncHandler(async (req, res) => success(res, { data: { user: req.user } }));
exports.updateMe = asyncHandler(async (req, res) => { const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true, runValidators: true }); success(res, { message: "Profile updated successfully", data: { user } }); });
exports.changePassword = asyncHandler(async (req, res) => success(res, { message: "Password changed successfully", data: await authService.changePassword(req.user, req.body) }));
