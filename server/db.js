// ============================================================
// MongoDB connection
// ------------------------------------------------------------
// Connects once at startup. Mongoose caches the connection, so
// calling connectDb() repeatedly returns the same instance.
// ============================================================

const mongoose = require("mongoose");

let connected = false;

async function connectDb() {
  if (connected) return mongoose.connection;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to your .env locally and to Render's environment variables."
    );
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000
    });
    connected = true;
    console.log("[db] Connected to MongoDB");
    return mongoose.connection;
  } catch (err) {
    console.error("[db] Connection failed:", err.message);
    throw err;
  }
}

module.exports = { connectDb, mongoose };