module.exports = {
  help: [
    "listvn",
    "listmsg",
    "listvideo",
    "listgif",
    "listaudio",
    "listimg",
    "liststicker",
  ],
  tags: ["store"],
  command: [
    "listvn",
    "listmsg",
    "listvideo",
    "listgif",
    "listaudio",
    "listimg",
    "liststicker",
  ],
  run: async (m, { usedPrefix, command }) => {
    let which = command.replace(/list/i, "");
    let msgs = global.db.msgs;
    let split = Object.entries(msgs).map(([nama, isi]) => ({ nama, ...isi }));

    let filterResult = [];

    switch (true) {
      case /audio/i.test(command):
        filterResult = split.filter(
          (v) => v.message?.audioMessage && !v.message.audioMessage.ptt,
        );
        break;
      case /vn/i.test(command):
        filterResult = split.filter(
          (v) => v.message?.audioMessage && v.message.audioMessage.ptt,
        );
        break;
      case /video/i.test(command):
        filterResult = split.filter(
          (v) => v.message?.videoMessage && !v.message.videoMessage.gifPlayback,
        );
        break;
      case /gif/i.test(command):
        filterResult = split.filter(
          (v) => v.message?.videoMessage && v.message.videoMessage.gifPlayback,
        );
        break;
      case /stic?ker/i.test(command):
        filterResult = split.filter((v) => v.message?.stickerMessage);
        break;
      case /msg/i.test(command):
        filterResult = split.filter(
          (v) => v.message?.extendedTextMessage?.text,
        );
        break;
      case /img/i.test(command):
        filterResult = split.filter((v) => v.message?.imageMessage);
        break;
      default:
        return m.reply(`❌ Perintah tidak dikenali.`);
    }

    let fltr = filterResult.length
      ? filterResult.map((v) => `├ ${v.nama}`).join("\n")
      : "❌ Tidak ada pesan yang ditemukan.";

    m.reply(
      `
┌〔 📂 *DAFTAR PESAN* 〕
${fltr}
└────
📌 *Gunakan perintah berikut untuk mengakses pesan:*  
> *${usedPrefix}get${which}* <nama>  
atau langsung tanpa perintah.
`.trim(),
    );
  },
  group: true,
  premium: true,
};
