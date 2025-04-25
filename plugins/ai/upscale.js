const { uploadToMaelyn } = require(process.cwd() + "/lib/system/upload.js");
const fetch = require("node-fetch");

module.exports = {
  help: ["hd *<reply_media>*"],
  tags: ["ai"],
  command: /^(hd|hd5|hdr)$/i,
  premium: false,
  owner: false,
  run: async (m, { conn, usedPrefix, command, text }) => {
    try {
      let q = m.quoted ? m.quoted : m;
      let mime = (q.msg || q).mimetype || "";

      if (!mime.startsWith("image/")) {
        return m.reply("❗ Mana gambarnya kak.");
      }

      // Tampilkan reaksi loading
      await conn.sendMessage(m.chat, { react: { text: "🕐", key: m.key } });

      let media = await q.download();
      if (!media) return m.reply("❗ Gagal mengunduh gambar.");

      // Meng-upload gambar ke Maelyn CDN menggunakan fungsi uploadToMaelyn
      let url = await uploadToMaelyn(media);
      if (!url) {
        throw new Error("Gagal mengupload gambar ke Maelyn CDN.");
      }

      const apiKey = "Rk-Ruka";
      const endpoint = `https://api.maelyn.tech/api/img2img/upscale?url=${encodeURIComponent(
        url
      )}`;

      const response = await fetch(endpoint, {
        headers: {
          "mg-apikey": apiKey
        }
      });

      const json = await response.json();

      if (!json || json.status !== "Success" || !json.result?.url) {
        throw new Error(
          "Gagal mendapatkan hasil dari Maelyn API. Silakan coba lagi."
        );
      }

      const { url: hasil, size, expired } = json.result;

      // Tampilkan reaksi sukses
      await conn.sendMessage(m.chat, { react: { text: "☑️", key: m.key } });

      await conn.sendFile(
        m.chat,
        hasil,
        "enhanced_image.png",
        `✅ Berhasil di-upscale!\n\n*📦 Size:* ${size}\n⏳ *Expired:* ${expired}\n\nJangan lupa follow channel Ruka yaa 💖`,
        m
      );
    } catch (e) {
      console.error(e);
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      m.reply(
        "❗ Terjadi kesalahan saat memproses permintaan. Coba lagi nanti ya!"
      );
    }
  }
};