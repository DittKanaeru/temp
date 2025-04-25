const fetch = require('node-fetch');

module.exports = {
  help: ['ai *<text>*', 'ai --set <model>'],
  tags: ['ai'],
  command: /^(ai|openai|chatgpt)$/i,
  premium: false,
  run: async (m, { conn, text, usedPrefix, command }) => {
    const users = global.db.users;
    const user = users.find(u => u.jid === m.sender);
    if (!user) return m.reply('🚩 Data pengguna tidak ditemukan.');

    const validModels = ['gpt-4', 'gpt-3', 'gpt-4o', 'gpt-4omni', 'o1-mini', 'o3-mini'];

    if (!text) {
      const savedModel = user.preferredModel || 'gpt-4';
      return m.reply(
        `❗ Contoh penggunaan:\n` +
        `- ${usedPrefix}${command} Siapa presiden Indonesia?\n` +
        `- ${usedPrefix}${command} --set gpt-4o\n\n` +
        `*Model Saat Ini:* ${savedModel}\n\n` +
        `*Model Tersedia:*\n${validModels.map(m => `- ${m}`).join('\n')}`
      );
    }

    if (text.startsWith('--set')) {
      const model = text.replace('--set', '').trim();
      if (!validModels.includes(model)) {
        return m.reply(`❗ Model tidak valid!\n\n*Model yang tersedia:*\n${validModels.map(m => `- ${m}`).join('\n')}`);
      }
      user.preferredModel = model;
      return m.reply(`✅ Model berhasil diatur ke *${model}* untuk pertanyaan AI selanjutnya.`);
    }

    const model = user.preferredModel || 'gpt-4';

    await m.reply('⌛ Memproses pertanyaan...');

    try {
      const endpoint = `https://api.maelyn.tech/api/chatgpt?q=${encodeURIComponent(text)}&model=${model}&apikey=Rk-Ruka`;

      const response = await fetch(endpoint);
      const json = await response.json();

      if (!json || json.status !== 'Success' || !json.result?.choices?.[0]?.message?.content) {
        throw new Error('Gagal mendapatkan jawaban dari AI.');
      }

      const replyContent = json.result.choices[0].message.content.trim();

      await m.reply(`✨ *Jawaban AI (${model}):*\n\n${replyContent}`);
    } catch (error) {
      console.error(error);
      m.reply('❗ Terjadi kesalahan saat memproses pertanyaan.');
    }
  }
};
