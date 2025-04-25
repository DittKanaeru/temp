const didyoumean = require("didyoumean");
const similarity = require("similarity");

module.exports = {
  before: async (m, { command, usedPrefix }) => {
    if (!usedPrefix) return; // Hanya lanjut jika ada prefix yang valid

    let availableCommands = Object.values(global.plugins)
      .filter((v) => v.run && !v.disabled)
      .map((v) => v.command)
      .flat()
      .filter((v) => typeof v === "string");

    if (!availableCommands.includes(command)) {
      let suggestion = didyoumean(command, availableCommands);
      if (!suggestion) return;

      let similarityScore = similarity(command, suggestion);
      let percentage = Math.round(similarityScore * 100);

      if (similarityScore >= 0.7) {
        m.reply(
          `⚠️ Perintah tidak ditemukan.\nMungkin maksud Anda: *${usedPrefix + suggestion}* (Kemiripan: ${percentage}%)`,
        );
        return true;
      }
    }
  },
};
