const router = require("express").Router();
const controller = require("../controllers/order.controller");
const { authenticate, authenticateOptional } = require("../middleware/auth.middleware");

router.get("/track/:orderNumber", controller.track);
router.get("/search", controller.search);
router.get("/", authenticateOptional, controller.list);
router.post("/", authenticateOptional, controller.create);
router.get("/my-orders", authenticate, controller.myOrders);
router.patch("/:orderId/cancel", authenticateOptional, controller.cancel);
router.patch("/:orderId/status", authenticateOptional, controller.updateStatus);
router.get("/:orderId", authenticateOptional, controller.getOne);

module.exports = router;
