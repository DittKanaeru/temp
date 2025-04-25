const fetch = require('node-fetch');

module.exports = {
  help: ['get'],
  tags: ['internet'],
  command: ['get'],
  run: async (m, { text, conn }) => {
    try {
      if (!/^https?:\/\//.test(text)) {
        return m.reply('🚩 Masukkan URL yang valid. Contoh: https://example.com');
      }

      const res = await fetch(text);
      const contentLength = parseInt(res.headers.get('content-length') || '0');
      const contentType = res.headers.get('content-type');

      if (contentLength > 100 * 1024 * 1024) {
        return m.reply(`🚩 Ukuran konten terlalu besar: ${contentLength} bytes`);
      }

      if (!/text|json/.test(contentType)) {
        return conn.sendFile(m.chat, text, 'file', text, m);
      }

      const txt = await res.text();
      m.reply(txt.slice(0, 65536));
    } catch (error) {
      console.error(error);
      return m.reply(`🚩 Terjadi kesalahan saat mengambil data: ${error.message}`);
    }
  },
  register: false,
};
