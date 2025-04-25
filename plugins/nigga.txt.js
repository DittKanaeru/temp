module.exports = {
  help: ['note'],
  tags: ['tools'],
  command: ['note'],
  run: async (m, { conn }) => {
    const sent = await conn.sendMessage(
      m.chat,
      { text: 'Dixie raja jawa' },
      { quoted: m }
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    await conn.sendMessage(
      m.chat,
      {
        text: 'Emoji Fitur\n\n⨳\n[💳] Bank\n⨳\n[🪪] Inventory\n⨳\n[🪀] Runtime\n⨳\n[💰] Dompet',
        edit: sent.key,
        contextInfo: {
          externalAdReply: {
            title: 'Emoji Command',
            body: 'Tetap pake prefix ya blog',
            thumbnailUrl: 'https://telegra.ph/file/09d2c759a23cb53c0df7d.jpg',
            sourceUrl: '',
            mediaType: 1,
            renderLargerThumbnail: false
          }
        }
      }
    );
  },
  register: false
};
