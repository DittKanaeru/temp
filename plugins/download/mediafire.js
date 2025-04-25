module.exports = {
  help: ["mediafire"].map((cmd) => cmd + " <url>"),
  tags: ["download"],
  command: ["mediafire", "mf"],
  run: async (
    m, 
    { conn, usedPrefix, command, users, Func, Api, args, env }
  ) => {
    try {
      if (!args || !args[0])
        return conn.reply(
          m.chat,
          Func.example(
            usedPrefix,
            command,
            "https://www.mediafire.com/file/1fqjqg7e8e2v3ao/YOWA.v8.87_By.SamMods.apk/file"
          ),
          m
        );
      
      if (!args[0].match(/(https:\/\/www.mediafire.com\/)/gi))
        return conn.reply(m.chat, global.status.invalid, m);
      
      conn.sendReact(m.chat, "🕒", m.key);
      
      const json = ("https://api.maelyn.tech/api/mediafire", {
        url: args[0],
        headers: { "mg-apikey": "Rk-Ruka" }
      });
      
      if (!json.status) return conn.reply(m.chat, Func.jsonFormat(json), m);
      
      let text = `📁  *M E D I A F I R E*  📁\n\n`;
      text += "	◦  *Name* : " + json.result.title + "\n";
      text += "	◦  *Size* : " + json.result.size + "\n";
      text += "	◦  *Download* : " + json.result.url + "\n\n";
      text += `💾 *Server*: ${json.maelyn_meta.server}\n`;
      text += `⏱️ *Response Time*: ${json.maelyn_meta.response_time}\n\n`;
      text += env.footer;
      
      // Size check logic (convert KB to MB if needed)
      const sizeValue = parseFloat(json.result.size);
      const sizeUnit = json.result.size.replace(/[0-9.]/g, '').trim();
      const sizeInMB = sizeUnit === 'KB' ? sizeValue / 1024 : sizeValue;
      
      const maxSize = users.premium ? env.max_upload : env.max_upload_free;
      if (sizeInMB > maxSize) {
        const isOver = users.premium
          ? `💀 File size (${json.result.size}) exceeds the maximum limit.`
          : `⚠️ File size (${json.result.size}), you can only download files up to ${env.max_upload_free} MB (${env.max_upload} MB for premium).`;
        return conn.reply(m.chat, isOver, m);
      }
      
      conn.sendFile(
        m.chat, 
        json.result.url, 
        json.result.title, 
        text, 
        m, 
        { Document: true }
      );
    } catch (e) {
      console.log(e);
      conn.reply(m.chat, Func.jsonFormat(e), m);
    }
  },
  register: true,
  limit: true,
};