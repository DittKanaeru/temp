module.exports = {
  help: ["facebook"].map((cmd) => cmd + " <url>"),
  tags: ["download"],
  command: ["facebook", "fb"],
  run: async (m, { conn, usedPrefix, command, users, Api, args, env }) => {
    try {
      if (!args || !args[0])
        return conn.reply(
          m.chat,
          Func.example(usedPrefix, command, "https://fb.watch/7B5KBCgdO3"),
          m,
        );
      if (
        !args[0].match(
          /(?:https?:\/\/(web\.|www\.|m\.)?(facebook|fb)\.(com|watch)\S+)?$/,
        )
      )
        return conn.reply(m.chat, global.status.invalid, m);
      conn.sendReact(m.chat, "🕒", m.key);
      const json = await Api.neoxr("/fb", {
        url: args[0],
      });
      if (!json.status) return conn.reply(m.chat, Func.jsonFormat(json), m);
      let result = json.data.find(
        (v) => v.quality == "HD" && v.response == 200,
      );
      if (result) {
        const size = await Func.getSize(result.url);
        const chSize = Func.sizeLimit(
          size,
          users.premium ? env.max_upload : env.max_upload_free,
        );
        const isOver = users.premium
          ? `💀 File size (${size}) exceeds the maximum limit, download it by yourself via this link : ${await (
              await Scraper.shorten(result.url)
            ).data.url}`
          : `⚠️ File size (${size}), you can only download files with a maximum size of ${env.max_upload_free} MB and for premium users a maximum of ${env.max_upload} MB.`;
        if (chSize.oversize) return conn.reply(m.chat, isOver, m);
        conn.sendFile(
          m.chat,
          result.url,
          Func.filename("mp4"),
          `◦ *Quality* : HD`,
          m,
        );
      } else {
        let result = json.data.find(
          (v) => v.quality == "SD" && v.response == 200,
        );
        if (!result) return conn.reply(m.chat, global.status.fail, m);
        const size = await Func.getSize(result.url);
        const chSize = Func.sizeLimit(
          size,
          users.premium ? env.max_upload : env.max_upload_free,
        );
        const isOver = users.premium
          ? `💀 File size (${size}) exceeds the maximum limit, download it by yourself via this link : ${await (
              await Scraper.shorten(result.url)
            ).data.url}`
          : `⚠️ File size (${size}), you can only download files with a maximum size of ${env.max_upload_free} MB and for premium users a maximum of ${env.max_upload} MB.`;
        if (chSize.oversize) return conn.reply(m.chat, isOver, m);
        conn.sendFile(
          m.chat,
          result.url,
          Func.filename("mp4"),
          `◦ *Quality* : SD`,
          m,
        );
      }
    } catch (e) {
      console.log(e);
      return conn.reply(m.chat, Func.jsonFormat(e), m);
    }
  },
  register: true,
  limit: true,
};
