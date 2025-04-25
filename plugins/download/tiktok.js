const fetch = require("node-fetch");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run(m, { conn, text }) {
  try {
    // Validasi input teks
    if (!text) {
      return conn.reply(m.chat, "🚫 Kirim link TikTok yang valid.", m);
    }

    // Cari URL TikTok yang sesuai pada input
    const matchedUrl = text.match(
      /https?:\/\/(vt|vm|www)?\.?tiktok\.com\/[^\s]+/,
    );
    if (!matchedUrl) {
      return conn.reply(m.chat, "🚫 Link TikTok tidak valid.", m);
    }
    const url = matchedUrl[0];

    // Beri reaksi saat proses dimulai
    await m.react("🕐");

    // Siapkan dan panggil API Maelyn
    const apiKey = "Rk-Ruka";
    const apiUrl = `https://api.maelyn.tech/api/tiktok/download?url=${encodeURIComponent(url)}&apikey=${apiKey}`;
    const res = await fetch(apiUrl);
    const json = await res.json();

    if (!json || json.status !== "Success" || !json.result) {
      throw new Error("Gagal ambil data dari Maelyn API.");
    }

    // Ekstrak informasi dari respons API
    const { title, duration, author, stats, medias } = json.result;
    let profile = "🏷 *TikTok Downloader*\n\n";
    profile += `> 🔍 *Judul:* ${title || "Tanpa Judul"}\n`;
    profile += `> 👤 *Pembuat:* @${author?.unique_id || "unknown"}\n`;
    profile += `> ⏱ *Durasi:* ${duration ? duration + 's' : "?"}\n`;
    profile += `> ❤️ *Likes:* ${stats?.like ? stats.like.toLocaleString() : "?"}\n`;
    profile += `> 💬 *Komentar:* ${stats?.comment ? stats.comment.toLocaleString() : "?"}\n`;
    profile += `> 🔄 *Shares:* ${stats?.share ? stats.share.toLocaleString() : "?"}\n`;
    profile += `> 👁 *Views:* ${stats?.play ? stats.play.toLocaleString() : "?"}\n`;

    // Cari media video dan audio
    const videoMedia = medias.find(media => media.videoAvailable && media.quality === "hd");
    const audioMedia = medias.find(media => media.audioAvailable && !media.videoAvailable);

    // Jika video tersedia, kirim video dengan info profil
    if (videoMedia) {
      await conn.sendFile(m.chat, videoMedia.url, "tiktok.mp4", profile, m);
    } else {
      // Fallback ke video quality lain jika HD tidak tersedia
      const fallbackVideo = medias.find(media => media.videoAvailable);
      if (fallbackVideo) {
        await conn.sendFile(m.chat, fallbackVideo.url, "tiktok.mp4", profile, m);
      }
    }

    // Jika audio tersedia, tunggu sejenak lalu kirim file audio
    if (audioMedia) {
      await delay(1000);
      await conn.sendFile(m.chat, audioMedia.url, "audio.mp3", "", m);
    }

    // Reaksi sukses
    await m.react("✅");
  } catch (error) {
    console.error(error);
    await m.react("❌");
    conn.reply(m.chat, "⚠️ Gagal memproses video. Coba lagi nanti.", m);
  }
}

module.exports = {
  help: ["tiktok"],
  tags: ["download"],
  command: ["tt", "ttdl", "tikmp3", "titot"],
  desc: "Download video TikTok tanpa watermark dan MP3",
  register: false,
  run,
};