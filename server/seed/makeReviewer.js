// TEMPORARY testing helper until FR-6 (reviewer roles) exists. Run with:
//   npm run dev:make-reviewer -- someone@example.com
// Makes that registered user a reviewer, so reviews (FR-7) and the approval queue (FR-5) can be tested.
// Remove this file and the npm script once FR-6 works.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

async function run() {
  const email = String(process.argv[2] || "").trim().toLowerCase();
  if (!email) throw new Error("Usage: npm run dev:make-reviewer -- someone@example.com");

  await connectDB();
  const user = await User.findOne({ email });
  if (!user) throw new Error(`No user with email ${email}. Register that account first.`);
  if (user.role === "admin") {
    console.log(`${email} is an admin already, nothing changed.`);
    return;
  }
  user.role = "reviewer";
  await user.save();
  console.log(`${email} is now a reviewer. Log out and log in again to see it.`);
}

run()
  .catch((err) => {
    console.error("Failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
