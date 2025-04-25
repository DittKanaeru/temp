const simple = require("./lib/system/simple");
const util = require("util");
const moment = require("moment-timezone");
const fs = require("fs");
const chalk = require("chalk");
const cron = require("node-cron");
const isNumber = (x) => typeof x === "number" && !isNaN(x);
const fetch = require("node-fetch");
const env = require("./config.json");
require("./lib/system/config.js");

module.exports = {
  async handler(chatUpdate) {
    this.msgqueque = this.msgqueque || [];
    if (!chatUpdate) return;
    this.pushMessage(chatUpdate.messages).catch(console.error);
    let m = chatUpdate.messages[chatUpdate.messages.length - 1];
    if (m.message?.viewOnceMessageV2)
      m.message = m.message.viewOnceMessageV2.message;
    if (m.message?.documentWithCaptionMessage)
      m.message = m.message.documentWithCaptionMessage.message;
    if (m.message?.viewOnceMessageV2Extension)
      m.message = m.message.viewOnceMessageV2Extension.message;
    if (!m) return;
    try {
      m = simple.smsg(this, m) || m;
      if (!m) return;
      m.exp = 0;
      m.limit = false;

      require("./lib/system/database/schema")(m);
      const groupSet = global.db.groups.find((v) => v.jid === m.chat);
      const chats = global.db.chats.find((v) => v.jid === m.chat);
      const users = global.db.users.find((v) => v.jid === m.sender);
      const setting = global.db.setting;

      conn.storyJid = conn.storyJid ? conn.storyJid : [];
      if (
        m.chat.endsWith("broadcast") &&
        !conn.storyJid.includes(m.sender) &&
        m.sender != conn.decodeJid(conn.user.id)
      )
        conn.storyJid.push(m.sender);
      if (
        m.chat.endsWith("broadcast") &&
        [...new Set(conn.storyJid)].includes(m.sender) &&
        !/protocol/.test(m.mtype)
      ) {
        await conn.sendMessage(
          "status@broadcast",
          {
            react: {
              text: Func.random([
                "🤣",
                "🥹",
                "😂",
                "😋",
                "😎",
                "🤓",
                "🤪",
                "🥳",
                "😠",
                "😱",
                "🤔",
              ]),
              key: m.key,
            },
          },
          {
            statusJidList: [m.sender],
          },
        );
      }

      const isROwner = [env.owner, ...setting.owners]
        .map((v) => v + "@s.whatsapp.net")
        .includes(m.sender);
      const isPrems = (users && users.premium) || isROwner;

      if (opts["queque"] && m.text && !isPrems) {
        let queque = this.msgqueque,
          time = 1000 * 5;
        const previousID = queque[queque.length - 1];
        queque.push(m.id || m.key.id);
        setInterval(async function () {
          if (queque.indexOf(previousID) === -1) clearInterval(this);
          else await delay(time);
        }, time);
      }

      if (typeof m.text !== "string") m.text = "";

      m.exp += Math.ceil(Math.random() * 10);

      const groupMetadata =
        (m.isGroup ? (conn.chats[m.chat] || {}).metadata : {}) || {};
      const participants = (m.isGroup ? groupMetadata.participants : []) || [];
      const user =
        (m.isGroup
          ? participants.find((u) => conn.decodeJid(u.id) === m.sender)
          : {}) || {};
      const bot =
        (m.isGroup
          ? participants.find((u) => conn.decodeJid(u.id) == this.user.jid)
          : {}) || {};
      const isRAdmin = (user && user.admin == "superadmin") || false;
      const isAdmin = isRAdmin || (user && user.admin == "admin") || false;
      const isBotAdmin = (bot && bot.admin) || false;

      if (!setting.online) conn.sendPresenceUpdate("unavailable", m.chat);
      if (setting.online) {
        conn.sendPresenceUpdate("available", m.chat);
        conn.readMessages([m.key]);
      }

      if (m.isGroup && !isBotAdmin) {
        groupSet.localonly = false;
      }

      if (!users || typeof users.limit === undefined)
        return global.db.users.push({
          jid: m.sender,
          banned: false,
          limit: env.limit,
          hit: 0,
          spam: 0,
        });

      if (users && new Date() * 1 >= users.expired && users.expired !== 0) {
        if (!isROwner) {
          return conn
            .reply(
              users.jid,
              Func.texted(
                "italic",
                "🚩 Your premium package has expired, thank you for buying and using our service.",
              ),
            )
            .then(async () => {
              users.premium = false;
              users.expired = 0;
              users.limit = env.limit;
            });
        }
      }

      if (m.isGroup) groupSet.activity = new Date() * 1;
      if (users) {
        users.lastseen = new Date() * 1;
      }

      if (chats) {
        chats.chat += 1;
        chats.lastseen = new Date() * 1;
      }

      if (m.isGroup && !m.isBaileys && users && users.afk > -1) {
        conn.reply(
          m.chat,
          `You are back online after being offline for : ${Func.texted("bold", Func.toTime(new Date() - users.afk))}\n\n• ${Func.texted("bold", "Reason")}: ${users.afkReason ? users.afkReason : "-"}`,
          m,
        );
        users.afk = -1;
        users.afkReason = "";
      }

      if (m.isGroup && !m.fromMe) {
        let now = new Date() * 1;
        if (!groupSet.member[m.sender]) {
          groupSet.member[m.sender] = {
            lastseen: now,
            warning: 0,
          };
        } else {
          groupSet.member[m.sender].lastseen = now;
        }
      }
      if (m.isBaileys) return;

      if (isROwner) {
        users.premium = true;
        users.expired = "PERMANENT";
        users.limit = "UNLIMITED";
      } else if (isPrems) {
        users.limit = "UNLIMITED";
      }
      const str2Regex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
      const specialCommands = ["$", "=>", ">"];
      const body =
        typeof m.text == "string"
          ? m.text
          : m.mtype === "interactiveResponseMessage"
            ? JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson).id
            : m.mtype == "editedMessage"
              ? m.msg.message.protocolMessage.editedMessage.conversation
              : false;

      const isSpecialCommand = specialCommands.some((symbol) =>
        body.startsWith(symbol),
      );
      const usedPrefix = isSpecialCommand
        ? ""
        : setting.prefix.find((p) => body.startsWith(p)) || "";
      const noPrefix = body.slice(usedPrefix.length).trim();
      const [command, ...args] = noPrefix.split(/\s+/);
      const text = args.join(" ");
      const prefixes = global.db.setting.multiprefix
        ? global.db.setting.prefix
        : [global.db.setting.onlyprefix];

      let extra = {
        body,
        prefixes,
        usedPrefix,
        noPrefix,
        args,
        command: (command || "").toLowerCase(),
        text,
        conn: this,
        Func,
        Api,
        env,
        participants,
        Scraper,
        groupMetadata,
        user,
        bot,
        isROwner,
        isPrems,
        groupSet,
        users,
        setting,
        chatUpdate,
      };

      for (let name in global.plugins) {
        let plugin = global.plugins[name];
        let isValidPlugin = plugin.run || plugin.before || plugin.all;
        if (!isValidPlugin) continue;
        if (plugin.disabled) continue;

        try {
          if (typeof plugin.before === "function") {
            let shouldContinue = await plugin.before.call(this, m, extra);
            if (shouldContinue) continue;
          }
          if (typeof plugin.all === "function") {
            await plugin.all.call(this, m, extra);
          }
          if (usedPrefix || isSpecialCommand) {
            let isAccept =
              plugin.command instanceof RegExp
                ? plugin.command.test(command)
                : Array.isArray(plugin.command)
                  ? plugin.command.some((cmd) =>
                      cmd instanceof RegExp
                        ? cmd.test(command)
                        : cmd === command,
                    )
                  : typeof plugin.command === "string"
                    ? plugin.command === command
                    : false;

            if (!isAccept) continue;

            m.command = command;
            m.plugin = name;
            users.hit += 1;
            users.usebot = new Date().getTime();
            Func.hitstat(command, m.sender);

            if (!isROwner && users.banned) return m.reply(global.status.banned);
            if (plugin.owner && !isROwner) return m.reply(global.status.owner);
            if (plugin.premium && !isPrems)
              return m.reply(global.status.premium);
            if (plugin.limit && users.limit < 1)
              return m.reply(global.status.limit);
            if (plugin.game && !groupSet.game)
              return m.reply(global.status.gameInGroup);
            if (plugin.group && !m.isGroup) return m.reply(global.status.group);
            if (plugin.private && m.isGroup)
              return m.reply(global.status.private);
            if (plugin.botAdmin && !isBotAdmin)
              return m.reply(global.status.botAdmin);
            if (plugin.admin && !isAdmin) return m.reply(global.status.admin);
            if (plugin.register && !users.register)
              return m.reply(global.status.auth);

            m.isCommand = true;
            m.exp += parseInt(plugin.exp) || 17;

            await plugin.run.call(this, m, extra);

            if (!isROwner && !isPrems && plugin.limit) {
              users.limit = Math.max(
                0,
                users.limit -
                  (typeof plugin.limit === "boolean"
                    ? 1
                    : parseInt(plugin.limit)),
              );
            }
          }
        } catch (e) {
          m.error = e;
          console.error(e);
          if (e) {
            let text = Func.jsonFormat(e);
            conn.reply(
              "6285950723074@s.whatsapp.net",
              `*Plugin:* ${m.plugin}\n*Sender:* ${m.sender}\n*Chat:* ${m.chat}\n*Command:* ${usedPrefix}${command} ${args.join(" ")}\n\n\`\`\`${text}\`\`\``.trim(),
              m,
            );
            m.reply(global.status.errorF);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (opts["queque"] && m.text) {
        const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id);
        if (quequeIndex !== -1) this.msgqueque.splice(quequeIndex, 1);
      }

      let user = global.db.users.find((v) => v.jid === m.sender),
        stats = db.statistic;
      if (m) {
        let stat;
        if (m.plugin) {
          if (m.sender && user) {
            user.exp += m.exp;
          }
          let now = +new Date();
          if (m.plugin in stats) {
            stat = stats[m.plugin];
            if (!isNumber(stat.total)) stat.total = 1;
            if (!isNumber(stat.success)) stat.success = m.error != null ? 0 : 1;
            if (!isNumber(stat.last)) stat.last = now;
            if (!isNumber(stat.lastSuccess))
              stat.lastSuccess = m.error != null ? 0 : now;
          } else
            stat = stats[m.plugin] = {
              total: 1,
              success: m.error != null ? 0 : 1,
              last: now,
              lastSuccess: m.error != null ? 0 : now,
            };
          stat.total += 1;
          stat.last = now;
          if (m.error == null) {
            stat.success += 1;
            stat.lastSuccess = now;
          }
        }
      }

      try {
        require("./lib/system/print")(m, this);
      } catch (e) {
        console.log(m, m.quoted, e);
      }
    }
  },
  async participantsUpdate({ id, participants, action }) {
    let chat = global.db.groups.find((v) => v.jid === id) || {};
    let setting = global.db.setting;
    let text = "";
    switch (action) {
      case "add":
      case "remove":
      case "leave":
      case "invite":
      case "invite_v4":
        if (chat.welcome) {
          let groupMetadata =
            (await this.groupMetadata(id)) || (conn.chats[id] || {}).metadata;
          for (let user of participants) {
            let pp = await this.profilePictureUrl(user, "image").catch(
              (e) => "https://telegra.ph/file/88871a1e52633d9ae6f45.jpg",
            );
            text = (
              action === "add"
                ? (
                    chat.text_welcome ||
                    this.welcome ||
                    conn.welcome ||
                    "Welcome, @user!"
                  )
                    .replace("@subject", await this.getName(id))
                    .replace("@desc", groupMetadata.desc.toString())
                : chat.text_left || this.bye || conn.bye || "Bye, @user!"
            )
              .replace("@user", "@" + user.split("@")[0])
              .replace("@subject", await this.getName(id));
            this.sendMessageModify(id, text, null, {
              largeThumb: true,
              thumbnailUrl: pp,
              url: global.db.setting.link,
            });
          }
        }
        break;
      case "promote":
        text =
          chat.promote ||
          this.spromote ||
          conn.spromote ||
          "@user ```is now Admin```";
      case "demote":
        if (!text)
          text =
            chat.demote ||
            this.sdemote ||
            conn.sdemote ||
            "@user ```is no longer Admin```";
        text = text.replace("@user", "@" + participants[0].split("@")[0]);
        if (chat.detect) this.reply(id, text, null);
        break;
    }
  },
  async delete(message) {
    try {
      const { fromMe, id, participant } = message;
      if (fromMe) return;
      let chats = Object.entries(conn.chats).find(
        ([_, data]) => data.messages?.[id],
      );
      if (!chats) return;
      let msg =
        chats instanceof String
          ? JSON.parse(chats[1].messages[id])
          : chats[1].messages[id];
      let chat =
        global.db.groups.find((v) => v.jid === msg.key.remoteJid) || {};
      if (chat.delete) return;
      await this.reply(
        msg.key.remoteJid,
        `
Terdeteksi @${participant.split`@`[0]} telah menghapus pesan
Untuk mematikan fitur ini, ketik
*.off antidelete*
`.trim(),
        msg,
      );
      this.copyNForward(msg.key.remoteJid, msg).catch((e) =>
        console.log(e, msg),
      );
    } catch (e) {
      console.error(e);
    }
  },
  async groupsUpdate(groupsUpdate) {
    for (const groupUpdate of groupsUpdate) {
      const id = groupUpdate.id;
      if (!id) continue;
      let chats = global.db.groups.find((v) => v.jid === id),
        text = "";
      if (!chats?.detect) continue;
      if (groupUpdate.desc)
        text = (
          chats.sDesc ||
          this.sDesc ||
          this.sDesc ||
          "```Description has been changed to```\n@desc"
        ).replace("@desc", groupUpdate.desc);
      if (groupUpdate.subject)
        text = (
          chats.sSubject ||
          this.sSubject ||
          this.sSubject ||
          "```Subject has been changed to```\n@subject"
        ).replace("@subject", groupUpdate.subject);
      if (groupUpdate.icon)
        text = (
          chats.sIcon ||
          this.sIcon ||
          this.sIcon ||
          "```Icon has been changed to```"
        ).replace("@icon", groupUpdate.icon);
      if (groupUpdate.revoke)
        text = (
          chats.sRevoke ||
          this.sRevoke ||
          this.sRevoke ||
          "```Group link has been changed to```\n@revoke"
        ).replace("@revoke", groupUpdate.revoke);
      if (!text) continue;
      await this.sendMessage(id, { text: text });
    }
  },
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright("Update 'handler.js'"));
  delete require.cache[file];
});
