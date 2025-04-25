const fetch = require('node-fetch');

module.exports = {
  help: ['perpleity *<text>*'],
  tags: ['ai'],
  command: /^(perplexity)$/i,
  premium: false,
  run: async (m, { text }) => {
    if (!text) return m.reply('❗ Masukkan teks yang ingin ditanyakan.');

    await m.reply('⌛ Memproses pertanyaan...');

    try {
      const endpoint = `https://api.maelyn.tech/api/perplexity?q=${encodeURIComponent(text)}`;
      const headers = {
        'mg-apikey': 'Rk-Ruka', // Menambahkan header API key
      };

      const response = await fetch(endpoint, { method: 'GET', headers: headers });
      const json = await response.json();

      if (!json || json.status !== 'Success') {
        throw new Error('Gagal mendapatkan jawaban dari AI.');
      }

      // Menampilkan hasil dari API sesuai dengan struktur baru
      await m.reply(`✨ *Perplexity answer :*\n\n${json.result.answer}`);
    } catch (error) {
      console.error(error);
      m.reply('❗ Terjadi kesalahan saat memproses pertanyaan.');
    }
  }
};
