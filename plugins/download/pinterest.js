const axios = require('axios');

module.exports = {
  help: ["pinterest <query>"],
  tags: ["download"],
  command: ["pin", "pinterest"],
  register: true,
  limit: true,
  run: async (m, { conn, usedPrefix, command, text }) => {
    try {
      if (!text)
        return conn.reply(
          m.chat,
          `🚫 Contoh: ${usedPrefix}${command} jokowi`,
          m
        );

      conn.sendReact(m.chat, "🕒", m.key);
      const url = `https://www.velyn.biz.id/api/search/pinterest?query=${encodeURIComponent(text)}`;
      const response = await axios.get(url);
      const json = response.data;

      if (!json.status || !json.data || json.data.length === 0)
        return conn.reply(m.chat, "❌ Tidak ada hasil ditemukan.", m);

      const result = json.data[0]; // Ambil hanya hasil pertama
      const caption = `🏷️ Nih kak sudah yaw`;

      await conn.sendMessage(m.chat, {
        image: { url: result.image },
        caption,
      }, { quoted: m });

      conn.sendReact(m.chat, "✅", m.key);
    } catch (err) {
      console.error('Error:', err);
      conn.reply(m.chat, "❌ Terjadi kesalahan saat mengambil data.", m);
      conn.sendReact(m.chat, "❌", m.key);
    }
  }
};
