const authService = require("../services/auth.service"); const asyncHandler = require("../utils/asyncHandler"); const { success } = require("../utils/apiResponse");
exports.register = asyncHandler(async (req, res) => success(res, { status: 201, message: "Registration successful", data: await authService.register(req.body) }));
exports.login = asyncHandler(async (req, res) => success(res, { message: "Login successful", data: await authService.login(req.body) }));
exports.logout = asyncHandler(async (req, res) => { await authService.logout(req.user); success(res, { message: "Logged out successfully" }); });
