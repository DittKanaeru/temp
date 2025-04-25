const fetch = require('node-fetch');

module.exports = {
  help: ['brat'],
  tags: ['sticker'],
  command: ['brat'],
  run: async (m, { conn, text }) => {
    try {
      if (!text) {
        return conn.reply(m.chat, '🚩 Masukkan teks atau base64 gambar.', m);
      }

      let imageBuffer;

      if (text.startsWith('data:image/')) {
        const base64Data = text.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else {
        const res = await fetch(`https://brat.caliphdev.com/api/brat?text=${encodeURIComponent(text)}`);
        if (!res.ok) throw new Error('Gagal mengambil gambar dari API.');
        imageBuffer = await res.buffer();
      }

      return conn.sendSticker(m.chat, imageBuffer, m, {
        packname: 'By',
        author: 'amici',
      });

    } catch (e) {
      console.error(e);
      return conn.reply(m.chat, `🚩 Terjadi kesalahan: ${e.message}`, m);
    }
  },
  register: false,
};
