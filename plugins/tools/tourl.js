const axios = require("axios");
const crypto = require("crypto");
const FormData = require("form-data");
const FileType = require("file-type");

async function uploadToMaelyn(buffer, originalMime) {
  try {
    const mediaBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

    const fileType = (await FileType.fromBuffer(mediaBuffer)) || {
      mime: originalMime,
    };
    const mime = fileType.mime;

    if (!mime) {
      throw new Error("Unsupported file type");
    }

    const formData = new FormData();
    const randomBytes = crypto.randomBytes(5).toString("hex");
    const extension = fileType.ext || mime.split("/")[1];
    formData.append("file", mediaBuffer, `${randomBytes}.${extension}`);

    const headers = {
      ...formData.getHeaders(),
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36",
    };

    const response = await axios.post(
      "https://cdn.maelyn.tech/api/upload",
      formData,
      {
        headers: headers,
      },
    );

    if (response.status === 200 && response.data.status === "200") {
      return response.data.data.url;
    } else {
      throw new Error(
        `Upload failed: ${response.data.message || "Unknown error"}`,
      );
    }
  } catch (error) {
    console.error("Error uploading file:", error.message);
    throw error;
  }
}

module.exports = {
  help: ["url"],
  tags: ["tools"],
  command: ["url"],
  pattern: /^url ?(.*)$/,
  desc: "Upload files to Maelyn CDN.",
  run: async (m, { conn, text }) => {
    try {
      let q = m.quoted ? m.quoted : m;
      let mime = (q.msg || q).mimetype || "";

      if (!mime) {
        return m.reply(
          "❌ Tidak ada media yang ditemukan. Reply media dengan perintah ini.",
        );
      }

      let isSupported =
        /^(image|video|audio)\//i.test(mime) ||
        /^application\/(pdf|zip|x-rar-compressed|msword|vnd\.openxmlformats-officedocument\..*|vnd\.ms-.*)/i.test(
          mime,
        ) ||
        /^text\/(plain|txt|csv|html|xml)/i.test(mime);

      if (!isSupported) {
        return m.reply(
          "❌ Format file tidak didukung. Format yang didukung:\n- Gambar\n- Video\n- Audio\n- PDF\n- ZIP/RAR\n- Dokumen (Word, Excel, etc)\n- Text (TXT, CSV, HTML, XML)",
        );
      }

      m.reply("⌛ Sedang mengupload file ke Maelyn CDN...");

      let media;
      try {
        if (q.download) {
          media = await q.download();
        } else {
          media = await conn.downloadMediaMessage(q);
        }
      } catch (err) {
        console.error("Download error:", err);
        return m.reply("❌ Gagal mengunduh media.");
      }

      if (!media) {
        return m.reply("❌ Gagal mengunduh media.");
      }

      const mediaBuffer = Buffer.isBuffer(media) ? media : Buffer.from(media);

      const fileUrl = await uploadToMaelyn(mediaBuffer, mime);

      await m.reply(`✅ File berhasil diunggah ke Maelyn CDN:\n${fileUrl}`);
    } catch (error) {
      console.error("Error:", error);
      await m.reply(`❌ Terjadi kesalahan: ${error.message}`);
    }
  },
};
