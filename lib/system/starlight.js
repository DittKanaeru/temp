const growth = Math.pow(Math.PI / Math.E, 1.618) * Math.E * 0.75;

function xpRange(level, multiplier = 1) {
  if (level < 0) throw new TypeError("level cannot be negative value");
  level = Math.floor(level);

  let min =
    level === 0 ? 0 : Math.round(Math.pow(level, growth) * multiplier) + 1;
  let max = Math.round(Math.pow(level + 1, growth) * multiplier);

  let xp = max - min;
  if (xp > 1000) xp = 1000; // batas maksimal XP per level

  return { min, max, xp };
}

function findLevel(xp, multiplier = 1) {
  if (xp === Infinity) return Infinity;
  if (isNaN(xp)) return NaN;
  if (xp <= 0) return -1;

  let level = 0;
  do level++;
  while (xpRange(level, multiplier).min <= xp);
  return --level;
}

function canLevelUp(level, xp, multiplier = 1) {
  if (level < 0) return false;
  if (xp === Infinity) return true;
  if (isNaN(xp)) return false;
  if (xp <= 0) return false;
  return level < findLevel(xp, multiplier);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addStarExp(user, exp) {
  user.starexp = (user.starexp || 0) + exp;

  while (canLevelUp(user.starlevel || 0, user.starexp)) {
    user.starlevel = (user.starlevel || 0) + 1;
    giveStarReward(user);
  }
}

function giveStarReward(user) {
  const mode = user.starmode || "bronze";
  const level = user.starlevel;

  let rewardChance = 0;

  if (mode === "bronze") rewardChance = randomInt(3, 8);
  else if (mode === "platinum") rewardChance = randomInt(2, 4);
  else if (mode === "diamond") rewardChance = 1;

  if (level % rewardChance === 0) {
    const reward = randomStarReward();
    applyReward(user, reward);
  }
}

function randomStarReward() {
  const rewards = [
    { type: "yuan", min: 800, max: 30000 },
    { type: "potion" },
    { type: "rune" },
    { type: "jade" },
    { type: "diamond" },
    { type: "steel", amount: 15 },
    { type: "emerald" },
    { type: "ruby" },
    { type: "mithril" },
    { type: "wood", min: 8, max: 20 },
  ];

  const pick = rewards[Math.floor(Math.random() * rewards.length)];

  if (pick.type === "yuan") {
    const value = randomInt(pick.min, pick.max);
    return { type: "yuan", value };
  } else if (pick.type === "wood") {
    const value = randomInt(pick.min, pick.max);
    return { type: "wood", value };
  } else if (pick.type === "steel") {
    return { type: "steel", value: pick.amount };
  } else {
    return { type: pick.type, value: 1 };
  }
}

function applyReward(user, reward) {
  user[reward.type] = (user[reward.type] || 0) + reward.value;
}

module.exports = {
  growth,
  xpRange,
  findLevel,
  canLevelUp,
  addStarExp,
  giveStarReward,
  randomStarReward,
  applyReward,
};
