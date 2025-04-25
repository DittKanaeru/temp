module.exports = {
  help: [
    "delvn",
    "delmsg",
    "delvideo",
    "delaudio",
    "delimg",
    "delsticker",
    "delgif",
  ],
  tags: ["store"],
  command: [
    "delvn",
    "delmsg",
    "delvideo",
    "delaudio",
    "delimg",
    "delsticker",
    "delgif",
  ],
  run: async (m, { command, usedPrefix, text }) => {
    let which = command.replace(/del/i, "");
    if (!text)
      return m.reply(
        `❌ Gunakan *${usedPrefix}list${which}* untuk melihat daftar pesan yang tersedia.`,
      );
    let msgs = global.db.msgs; // Pastikan msgs terdefinisi
    if (!(text in msgs))
      return m.reply(
        `⚠ Pesan dengan nama '${text}' tidak ditemukan dalam daftar.`,
      );
    delete msgs[text];
    global.db.msgs = msgs;
    m.reply(`✅ Berhasil menghapus pesan dengan nama '${text}' dari daftar.`);
  },
};
