module.exports = {
  help: ["ytmp3", "ytmp4"].map((cmd) => cmd + " <url>"),
  tags: ["download"],
  command: ["ytmp3", "ytmp4"],
  run: async (m, { conn, usedPrefix, command, users, args, env }) => {
    try {
      if (!args || !args[0])
        return conn.reply(
          m.chat,
          Func.example(usedPrefix, command, "https://youtu.be/zaRFmdtLhQ8"),
          m,
        );
      if (
        !/^(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w\-_]+)\&?/.test(
          args[0],
        )
      )
        return conn.reply(m.chat, global.status.invalid, m);

      conn.sendReact(m.chat, "🕒", m.key);

      const url = args[0];
      let endpoint = "";
      if (/yt?(a|mp3)/i.test(command)) {
        endpoint = "audio";
      } else if (/yt?(v|mp4)/i.test(command)) {
        endpoint = "video";
      } else {
        return conn.reply(m.chat, "❌ Command tidak dikenali.", m);
      }

      const { data } = await require("axios").get(`https://api.maelyn.tech/api/youtube/${endpoint}?url=${encodeURIComponent(url)}`, {
        headers: {
          "mg-apikey": "Rk-Ruka"
        }
      });

      if (!data.status) return conn.reply(m.chat, Func.jsonFormat(data), m);

      const result = data.result;

      let caption = `🎵  *Y O U T U B E*\n\n`;
      caption += `	◦  *Title* : ${result.title}\n`;
      caption += `	◦  *Channel* : ${result.channel}\n`;
      caption += `	◦  *Size* : ${result.size}\n`;
      caption += `	◦  *Duration* : ${result.duration}\n`;
      if (endpoint === "video") caption += `	◦  *Quality* : ${result.quality}\n`;
      caption += `\n${env.footer}`;

      const chSize = Func.sizeLimit(
        result.size,
        users.premium ? env.max_upload : env.max_upload_free,
      );
      const isOver = users.premium
        ? `💀 File size (${result.size}) exceeds the maximum limit.`
        : `⚠️ File size (${result.size}), you can only download files with a maximum size of ${env.max_upload_free} MB and for premium users a maximum of ${env.max_upload} MB.`;

      if (chSize.oversize) return conn.reply(m.chat, isOver, m);

      await conn.sendMessageModify(m.chat, caption, m, {
        largeThumb: true,
        thumbnailUrl: result.thumbnail,
      });

      if (endpoint === "audio") {
        await conn.sendFile(m.chat, result.url, `${result.title}.mp3`, "", m, null, {
          mimetype: "audio/mpeg",
          fileName: `${result.title}.mp3`,
          asDocument: false,
        });
      } else if (endpoint === "video") {
        await conn.sendFile(m.chat, result.url, `${result.title}.mp4`, caption, m);
      }
    } catch (e) {
      console.log(e);
      return conn.reply(m.chat, Func.jsonFormat(e), m);
    }
  },
  register: true,
  limit: true,
};
