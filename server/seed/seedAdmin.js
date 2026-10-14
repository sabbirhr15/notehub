// Creates the first Admin account. Run once with:  npm run seed:admin
// Uses ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD from server/.env
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");

async function run() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env first");
  }

  await connectDB();

  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    existing.role = "admin";
    await existing.save();
    console.log(`Existing user ${ADMIN_EMAIL} is now an admin.`);
  } else {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({
      name: ADMIN_NAME || "Admin",
      email: ADMIN_EMAIL,
      passwordHash,
      role: "admin",
    });
    console.log(`Admin created: ${ADMIN_EMAIL}`);
  }
}

run()
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
