module.exports = {
  command: ["menu"],
  run: async (m, { conn, usedPrefix, command, env, users, setting, args }) => {
    const perintah = args[0] || "all";
    const tagCount = {};
    const tagHelpMapping = {};
    m.react("⏱️");
    Object.keys(global.plugins)
      .filter((plugin) => !global.plugins[plugin].disabled)
      .forEach((plugin) => {
        const tagsArray = Array.isArray(global.plugins[plugin].tags)
          ? global.plugins[plugin].tags
          : [];
        const helpArray = Array.isArray(global.plugins[plugin].help)
          ? global.plugins[plugin].help
          : [global.plugins[plugin].help];

        tagsArray.forEach((tag) => {
          if (!tag) return;
          tagCount[tag] = (tagCount[tag] || 0) + 1;
          tagHelpMapping[tag] = tagHelpMapping[tag]
            ? [...tagHelpMapping[tag], ...helpArray]
            : [...helpArray];
        });
      });
    let fitur = Object.values(plugins)
      .filter((v) => v.help && !v.disabled)
      .map((v) => v.help)
      .flat(1);
    let hasil = fitur.length;
    const spacedText = (text) => text.split("").join(" ");
    let name = users.register
      ? users.name
      : m.pushName || conn.getName(m.sender);
    let botInfo = `Hi @${m.sender.split("@")[0]}, I am ${env.namebot} (WhatsApp Bot) that can help to do something, search and get data / information only through WhatsApp.
 
  *[ Amicy Data ]* 
┌ ◦ Features : ${hasil}
└ ◦ Owner : Dixie

┌ ◦ Running - on : ${process.env.USER === "root" ? "VPS" : process.env.USER === "container" ? "Panel" : "Hosting/local"}
│ ◦ Run-time : ${Func.toTime(process.uptime() * 1000)}
│ ◦ Memory : ${Func.formatSize(require("os").totalmem() - require("os").freemem())} / ${Func.formatSize(require("os").totalmem())}
└ ◦ Total User : ${Func.h2k(Object.keys(db.users).length)}

🌸 *I N F O - U S E R* 🌸 
┌ ◦ Name : ${name}
│ ◦ Limit : ${users.limit}
└ ◦ Status : ${!users.register ? "Not Registered" : env.owner.includes(m.sender.split("@")[0]) ? "Developer Bot" : users.premium ? "Premium User" : "Free User"}

If you find an error or want to upgrade premium plan contact the owner.
`;

    if (perintah === "tags") {
      let daftarTag = Object.keys(tagCount)
        .sort()
        .map((tag) => `> ${usedPrefix + command} ${tag}`)
        .join("\n");
      let message = `${botInfo}\n *[ features ]*\n${daftarTag}`;

      conn.sendMessageModify(m.chat, message, m, {
        largeThumb: true,
        thumbnail: await Func.fetchBuffer(global.db.setting.cover),
        url: "https://Amicy-bot.netlify.app/",
      });
    }

    if (tagCount[perintah]) {
      let daftarHelp = tagHelpMapping[perintah]
        .map((cmd) => `> ${usedPrefix + cmd}`)
        .join("\n");
      let message = `${botInfo}\n🌸 *Menu - ${spacedText(perintah.toUpperCase())}* 🌸 \n${daftarHelp}`;

      conn.sendMessageModify(m.chat, message, m, {
        largeThumb: true,
        thumbnail: await Func.fetchBuffer(global.db.setting.cover),
        url: "https://Amicy-bot.netlify.app/",
      });
    }

    if (perintah === "all") {
      let allMenu = Object.keys(tagCount)
        .map((tag) => {
          let daftarHelp = tagHelpMapping[tag]
            .map((cmd) => `> ${usedPrefix + cmd}`)
            .join("\n");
          return ` *[ Menu - ${spacedText(tag.toUpperCase())} ]*\n${daftarHelp}`;
        })
        .join("\n\n");

      let message = `${botInfo}\n${allMenu}`;

      conn.sendMessageModify(m.chat, message, m, {
        largeThumb: true,
        thumbnail: await Func.fetchBuffer(global.db.setting.cover),
        url: "https://Amicy-bot.netlify.app/",
      });
    }
  },
  register: false,
};
