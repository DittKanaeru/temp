const { generateWAMessageFromContent, prepareWAMessageMedia } = require('@adiwajshing/baileys');

module.exports = {
  help: ['examplemenu'],
  tags: ['main'],
  command: ['jembut'],
  run: async (m, { conn }) => {
    await conn.sendMessage(m.chat, { react: { text: '📦', key: m.key } });

    const msgText = `Ini adalah contoh *interactive message*.\n\nKlik salah satu menu di bawah ini untuk menjalankan perintah.`;

    const pp = await conn.profilePictureUrl(m.sender, 'image').catch(() =>
      'https://telegra.ph/file/8904062b17875a2ab2984.jpg'
    );

    const msg = generateWAMessageFromContent(
      m.chat,
      {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2,
            },
            interactiveMessage: {
              body: { text: msgText },
              footer: { text: 'Contoh Footer' },
              header: {
                title: '',
                subtitle: 'Contoh Menu',
                hasMediaAttachment: true,
                ...(await prepareWAMessageMedia(
                  {
                    document: {
                      url: 'https://example.com/sample.pdf',
                    },
                    mimetype: 'application/pdf',
                    fileName: 'Contoh File.pdf',
                    pageCount: 1,
                    jpegThumbnail: await conn.resize(pp, 300, 300),
                    fileLength: 999000,
                  },
                  { upload: conn.waUploadToServer }
                )),
              },
              contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                mentionedJid: [m.sender],
                forwardedNewsletterMessageInfo: {
                  newsletterJid: '9999999@newsletter',
                  newsletterName: 'Bot Contoh',
                },
                externalAdReply: {
                  showAdAttribution: true,
                  title: 'Bot Multi-Fungsi',
                  body: 'Powered by ChatGPT',
                  mediaType: 1,
                  sourceUrl: 'https://example.com',
                  thumbnailUrl: global.thumb,
                  renderLargerThumbnail: true,
                },
              },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                      title: 'Pilih Menu',
                      sections: [
                        {
                          title: 'Contoh Menu',
                          rows: [
                            {
                              title: 'Menu Satu',
                              description: 'Menjalankan perintah satu',
                              id: '.menu1',
                            },
                            {
                              title: 'Menu Dua',
                              description: 'Menjalankan perintah dua',
                              id: '.menu2',
                            },
                          ],
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          },
        },
      },
      { quoted: m }
    );

    await conn.relayMessage(msg.key.remoteJid, msg.message, {
      messageId: msg.key.id,
    });
  },
  register: false,
};
