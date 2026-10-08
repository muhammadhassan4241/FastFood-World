const router = require("express").Router();
const controller = require("../controllers/review.controller");
const { authenticateOptional } = require("../middleware/auth.middleware");

router.get("/", controller.list);
router.post("/", authenticateOptional, controller.create);

module.exports = router;
