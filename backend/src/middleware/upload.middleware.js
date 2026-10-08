const multer = require("multer");
const AppError = require("../utils/AppError");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype)),
});

function uploadError(error, req, res, next) { // eslint-disable-line no-unused-vars
  if (error instanceof multer.MulterError) return next(new AppError(error.message, 422));
  if (error) return next(new AppError("Only JPG, PNG, and WebP images are allowed", 422));
  next();
}

module.exports = { upload, uploadError };
