module.exports = {
    help: ["hidetag"].map(cmd => cmd + " <text>"),
    tags: ["group"],
    command: ["hidetag","h"],
    run: async (m, { conn, usedPrefix, command, text, Func, participants }) => {
     if (!text) return m.reply(Func.example(usedPrefix, command, "Halo"))
      conn.sendMessage(m.chat, { text: text, mentions: participants.map((a) => a.id) }, { quoted: {
          key: {
            participants: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
            fromMe: false,
            id: text,
          }, message: {
            contactMessage: {
             vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Zhenn;Sweet;;;\nFN:y\nitem1.TEL;waid=${m.sender.split("@")[0]}:${m.sender.split("@")[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
          },
        }, participant: "0@s.whatsapp.net",
     }});
    },
    group: true,
    admin: true
};