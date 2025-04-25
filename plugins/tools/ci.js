module.exports = {
    help: ["ci"],
    tags: ["tools"],
    command: ["ci"],
  
    run: async (m, { conn }) => {
      if (!m.quoted) throw "Reply pesan saluran terlebih dahulu.";
      try {
        let quoted = await m.getQuotedObj();
        let info = quoted.msg?.contextInfo?.forwardedNewsletterMessageInfo;
  
        if (!info) throw "Pesan ini bukan dari channel/saluran.";
  
        let teks = `*[ CHANNEL INFO ]*\n\n`;
        teks += `*Channel Name:* \`${info.newsletterName}\`\n`;
        teks += `*Channel ID:* \`${info.newsletterJid}\``;
  
        await conn.reply(m.chat, teks, m);
      } catch (e) {
        throw "Harus reply ke pesan dari channel (saluran).";
      }
    },
  };
  