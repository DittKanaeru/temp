const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { tmpdir } = require('os');

module.exports = {
  help: ['tiktok'],
  tags: ['download'],
  command: ['timok'],
  run: async (m, { conn, text }) => {
    try {
      const regex = /(https?:\/\/(?:www\.)?tiktok\.com\/[^\s]+|https?:\/\/(?:vt|vm)\.tiktok\.com\/[^\s]+)/;
      const match = text.match(regex);
      if (!match) return conn.reply(m.chat, '🚩 Masukkan link TikTok yang valid.', m);

      const url = match[0];
      await conn.sendMessage(m.chat, { react: { text: '🕐', key: m.key } });

      const api = `https://api.maelyn.tech/api/tiktok/download?url=${encodeURIComponent(url)}`;
      const res = await fetch(api, {
        headers: { 'mg-apikey': 'Rk-Ruka' }
      });

      const json = await res.json();
      if (!json.status || !json.result) throw new Error('Gagal mengambil data dari API.');

      const { author, desc, music, download, type } = json.result;

      const caption = `🏷 *TikTok Downloader*\n\n` +
                      `> 🔍 *Title:* ${desc || "Tanpa Judul"}\n` +
                      `> 👤 *Author:* ${author.nickname} (@${author.username})\n`;

      if (type === 'video') {
        const videoUrl = download.nowm;
        const audioUrl = music;

        if (!videoUrl) throw new Error('Video tanpa watermark tidak ditemukan.');

        await conn.sendMessage(m.chat, { react: { text: '☑️', key: m.key } });
        await conn.sendFile(m.chat, videoUrl, 'tiktok.mp4', caption, m);

        if (audioUrl) {
          await conn.sendFile(m.chat, audioUrl, 'music.mp3', '', m);
        }

      } else if (type === 'image') {
        const images = download.images;
        const audioUrl = music;

        if (!images || !audioUrl) throw new Error('Gambar atau audio tidak ditemukan.');

        const imgRes = await fetch(images[0]);
        const imgBuffer = await imgRes.buffer();
        const audioRes = await fetch(audioUrl);
        const audioBuffer = await audioRes.buffer();

        const imgPath = path.join(tmpdir(), `img-${Date.now()}.jpg`);
        const audioPath = path.join(tmpdir(), `aud-${Date.now()}.mp3`);
        const outPath = path.join(tmpdir(), `vid-${Date.now()}.mp4`);

        fs.writeFileSync(imgPath, imgBuffer);
        fs.writeFileSync(audioPath, audioBuffer);

        await new Promise((resolve, reject) => {
          ffmpeg()
            .input(imgPath)
            .loop(5)
            .input(audioPath)
            .outputOptions([
              '-c:v libx264',
              '-c:a aac',
              '-shortest'
            ])
            .save(outPath)
            .on('end', resolve)
            .on('error', reject);
        });

        await conn.sendFile(m.chat, outPath, 'tiktok.mp4', caption, m);

        fs.unlinkSync(imgPath);
        fs.unlinkSync(audioPath);
        fs.unlinkSync(outPath);
      }

    } catch (e) {
      console.error(e);
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
      return conn.reply(m.chat, `🚩 Terjadi kesalahan: ${e.message}`, m);
    }
  },
  register: false,
};
