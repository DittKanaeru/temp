module.exports = {
  help: [
    "getvn",
    "getmsg",
    "getvideo",
    "getaudio",
    "getimg",
    "getsticker",
    "getgif",
  ],
  tags: ["store"],
  command: [
    "getvn",
    "getmsg",
    "getvideo",
    "getaudio",
    "getimg",
    "getsticker",
    "getgif",
  ],
  run: async (m, { conn, command, usedPrefix, text }) => {
    let which = command.replace(/get/i, "");
    if (!text)
      return m.reply(
        `❌ Gunakan *${usedPrefix}list${which}* untuk melihat daftar pesan yang tersedia.`,
      );
    let msgs = global.db.msgs;
    if (!(text in msgs))
      return m.reply(
        `⚠ Pesan dengan nama '${text}' tidak ditemukan dalam daftar.`,
      );
    try {
      let _m = conn.serializeM(
        JSON.parse(JSON.stringify(msgs[text]), (_, v) => {
          if (
            v !== null &&
            typeof v === "object" &&
            "type" in v &&
            v.type === "Buffer" &&
            "data" in v &&
            Array.isArray(v.data)
          ) {
            return Buffer.from(v.data);
          }
          return v;
        }),
      );
      await _m.copyNForward(m.chat, true);
    } catch (e) {
      console.error(e);
      return m.reply(`❌ Gagal mengirim pesan '${text}'. Silakan coba lagi.`);
    }
  },
  group: true,
  premium: true,
};
