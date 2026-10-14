// The only place that changes a user's points. FR-9 (earning) and FR-10 (spending) both use it,
// so the ledger and the cached balance can never drift apart.
const User = require("../models/User");
const PointTransaction = require("../models/PointTransaction");

// Rules, kept in one place so they are easy to change.
const POINT_RULES = {
  NOTE_APPROVED: 20,
  LIKE_RECEIVED: 5,
  DOWNLOAD_RECEIVED: 10,
  REVIEW_APPROVED: 5,
  VIEW_COST: 3,
  DOWNLOAD_COST: 10,
};

// amount > 0 adds points, amount < 0 spends them.
// Spending is refused (returns null) if the balance would go below zero.
async function changePoints(userId, amount, reason, refNote) {
  const filter = { _id: userId };
  if (amount < 0) filter.pointsBalance = { $gte: -amount };

  const user = await User.findOneAndUpdate(filter, { $inc: { pointsBalance: amount } }, { new: true });
  if (!user) return null;

  await PointTransaction.create({
    user: userId,
    amount,
    reason,
    refNote,
    balanceAfter: user.pointsBalance,
  });
  return user.pointsBalance;
}

module.exports = { POINT_RULES, changePoints };
