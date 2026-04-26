import mongoose from "mongoose";
import fs from "fs";

function getMongoUri() {
  let uri = process.env.MONGO_URI || "mongodb://localhost:27017/wwb-db";

  if (process.env.MONGO_PASSWORD_FILE) {
    const password = fs
      .readFileSync(process.env.MONGO_PASSWORD_FILE, "utf8")
      .trim();
    uri = uri.replace("{PASSWORD}", encodeURIComponent(password));
  }

  return uri;
}

export async function connectDB() {
  const uri = getMongoUri();
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    console.warn(
      "Backend will continue running — auth routes will be unavailable until DB is connected.",
    );
  }
}
