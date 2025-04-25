module.exports = {
  help: ["sticker"],
  tags: ["converter"],
  command: ["sticker", "s", "sk", "stiker", "sgif"],
  run: async (m, { conn, Func }) => {
    try {
      const exif = global.db.setting; // Mengambil pengaturan global untuk sticker metadata
      let img;

      if (m.quoted ? m.quoted.message : m.msg.viewOnce) {
        const type = m.quoted ? Object.keys(m.quoted.message)[0] : m.mtype;
        const q = m.quoted ? m.quoted.message[type] : m.msg;
        img = await conn.downloadMediaMessage(q);

        if (/video/.test(type)) {
          if (q.seconds > 10) {
            return conn.reply(m.chat, Func.texted("bold", "🚩 Maximum video duration is 10 seconds."), m);
          }
          await conn.sendSticker(m.chat, img, m, {
            packname: exif.sk_pack,
            author: exif.sk_author,
          });
        } else if (/image/.test(type)) {
          await conn.sendSticker(m.chat, img, m, {
            packname: "by",
            author: "amici",
          });
        }
      } else {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || "";

        if (/image\/(jpe?g|png)/.test(mime)) {
          img = await q.download();
          if (!img) {
            return conn.reply(m.chat, Func.texted("bold", "🚩 Invalid media file."), m);
          }
          await conn.sendSticker(m.chat, img, m, {
            packname: "by",
            author: "amici",
          });
        } else if (/video/.test(mime)) {
          if ((q.msg || q).seconds > 10) {
            return conn.reply(m.chat, Func.texted("bold", "🚩 Maximum video duration is 10 seconds."), m);
          }
          img = await q.download();
          if (!img) {
            return conn.reply(m.chat, Func.texted("bold", "🚩 Invalid media file."), m);
          }
          await conn.sendSticker(m.chat, img, m, {
            packname: "by",
            author: "ami",
          });
        } else {
          return conn.reply(m.chat, Func.texted("bold", "🚩 Please reply to a valid image or video."), m);
        }
      }
    } catch (e) {
      console.error(e);
      return conn.reply(m.chat, Func.texted("bold", `🚩 Error: ${e.message}`), m);
    }
  },
  register: false,
};