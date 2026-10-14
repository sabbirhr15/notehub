// TEMPORARY testing helper for Module 1. Run with:  npm run dev:approve-all
// Approves every pending note, so browse, details, like, save and download can be tested
// before the real approval queue (FR-5, Module 2) exists. Not needed after Module 2.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Note = require("../models/Note");

async function run() {
  await connectDB();
  const result = await Note.updateMany(
    { status: "pending" },
    { status: "approved", reviewedAt: new Date() }
  );
  console.log(`Approved ${result.modifiedCount} pending note(s).`);
}

run()
  .catch((err) => {
    console.error("Failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
