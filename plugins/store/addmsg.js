let { proto } = require("@adiwajshing/baileys");

module.exports = {
  help: [
    "addvn",
    "addmsg",
    "addvideo",
    "addaudio",
    "addimg",
    "addstiker",
    "addgif",
  ],
  tags: ["store"],
  command: [
    "addvn",
    "addmsg",
    "addvideo",
    "addaudio",
    "addimg",
    "addstiker",
    "addgif",
  ],
  run: async (m, { conn, command, usedPrefix, text }) => {
    let Message = proto.WebMessageInfo;
    let which = command.replace(/add/i, "");
    if (!m.quoted)
      return m.reply(
        `❌ Balas pesan dengan perintah *${usedPrefix + command}* untuk menyimpannya.`,
      );
    if (!text) return m.reply(Func.example(usedPrefix, command, `Halo`));
    let msgs = global.db.msgs;
    if (text in msgs)
      return m.reply(
        `⚠ Pesan dengan nama '${text}' sudah terdaftar! Gunakan nama lain.`,
      );
    try {
      msgs[text] = Message.fromObject(await m.getQuotedObj()).toJSON();
      db.msgs = msgs;
      await conn.reply(
        m.chat,
        `✅ Berhasil menambahkan pesan '${text}'.\n\n🔹 Akses dengan: *${usedPrefix}get${which} ${text}*`,
        m,
      );
    } catch (e) {
      console.error(e);
      return m.reply(`❌ Gagal menyimpan pesan. Silakan coba lagi.`);
    }
  },
  group: true,
  register: true,
  premium: true,
};
