module.exports = {
  help: ["twitter"].map((cmd) => cmd + " <url>"),
  tags: ["download"],
  command: ["twitter"],
  run: async (m, { conn, usedPrefix, command, users, Api, args, env }) => {
    try {
      if (!args || !args[0])
        return conn.reply(
          m.chat,
          Func.example(
            usedPrefix,
            command,
            "https://twitter.com/mosidik/status/1475812845249957889?s=20",
          ),
          m,
        );
      if (!args[0].match(/(twitter\.com|x\.com)/gi))
        return conn.reply(m.chat, global.status.invalid, m);
      conn.sendReact(m.chat, "🕒", m.key);
      const json = await Api.neoxr("/twitter", {
        url: args[0],
      });
      let old = new Date();
      if (!json.status) return conn.reply(m.chat, Func.jsonFormat(json), m);
      for (let i = 0; i < json.data.length; i++) {
        if (/jpg|mp4/.test(json.data[i].type)) {
          conn.sendFile(
            m.chat,
            json.data[i].url,
            `file.${json.data[i].type}`,
            "",
            m,
          );
          await Func.delay(1500);
        } else if (json.data[i].type == "gif") {
          conn.sendFile(m.chat, json.data[i].url, "file.mp4", m, {
            gif: true,
          });
        }
      }
    } catch (e) {
      console.log(e);
      return conn.reply(m.chat, Func.jsonFormat(e), m);
    }
  },
  register: true,
  limit: true,
};
