module.exports = {
  help: ['play <query>'],
  tags: ['download'],
  command: ['play'],
  run: async (m, { conn, usedPrefix, command, users, Func, Api, text, env }) => {
    try {
      if (!text) {
        return conn.reply(m.chat, Func.example(usedPrefix, command, 'lathi'), m);
      }

      conn.sendReact(m.chat, '🕒', m.key);

      const json = await Api.neoxr('/play', { q: text });
      if (!json.status) {
        return conn.reply(m.chat, Func.jsonFormat(json), m);
      }

      if (!json.data || !json.data.url || !json.data.filename.endsWith('.mp3')) {
        return conn.reply(m.chat, '🚩 Audio file tidak ditemukan.', m);
      }

      const caption = [
        '乂  *Y T - P L A Y*',
        '',
        `◦  *Title* : ${json.title}`,
        `◦  *Size* : ${json.data.size}`,
        `◦  *Duration* : ${json.duration}`,
        `◦  *Bitrate* : ${json.data.quality}`,
        '',
        env.footer
      ].join('\n');

      const chSize = Func.sizeLimit(json.data.size, users.premium ? env.max_upload : env.max_upload_free);
      const sizeWarn = users.premium
        ? `💀 Ukuran file (${json.data.size}) melebihi batas maksimum.`
        : `⚠️ Ukuran file (${json.data.size}) melebihi batas maksimum ${env.max_upload_free} MB (premium: ${env.max_upload} MB).`;

      if (chSize.oversize) return conn.reply(m.chat, sizeWarn, m);

      await conn.sendMessageModify(m.chat, caption, m, {
        largeThumb: true,
        thumbnailUrl: json.thumbnail
      });

      await conn.sendFile(m.chat, json.data.url, json.data.filename, '', m, { ptt: true });

    } catch (e) {
      console.error(e);
      return conn.reply(m.chat, Func.jsonFormat(e), m);
    }
  },
  register: true,
  limit: true,
};
