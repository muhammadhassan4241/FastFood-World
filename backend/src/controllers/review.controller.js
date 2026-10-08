const Review = require("../models/Review");
const MenuItem = require("../models/MenuItem");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const { isObjectId } = require("../utils/objectId");

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  const pid = req.query.productId || req.query.product_id || req.query.menuItemId;
  if (pid) {
    filter.$or = [{ productId: pid }, { product_id: pid }];
    if (isObjectId(pid)) {
      filter.$or.push({ menuItem: pid });
    }
  }

  const reviews = await Review.find(filter)
    .select("productId product_id menuItem rating comment customer_name createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const formatted = reviews.map((r) => ({
    ...r,
    id: r._id,
    productid: r.productId || r.product_id,
    product_id: r.productId || r.product_id,
  }));

  success(res, { data: formatted });
});

exports.create = asyncHandler(async (req, res) => {
  const targetId = req.params.menuItemId || req.body.productId || req.body.product_id || req.body.menuItemId;
  if (!targetId) throw new AppError("Product ID is required to submit a review", 400);

  const rating = Number(req.body.rating);
  if (!rating || rating < 1 || rating > 5) throw new AppError("Rating must be between 1 and 5", 400);

  const reviewDoc = {
    productId: String(targetId),
    product_id: String(targetId),
    rating,
    comment: req.body.comment?.trim() || "",
    customer_name: req.user?.name || req.body.customer_name || "Food World Customer",
    user: req.user?._id || null,
  };

  if (isObjectId(targetId)) {
    reviewDoc.menuItem = targetId;
  }

  const review = await Review.create(reviewDoc);
  success(res, { status: 201, message: "Review saved successfully", data: { review } });
});
