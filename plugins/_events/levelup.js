let levelling = require(process.cwd() + "/lib/system/leveling");
module.exports = {
  before: async function (m) {
    let user = global.db.users.find((v) => v.jid === m.sender);
    if (!user) return;
    let before = user.level;
    let multiplier = global.multiplier;
    while (levelling.canLevelUp(user.level, user.exp, multiplier)) {
      user.level = Math.floor(user.level + 1);
    }
    if (before !== user.level) {
      m.reply(
        `✨ Level Up! ✨\n🔥 Dari *${before}* ke *${user.level}*!\n🔹 Cek statusmu dengan *.me*`.trim(),
      );
    }
  },
};
