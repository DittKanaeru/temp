module.exports = {
  help: ["afk"],
  tags: ["group"],
  command: ["afk"],
  run: async (m, { conn, text, env }) => {
    try {
      let user = global.db.users.find((v) => v.jid == m.sender);
      user.afk = +new Date();
      user.afkReason = text;
      user.afkObj = m;
      let tag = m.sender.split`@`[0];
      return m.reply(Func.texted("bold", `🚩 @${tag} is now AFK!`));
    } catch {
      conn.reply(m.chat, global.status.error, m);
    }
  },
  group: true,
};
