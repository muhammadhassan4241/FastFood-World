const mongoose = require("mongoose");
const AppError = require("./AppError");

function isObjectId(value) {
  return mongoose.isValidObjectId(value);
}

function assertObjectId(value, name = "id") {
  if (!mongoose.isValidObjectId(value)) throw new AppError(`Invalid ${name}`, 422);
  return value;
}

module.exports = { assertObjectId, isObjectId };
