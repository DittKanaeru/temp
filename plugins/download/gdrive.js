module.exports = {
  help: ["gdrive"].map((cmd) => cmd + " <url>"),
  tags: ["download"],
  command: ["gdrive"],
  run: async (
    m,
    { conn, args, usedPrefix, command, users, env, Func, Scraper },
  ) => {
    try {
      if (!args || !args[0])
        return conn.reply(
          m.chat,
          Func.example(
            usedPrefix,
            command,
            "https://drive.google.com/file/d/1YTD7Ymux9puFNqu__5WPlYdFZHcGI3Wz/view?usp=drivesdk",
          ),
          m,
        );
      conn.sendReact(m.chat, "🕒", m.key);
      const json = await Api.neoxr("/gdrive", {
        url: args[0],
      });
      if (!json.status) return conn.reply(m.chat, Func.jsonFormat(json), m);
      const size = await Func.getSize(json.data.url);
      const chSize = Func.sizeLimit(
        size,
        users.premium ? env.max_upload : env.max_upload_free,
      );
      const isOver = users.premium
        ? `💀 File size (${size}) exceeds the maximum limit, download it by yourself via this link : ${await (
            await Scraper.shorten(json.data.url)
          ).data.url}`
        : `⚠️ File size (${size}), you can only download files with a maximum size of ${env.max_upload_free} MB and for premium users a maximum of ${env.max_upload} MB.`;
      if (chSize.oversize) return conn.reply(m.chat, isOver, m);
      conn.sendFile(m.chat, json.data.url, "", "", m);
    } catch (e) {
      return conn.reply(m.chat, Func.jsonFormat(e), m);
    }
  },
  register: true,
  limit: true,
};
