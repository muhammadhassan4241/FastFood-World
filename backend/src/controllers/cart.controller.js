const cartService = require("../services/cart.service"); const asyncHandler = require("../utils/asyncHandler"); const { success } = require("../utils/apiResponse"); const { assertObjectId } = require("../utils/objectId");
exports.get = asyncHandler(async (req, res) => success(res, { data: { cart: await cartService.getCart(req.user.id) } }));
exports.addItem = asyncHandler(async (req, res) => success(res, { status: 201, message: "Item added to cart", data: { cart: await cartService.addItem(req.user.id, req.body) } }));
exports.updateItem = asyncHandler(async (req, res) => success(res, { message: "Cart updated", data: { cart: await cartService.updateItem(req.user.id, assertObjectId(req.params.menuItemId, "menuItemId"), req.body.quantity) } }));
exports.removeItem = asyncHandler(async (req, res) => success(res, { message: "Item removed from cart", data: { cart: await cartService.removeItem(req.user.id, assertObjectId(req.params.menuItemId, "menuItemId")) } }));
exports.clear = asyncHandler(async (req, res) => { await cartService.clearCart(req.user.id); success(res, { message: "Cart cleared" }); });
