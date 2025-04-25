const chalk = require("chalk");
const fs = require("fs");
const moment = require("moment-timezone");
const path = require("path");

const colors = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#FF33A8",
  "#FFD700",
  "#00FFFF",
];
const randomColor = () =>
  chalk.hex(colors[Math.floor(Math.random() * colors.length)]);

module.exports = async function (m, conn) {
  if (m.isBaileys || !m.command) return;

  const senderData = global.db.users.find((v) => v.jid === m.sender);
  const senderName = senderData?.register
    ? senderData.name
    : (await conn.getName(m.sender)) || "Anonymous";
  const senderNumber = m.sender || "Unknown";

  const chatType = m.isGroup ? "Group" : "Private";
  const chatName = m.isGroup ? await conn.getName(m.chat) : senderName;

  const time = moment().tz(process.env.Server).format("HH:mm");
  const pluginPath = path.relative(process.cwd(), m.plugin);

  console.log(randomColor()("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(randomColor()(`⏰ Jam     : ${time}`));
  console.log(randomColor()(`⚡ Command : ${m.command}`));
  console.log(randomColor()(`📁 Plugins : ${pluginPath}`));
  console.log(randomColor()(`👤 Nama    : ${senderName}`));
  console.log(randomColor()(`📞 Number  : ${senderNumber}`));
  console.log(randomColor()(`🏠 Chat    : ${chatType} (${chatName})`));
  console.log(randomColor()("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));
};

const file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`♻️ Updated '${__filename}'`));
  delete require.cache[file];
});
