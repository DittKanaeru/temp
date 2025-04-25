const fetch = require('node-fetch');

module.exports = {
  help: ['bratv', 'bratvid'],
  tags: ['sticker'],
  command: ['bratv', 'bratvid'],
  run: async (m, { conn, text }) => {
    try {
      if (!text) {
        return conn.reply(m.chat, '🚩 Masukkan teks untuk membuat stiker video.', m);
      }

      const url = `https://api.maelyn.tech/api/brat/generator?q=${encodeURIComponent(text)}&isvideo=true&speed=medium`;

      const res = await fetch(url, {
        headers: {
          'mg-apikey': 'Rk-Ruka',
        },
      });

      if (!res.ok) throw new Error(`Gagal menghubungi API (Status ${res.status})`);
      const json = await res.json();
      if (json.status !== 'Success' || !json.result || !json.result.url) {
        throw new Error('API tidak mengembalikan hasil yang valid.');
      }

      const stickerUrl = json.result.url;

      await conn.sendSticker(m.chat, stickerUrl, m, {
        packname: 'By',
        author: 'Ruka',
      });
    } catch (e) {
      console.error(e);
      return conn.reply(m.chat, `🚩 Terjadi kesalahan: ${e.message}`, m);
    }
  },
  register: false,
};