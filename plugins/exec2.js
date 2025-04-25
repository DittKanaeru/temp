const { exec } = require("child_process");
const syntax = require("syntax-error");

module.exports = {
  command: ["$", "=>", ">"],
  run: async (
    m,
    {
      env,
      plugins,
      usedPrefix,
      noPrefix,
      _args,
      args,
      conn,
      Func,
      Api,
      participants,
      Scraper,
      groupMetadata,
      user,
      bot,
      isROwner,
      isRAdmin,
      isAdmin,
      isBotAdmin,
      isPrems,
      groupSet,
      users,
      setting,
      chatUpdate,
    },
  ) => {
    if (typeof m.text === "object" || !isROwner) return;
    let command, text;
    let x = m.text && m.text.trim().split`\n`,
      y = "";
    command = x[0] ? x[0].split` `[0] : "";
    (y += x[0] ? x[0].split` `.slice`1`.join` ` : ""),
      (y += x ? x.slice`1`.join`\n` : "");
    text = y.trim();
    if (!text) return;
    if (command === "=>") {
      try {
        var evL = await eval(`(async () => { return ${text} })()`);
        conn.reply(m.chat, Func.jsonFormat(evL), m);
      } catch (e) {
        let err = await syntax(text);
        m.reply(
          typeof err != "undefined"
            ? Func.texted("monospace", err) + "\n\n"
            : "" + require("util").format(e),
        );
      }
    } else if (command === ">") {
      try {
        var evL = await eval(`(async () => { ${text} })()`);
        m.reply(Func.jsonFormat(evL));
      } catch (e) {
        let err = await syntax(text);
        m.reply(
          typeof err != "undefined"
            ? Func.texted("monospace", err) + "\n\n"
            : "" + Func.jsonFormat(e),
        );
      }
    } else if (command == "$") {
      conn.sendReact(m.chat, "🕒", m.key);
      exec(text.trim(), (err, stdout) => {
        if (err) return m.reply(err.toString());
        if (stdout) return m.reply(stdout.toString());
      });
    }
  },
  owner: true,
};
