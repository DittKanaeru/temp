const fetch = require('node-fetch');

module.exports = {
  help: ['zerogpt *<text>*'],
  tags: ['ai'],
  command: /^(zerogpt|cekai)$/i,
  limit: true,
  premium: true,
  run: async (m, { conn, text }) => {
    if (!text) return m.reply('❗ Masukkan teks yang ingin dicek.');

    await m.reply('⌛ Memproses teks...');

    try {
      conn.sendPresenceUpdate('composing', m.chat);

      const endpoint = `https://api.maelyn.tech/api/zerogpt?q=${encodeURIComponent(text)}`;
      const response = await fetch(endpoint, {
        headers: {
          'mg-apikey': 'Rk-Ruka'
        }
      });

      const json = await response.json();

      if (!json || json.status !== 'Success') {
        throw new Error('Gagal mendapatkan hasil dari Maelyn API.');
      }

      const result = json.result;

      const hasil = `*Hasil ZeroGPT:*\n\n` +
        `- Is Human: *${result.isHuman}%*\n` +
        `- Text Words: *${result.textWords}*\n` +
        `- AI Words: *${result.aiWords}*\n` +
        `- Fake Percentage: *${result.fakePercentage}%*\n` +
        `- Feedback: ${result.feedback}\n\n` +
        `*Original Paragraph:*\n${result.originalParagraph}`;

      await m.reply(hasil);
    } catch (error) {
      console.error(error);
      m.reply('❗ Terjadi kesalahan saat memproses permintaan. Coba lagi nanti.');
    }
  }
};