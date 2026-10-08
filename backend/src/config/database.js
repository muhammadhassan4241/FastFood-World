const mongoose = require("mongoose");
const { mongoUri } = require("./env");

async function connectDatabase() {
  if (!mongoUri) throw new Error("MONGODB_URI is required");
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = { connectDatabase };
