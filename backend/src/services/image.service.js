require("../config/env");
const { v2: cloudinary } = require("cloudinary"); const AppError = require("../utils/AppError");
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
function uploadImage(buffer) { if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) throw new AppError("Cloudinary is not configured", 503); return new Promise((resolve, reject) => cloudinary.uploader.upload_stream({ folder: "restaurant-api", resource_type: "image" }, (error, result) => error ? reject(error) : resolve(result.secure_url)).end(buffer)); }
module.exports = { uploadImage };
