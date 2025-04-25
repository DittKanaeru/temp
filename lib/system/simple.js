const {
  default: makeWASocket,
  makeWALegacySocket,
  extractMessageContent,
  makeInMemoryStore,
  proto,
  prepareWAMessageMedia,
  downloadContentFromMessage,
  getBinaryNodeChild,
  jidDecode,
  generateWAMessage,
  areJidsSameUser,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  WAMessageStubType,
  WA_DEFAULT_EPHEMERAL,
} = require("@adiwajshing/baileys");
const { execSync } = require("child_process");
const axios = require("axios");
const chalk = require("chalk");
const fetch = require("node-fetch");
const FileType = require("file-type");
const PhoneNumber = require("awesome-phonenumber");
const fs = require("fs");
const path = require("path");
let Jimp = require("jimp");
const pino = require("pino");
const store = makeInMemoryStore({
  logger: pino().child({ level: "silent", stream: "store" }),
});
const { toAudio, toPTT, toVideo } = require("./converter");
const Exif = new (require("./exif"))();
require("./config.js");
const env = require(process.cwd() + "/config.json");
const ephemeral = { ephemeralExpiration: 8600 };

exports.makeWASocket = (...args) => {
  let conn = makeWASocket(...args);
  Object.defineProperty(conn, "name", {
    value: "WASocket",
    configurable: true,
  });

  conn.loadAllMessages = (messageID) => {
    return Object.entries(conn.chats)
      .filter(([_, { messages }]) => typeof messages === "object")
      .find(([_, { messages }]) =>
        Object.entries(messages).find(
          ([k, v]) => k === messageID || v.key?.id === messageID,
        ),
      )?.[1].messages?.[messageID];
  };

  conn.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      const decode = jidDecode(jid) || {};
      return (
        (decode.user && decode.server && decode.user + "@" + decode.server) ||
        jid
      );
    } else return jid;
  };
  if (conn.user && conn.user.id) conn.user.jid = conn.decodeJid(conn.user.id);
  if (!conn.chats) conn.chats = {};

  function updateNameToDb(contacts) {
    if (!contacts) return;
    for (const contact of contacts) {
      const id = conn.decodeJid(contact.id);
      if (!id) continue;
      let chats = conn.chats[id];
      if (!chats) chats = conn.chats[id] = { id };
      conn.chats[id] = {
        ...chats,
        ...({
          ...contact,
          id,
          ...(id.endsWith("@g.us")
            ? { subject: contact.subject || chats.subject || "" }
            : { name: contact.notify || chats.name || chats.notify || "" }),
        } || {}),
      };
    }
  }

  conn.ev.on("contacts.upsert", updateNameToDb);
  conn.ev.on("groups.update", updateNameToDb);
  conn.ev.on("chats.set", async ({ chats }) => {
    for (const { id, name, readOnly } of chats) {
      id = conn.decodeJid(id);
      if (!id) continue;
      const isGroup = id.endsWith("@g.us");
      let chats = conn.chats[id];
      if (!chats) chats = conn.chats[id] = { id };
      chats.isChats = !readOnly;
      if (name) chats[isGroup ? "subject" : "name"] = name;
      if (isGroup) {
        const metadata = await conn.groupMetadata(id).catch((_) => null);
        if (!metadata) continue;
        chats.subject = name || metadata.subject;
        chats.metadata = metadata;
      }
    }
  });
  conn.ev.on(
    "group-participants.update",
    async function updateParticipantsToDb({ id, participants, action }) {
      id = conn.decodeJid(id);
      if (!(id in conn.chats)) conn.chats[id] = { id };
      conn.chats[id].isChats = true;
      const groupMetadata = await conn.groupMetadata(id).catch((_) => null);
      if (!groupMetadata) return;
      conn.chats[id] = {
        ...conn.chats[id],
        subject: groupMetadata.subject,
        metadata: groupMetadata,
      };
    },
  );

  conn.ev.on(
    "groups.update",
    async function groupUpdatePushToDb(groupsUpdates) {
      for (const update of groupsUpdates) {
        const id = conn.decodeJid(update.id);
        if (!id) continue;
        const isGroup = id.endsWith("@g.us");
        if (!isGroup) continue;
        let chats = conn.chats[id];
        if (!chats) chats = conn.chats[id] = { id };
        chats.isChats = true;
        const metadata = await conn.groupMetadata(id).catch((_) => null);
        if (!metadata) continue;
        chats.subject = metadata.subject;
        chats.metadata = metadata;
      }
    },
  );
  conn.ev.on("chats.upsert", async function chatsUpsertPushToDb(chatsUpsert) {
    console.log({ chatsUpsert });
    const { id, name } = chatsUpsert;
    if (!id) return;
    let chats = (conn.chats[id] = {
      ...conn.chats[id],
      ...chatsUpsert,
      isChats: true,
    });
    const isGroup = id.endsWith("@g.us");
    if (isGroup) {
      const metadata = await conn.groupMetadata(id).catch((_) => null);
      if (metadata) {
        chats.subject = name || metadata.subject;
        chats.metadata = metadata;
      }
      const groups =
        (await conn.groupFetchAllParticipating().catch((_) => ({}))) || {};
      for (const group in groups)
        conn.chats[group] = {
          id: group,
          subject: groups[group].subject,
          isChats: true,
          metadata: groups[group],
        };
    }
  });
  conn.ev.on(
    "presence.update",
    async function presenceUpdatePushToDb({ id, presences }) {
      const sender = Object.keys(presences)[0] || id;
      const _sender = conn.decodeJid(sender);
      const presence = presences[sender]["lastKnownPresence"] || "composing";
      let chats = conn.chats[_sender];
      if (!chats) chats = conn.chats[_sender] = { id: sender };
      chats.presences = presence;
      if (id.endsWith("@g.us")) {
        let chats = conn.chats[id];
        if (!chats) {
          const metadata = await conn.groupMetadata(id).catch((_) => null);
          if (metadata)
            chats = conn.chats[id] = {
              id,
              subject: metadata.subject,
              metadata,
            };
        }
        chats.isChats = true;
      }
    },
  );

  function getTimeFormatted() {
    return new Date().toLocaleTimeString("id-ID", {
      timeZone: process.env.Server,
      hour12: false,
    });
  }

  conn.logger = {
    ...conn.logger,
    info(...args) {
      console.log(
        chalk.bold.rgb(
          57,
          183,
          16,
        )(`✔ INFO [${chalk.white(getTimeFormatted())}]:`),
        chalk.cyan(...args),
      );
    },
    error(...args) {
      console.log(
        chalk.bold.rgb(
          247,
          38,
          33,
        )(`❌ ERROR [${chalk.white(getTimeFormatted())}]:`),
        chalk.rgb(255, 38, 0)(...args),
      );
    },
    warn(...args) {
      console.log(
        chalk.bold.rgb(
          239,
          225,
          3,
        )(`⚠️ WARNING [${chalk.white(getTimeFormatted())}]:`),
        chalk.bgYellow.black(" PERHATIAN! "),
        chalk.keyword("orange")(...args),
      );
    },
  };

  conn.appendTextMessage = async (m, text, chatUpdate) => {
    let messages = await generateWAMessage(
      m.chat,
      {
        text: text,
        mentions: m.mentionedJid,
      },
      {
        userJid: conn.user.id,
        quoted: m.quoted && m.quoted.fakeObj,
      },
    );
    messages.key.fromMe = areJidsSameUser(m.sender, conn.user.id);
    messages.key.id = m.key.id;
    messages.pushName = m.pushName;
    if (m.isGroup) messages.participant = m.sender;
    let msg = {
      ...chatUpdate,
      messages: [proto.WebMessageInfo.fromObject(messages)],
      type: "append",
    };
    conn.ev.emit("messages.upsert", msg);
    return m;
  };

  /**
   * Func.fetchBuffer hehe
   * @param {fs.PathLike} path
   * @param {Boolean} returnFilename
   */
  conn.getFile = async (PATH, returnAsFilename) => {
    let res, filename;
    const data = Buffer.isBuffer(PATH)
      ? PATH
      : /^data:.*?\/.*?;base64,/i.test(PATH)
        ? Buffer.from(PATH.split`,`[1], "base64")
        : /^https?:\/\//.test(PATH)
          ? await (res = await fetch(PATH)).buffer()
          : fs.existsSync(PATH)
            ? ((filename = PATH), fs.readFileSync(PATH))
            : typeof PATH === "string"
              ? PATH
              : Buffer.alloc(0);
    if (!Buffer.isBuffer(data)) throw new TypeError("Result is not a buffer");
    const type = (await FileType.fromBuffer(data)) || {
      mime: "application/octet-stream",
      ext: ".bin",
    };
    if (data && returnAsFilename && !filename)
      (filename = path.join(
        process.cwd(),
        "/temp/" + new Date() * 1 + "." + type.ext,
      )),
        await fs.promises.writeFile(filename, data);
    return {
      res,
      filename,
      ...type,
      data,
      deleteFile() {
        return filename && fs.promises.unlink(filename);
      },
    };
  };
  conn.saveMediaMessage = async (message, filePath, useExtension = true) => {
    let msgContent = message.msg ? message.msg : message;
    let mimeType = (message.msg || message).mimetype || "";
    let mediaType =
      mimeType.split("/")[0].replace("application", "document") ||
      mimeType.split("/")[0];
    const stream = await downloadContentFromMessage(msgContent, mediaType);
    let mediaBuffer = Buffer.from([]);
    for await (const chunk of stream) {
      mediaBuffer = Buffer.concat([mediaBuffer, chunk]);
    }
    let fileType = await FileType.fromBuffer(mediaBuffer);
    let finalPath = useExtension ? `${filePath}.${fileType.ext}` : filePath;
    await fs.writeFileSync(finalPath, mediaBuffer);
    return finalPath;
  };
  conn.sendReact = async (jid, text, quoted) => {
    let reactionMessage = {
      react: {
        text: text,
        key: quoted,
      },
    };
    return await conn.sendMessage(jid, reactionMessage);
  };

  (conn.sendContact = async (jid, data, quoted, options) => {
    if (!Array.isArray(data[0]) && typeof data[0] === "string") data = [data];
    let contacts = [];
    for (let [number, name] of data) {
      number = number.replace(/[^0-9]/g, "");
      let njid = number + "@s.whatsapp.net";
      let biz = (await conn.getBusinessProfile(njid).catch((_) => null)) || {};
      let vcard = `BEGIN:VCARD
VERSION:3.0
FN:${name.replace(/\n/g, "\\n")}
ORG:
item1.TEL;waid=${number}:${PhoneNumber("+" + number).getNumber("international")}
item1.X-ABLabel:Ponsel${
        biz.description
          ? `item2.EMAIL;type=INTERNET:${(biz.email || "").replace(/\n/g, "\\n")}
item2.X-ABLabel:Email
PHOTO;BASE64:${((await conn.getFile(await conn.profilePictureUrl(njid)).catch((_) => ({}))) || {}).number?.toString("base64")}
X-WA-BIZ-DESCRIPTION:${(biz.description || "").replace(/\n/g, "\\n")}
X-WA-BIZ-NAME:${name.replace(/\n/g, "\\n")}`
          : ""
      }
END:VCARD`.trim();
      contacts.push({ vcard, displayName: name });
    }
    return conn.sendMessage(
      jid,
      {
        ...options,
        contacts: {
          ...options,
          displayName:
            (contacts.length >= 2
              ? `${contacts.length} kontak`
              : contacts[0].displayName) || null,
          contacts,
        },
      },
      { quoted, ...options },
    );
    enumerable: true;
  }),
    (conn.reply = async (jid, text, quoted, options) => {
      await conn.sendPresenceUpdate("composing", jid);
      return conn.sendMessage(
        jid,
        { text: text, mentions: conn.parseMention(text), ...options },
        { quoted },
      );
    });

  conn.resize = async (image, width, height) => {
    let oyy = await Jimp.read(image);
    let kiyomasa = await oyy
      .resize(width, height)
      .Func.fetchBufferAsync(Jimp.MIME_JPEG);
    return kiyomasa;
  };

  conn.sendMessageModify = async (chatId, message, chatContext, opts) => {
    if (opts) {
      opts.renderLargerThumbnail =
        opts.largeThumb || opts.renderLargerThumbnail;
      opts.showAdAttribution = opts.ads || opts.showAdAttribution;
      opts.sourceUrl = opts.url || global.db.setting.link;

      delete opts.largeThumb;
      delete opts.ads;
      delete opts.url;
    }

    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    let filePath;

    if (
      opts.thumbnail &&
      typeof opts.thumbnail === "string" &&
      opts.thumbnail.startsWith("http")
    ) {
      opts.thumbnailUrl = opts.thumbnail;
      delete opts.thumbnail;
    }

    if (opts.thumbnail && Buffer.isBuffer(opts.thumbnail)) {
      const fileName = `thumb_${Date.now()}.jpg`;
      filePath = path.join(tempDir, fileName);
      fs.writeFileSync(filePath, opts.thumbnail);
      opts.thumbnail = fs.readFileSync(filePath);
    }

    conn.reply(chatId, message, chatContext, {
      contextInfo: {
        mentionedJid: conn.parseMention(message),
        groupMentions: [],
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: "",
          newsletterName: "Sakura flower arc",
          serverMessageId: -1,
        },
        externalAdReply: {
          title: env.namebot,
          mediaType: 1,
          previewType: 0,
          ...opts,
        },
      },
    });

    if (filePath) {
      setTimeout(() => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, 60000);
    }
  };

  conn.sendFile = async (
    jid,
    path,
    filename = "",
    caption = "",
    quoted,
    options = {},
  ) => {
    let type = await conn.getFile(path, true);
    let { res, data: file, filename: pathFile, mime } = type;

    if (res?.status !== 200 || file?.length <= 65536) {
      try {
        throw { json: JSON.parse(file?.toString() || "{}") };
      } catch (e) {
        if (e?.json) throw e.json;
      }
    }

    let opt = { filename };
    if (quoted) opt.quoted = quoted;

    let mtype = "";
    let mimetype = mime;

    if (mime === "application/vnd.android.package-archive") {
      mimetype = "application/vnd.android.package-archive";
      mtype = "document";
      options.fileName = filename || pathFile;
      opt.fileName = filename || pathFile;
    } else if (options?.Document) {
      mtype = "document";
      mimetype = mime;
      options.fileName = filename || pathFile;
    } else if (
      /webp/.test(mime) ||
      (/image/.test(mime) && options?.asSticker)
    ) {
      mtype = "sticker";
    } else if (/image/.test(mime) || (/webp/.test(mime) && options?.asImage)) {
      mtype = "image";
    } else if (/video/.test(mime)) {
      try {
        let converted = await toVideo(file, type.ext);
        file = converted?.data;
        pathFile = converted?.filename;
        mimetype = "video/mp4";
        mtype = "video";
        if (options?.gif) options.gifPlayback = true;
      } catch (err) {
        console.error("⚠️ Gagal mengonversi video:", err?.message);
        return;
      }
    } else if (/audio/.test(mime)) {
      let convert = await (options?.ptt ? toPTT : toAudio)(file, type.ext);
      file = convert?.data;
      pathFile = convert?.filename;
      mtype = "audio";
      mimetype = "audio/mpeg";
    } else {
      mtype = "document";
    }

    let message = {
      ...options,
      caption,
      filename: options?.fileName || filename,
      ptt: options?.ptt,
      [mtype]: { url: pathFile },
      mimetype,
    };

    let m;
    try {
      m = await conn.sendMessage(jid, message, { ...opt, ...options });
    } catch (e) {
      console.error(e);
      m = null;
    } finally {
      if (!m) {
        m = await conn.sendMessage(
          jid,
          { ...message, [mtype]: file },
          { ...opt, ...options },
        );
      }
      return m;
    }
  };

  conn.sendGroupV4Invite = async (
    jid,
    participant,
    inviteCode,
    inviteExpiration,
    groupName = "unknown subject",
    caption = "Invitation to join my WhatsApp group",
    options = {},
  ) => {
    let msg = proto.Message.fromObject({
      groupInviteMessage: proto.GroupInviteMessage.fromObject({
        inviteCode,
        inviteExpiration:
          parseInt(inviteExpiration) || +new Date(new Date() + 3 * 86400000),
        groupJid: jid,
        groupName: groupName ? groupName : this.getName(jid),
        caption,
      }),
    });
    let message = await this.prepareMessageFromContent(
      participant,
      msg,
      options,
    );
    await this.relayWAMessage(message);
    return message;
  };

  conn.cMod = (
    jid,
    message,
    text = "",
    sender = conn.user.jid,
    options = {},
  ) => {
    let copy = message.toJSON();
    let mtype = Object.keys(copy.message)[0];
    let isEphemeral = false;
    if (isEphemeral) {
      mtype = Object.keys(copy.message.ephemeralMessage.message)[0];
    }
    let msg = isEphemeral
      ? copy.message.ephemeralMessage.message
      : copy.message;
    let content = msg[mtype];
    if (typeof content === "string") msg[mtype] = text || content;
    else if (content.caption) content.caption = text || content.caption;
    else if (content.text) content.text = text || content.text;
    if (typeof content !== "string") msg[mtype] = { ...content, ...options };
    if (copy.participant)
      sender = copy.participant = sender || copy.participant;
    else if (copy.key.participant)
      sender = copy.key.participant = sender || copy.key.participant;
    if (copy.key.remoteJid.includes("@s.whatsapp.net"))
      sender = sender || copy.key.remoteJid;
    else if (copy.key.remoteJid.includes("@broadcast"))
      sender = sender || copy.key.remoteJid;
    copy.key.remoteJid = jid;
    copy.key.fromMe = areJidsSameUser(sender, conn.user.id) || false;
    return proto.WebMessageInfo.fromObject(copy);
  };

  conn.copyNForward = async (
    jid,
    message,
    forwardingScore = true,
    options = {},
  ) => {
    let m = generateForwardMessageContent(message, !!forwardingScore);
    let mtype = Object.keys(m)[0];
    if (
      forwardingScore &&
      typeof forwardingScore == "number" &&
      forwardingScore > 1
    )
      m[mtype].contextInfo.forwardingScore += forwardingScore;
    m = generateWAMessageFromContent(jid, m, {
      ...options,
      userJid: conn.user.id,
    });
    await conn.relayMessage(jid, m.message, {
      messageId: m.key.id,
      additionalAttributes: { ...options },
    });
    return m;
  };

  conn.loadMessage =
    conn.loadMessage ||
    (async (messageID) => {
      return Object.entries(conn.chats)
        .filter(([_, { messages }]) => typeof messages === "object")
        .find(([_, { messages }]) =>
          Object.entries(messages).find(
            ([k, v]) => k === messageID || v.key?.id === messageID,
          ),
        )?.[1].messages?.[messageID];
    });

  conn.downloadM = async (m, type, saveToFile) => {
    if (!m || !(m.url || m.directPath)) return Buffer.alloc(0);
    const stream = await downloadContentFromMessage(m, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    if (saveToFile) var { filename } = await conn.getFile(buffer, true);
    return saveToFile && fs.existsSync(filename) ? filename : buffer;
  };

  conn.downloadAndSaveMediaMessage = async (
    message,
    filename,
    attachExtension = true,
  ) => {
    let quoted = message.msg ? message.msg : message;
    let mime = (message.msg || message).mimetype || "";
    let messageType = message.mtype
      ? message.mtype.replace(/Message/gi, "")
      : mime.split("/")[0];
    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    let type = await FileType.fromBuffer(buffer);
    trueFileName = attachExtension ? filename + "." + type.ext : filename;
    await fs.writeFileSync(trueFileName, buffer);
    return trueFileName;
  };

  conn.sendSticker = async (jid, path, quoted, options = {}) => {
    let buffer;
    if (/^https?:\/\//.test(path)) {
      const response = await fetch(path);
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (Buffer.isBuffer(path)) {
      buffer = path;
    } else if (/^data:.*?\/.*?;base64,/i.test(path)) {
      buffer = Buffer.from(path.split(",")[1], "base64");
    } else {
      buffer = Buffer.alloc(0);
    }

    let { mime } = await FileType.fromBuffer(buffer);
    let convert;

    if (/image\/(jpe?g|png|gif)|octet/.test(mime)) {
      convert =
        options && (options.packname || options.author)
          ? await Exif.writeExifImg(buffer, options)
          : await Exif.imageToWebp(buffer);
    } else if (/video/.test(mime)) {
      convert =
        options && (options.packname || options.author)
          ? await Exif.writeExifVid(buffer, options)
          : await Exif.videoToWebp(buffer);
    } else if (/webp/.test(mime)) {
      convert = await Exif.writeExifWebp(buffer, options);
    } else {
      convert = Buffer.alloc(0);
    }

    await conn.sendPresenceUpdate("composing", jid);
    return conn.sendMessage(
      jid,
      {
        sticker: {
          url: convert,
        },
        ...options,
      },
      { quoted },
    );
  };

  conn.parseMention = (text = "") => {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(
      (v) => v[1] + "@s.whatsapp.net",
    );
  };

  conn.downloadMediaMessage = async (message) => {
    let mime = (message.msg || message).mimetype || "";
    let messageType = message.mtype
      ? message.mtype.replace(/Message|WithCaption/gi, "")
      : mime.split("/")[0];
    const stream = await downloadContentFromMessage(message, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
  };

  conn.getName = (jid = "", withoutContact = false) => {
    jid = conn.decodeJid(jid);
    withoutContact = this.withoutContact || withoutContact;
    let v;
    if (jid.endsWith("@g.us"))
      return new Promise(async (resolve) => {
        v = conn.chats[jid] || {};
        if (!(v.name || v.subject)) v = (await conn.groupMetadata(jid)) || {};
        resolve(
          v.name ||
            v.subject ||
            PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber(
              "international",
            ),
        );
      });
    else
      v =
        jid === "0@s.whatsapp.net"
          ? { jid, vname: "WhatsApp" }
          : areJidsSameUser(jid, conn.user.id)
            ? conn.user
            : conn.chats[jid] || {};
    return (
      (withoutContact ? "" : v.name) ||
      v.subject ||
      v.vname ||
      v.notify ||
      v.verifiedName ||
      PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber(
        "international",
      )
    );
  };

  conn.processMessageStubType = async (m) => {
    if (!m.messageStubType) return;
    const chat = conn.decodeJid(
      m.key.remoteJid || m.message?.senderKeyDistributionMessage?.groupId || "",
    );
    if (!chat || chat === "status@broadcast") return;
    const emitGroupUpdate = (update) => {
      conn.ev.emit("groups.update", [{ id: chat, ...update }]);
    };
    switch (m.messageStubType) {
      case WAMessageStubType.REVOKE:
      case WAMessageStubType.GROUP_CHANGE_INVITE_LINK:
        emitGroupUpdate({ revoke: m.messageStubParameters[0] });
        break;
      case WAMessageStubType.GROUP_CHANGE_ICON:
        emitGroupUpdate({ icon: m.messageStubParameters[0] });
        break;
      default: {
        console.log({
          messageStubType: m.messageStubType,
          messageStubParameters: m.messageStubParameters,
          type: WAMessageStubType[m.messageStubType],
        });
        break;
      }
    }
    const isGroup = chat.endsWith("@g.us");
    if (!isGroup) return;
    let chats = conn.chats[chat];
    if (!chats) chats = conn.chats[chat] = { id: chat };
    chats.isChats = true;
    const metadata = await conn.groupMetadata(chat).catch((_) => null);
    if (!metadata) return;
    chats.subject = metadata.subject;
    chats.metadata = metadata;
  };

  conn.insertAllGroup = async () => {
    const groups =
      (await conn.groupFetchAllParticipating().catch((_) => null)) || {};
    for (const group in groups)
      conn.chats[group] = {
        ...(conn.chats[group] || {}),
        id: group,
        subject: groups[group].subject,
        isChats: true,
        metadata: groups[group],
      };
    return conn.chats;
  };

  conn.pushMessage = async (m) => {
    if (!m) return;
    if (!Array.isArray(m)) m = [m];
    for (const message of m) {
      try {
        if (!message) continue;
        if (
          message.messageStubType &&
          message.messageStubType != WAMessageStubType.CIPHERTEXT
        )
          conn.processMessageStubType(message).catch(console.error);
        const _mtype = Object.keys(message.message || {});
        const mtype =
          (!["senderKeyDistributionMessage", "messageContextInfo"].includes(
            _mtype[0],
          ) &&
            _mtype[0]) ||
          (_mtype.length >= 3 &&
            _mtype[1] !== "messageContextInfo" &&
            _mtype[1]) ||
          _mtype[_mtype.length - 1];
        const chat = conn.decodeJid(
          message.key.remoteJid ||
            message.message?.senderKeyDistributionMessage?.groupId ||
            "",
        );
        if (message.message?.[mtype]?.contextInfo?.quotedMessage) {
          let context = message.message[mtype].contextInfo;
          let participant = conn.decodeJid(context.participant);
          const remoteJid = conn.decodeJid(context.remoteJid || participant);
          let quoted = message.message[mtype].contextInfo.quotedMessage;
          if (remoteJid && remoteJid !== "status@broadcast" && quoted) {
            let qMtype = Object.keys(quoted)[0];
            if (qMtype == "conversation") {
              quoted.extendedTextMessage = { text: quoted[qMtype] };
              delete quoted.conversation;
              qMtype = "extendedTextMessage";
            }
            if (!quoted[qMtype].contextInfo) quoted[qMtype].contextInfo = {};
            quoted[qMtype].contextInfo.mentionedJid =
              context.mentionedJid ||
              quoted[qMtype].contextInfo.mentionedJid ||
              [];
            const isGroup = remoteJid.endsWith("g.us");
            if (isGroup && !participant) participant = remoteJid;
            const qM = {
              key: {
                remoteJid,
                fromMe: areJidsSameUser(conn.user.jid, remoteJid),
                id: context.stanzaId,
                participant,
              },
              message: JSON.parse(JSON.stringify(quoted)),
              ...(isGroup ? { participant } : {}),
            };
            let qChats = conn.chats[participant];
            if (!qChats)
              qChats = conn.chats[participant] = {
                id: participant,
                isChats: !isGroup,
              };
            if (!qChats.messages) qChats.messages = {};
            if (!qChats.messages[context.stanzaId] && !qM.key.fromMe)
              qChats.messages[context.stanzaId] = qM;
            let qChatsMessages;
            if ((qChatsMessages = Object.entries(qChats.messages)).length > 40)
              qChats.messages = Object.fromEntries(
                qChatsMessages.slice(30, qChatsMessages.length),
              );
          }
        }
        if (!chat || chat === "status@broadcast") continue;
        const isGroup = chat.endsWith("@g.us");
        let chats = conn.chats[chat];
        if (!chats) {
          if (isGroup) await conn.insertAllGroup().catch(console.error);
          chats = conn.chats[chat] = {
            id: chat,
            isChats: true,
            ...(conn.chats[chat] || {}),
          };
        }
        let metadata, sender;
        if (isGroup) {
          if (!chats.subject || !chats.metadata) {
            metadata =
              (await conn.groupMetadata(chat).catch((_) => ({}))) || {};
            if (!chats.subject) chats.subject = metadata.subject || "";
            if (!chats.metadata) chats.metadata = metadata;
          }
          sender = conn.decodeJid(
            (message.key?.fromMe && conn.user.id) ||
              message.participant ||
              message.key?.participant ||
              chat ||
              "",
          );
          if (sender !== chat) {
            let chats = conn.chats[sender];
            if (!chats) chats = conn.chats[sender] = { id: sender };
            if (!chats.name) chats.name = message.pushName || chats.name || "";
          }
        } else if (!chats.name)
          chats.name = message.pushName || chats.name || "";
        if (
          ["senderKeyDistributionMessage", "messageContextInfo"].includes(mtype)
        )
          continue;
        chats.isChats = true;
        if (!chats.messages) chats.messages = {};
        const fromMe =
          message.key.fromMe || areJidsSameUser(sender || chat, conn.user.id);
        if (
          !["protocolMessage"].includes(mtype) &&
          !fromMe &&
          message.messageStubType != WAMessageStubType.CIPHERTEXT &&
          message.message
        ) {
          delete message.message.messageContextInfo;
          delete message.message.senderKeyDistributionMessage;
          chats.messages[message.key.id] = JSON.parse(
            JSON.stringify(message, null, 2),
          );
          let chatsMessages;
          if ((chatsMessages = Object.entries(chats.messages)).length > 40)
            chats.messages = Object.fromEntries(
              chatsMessages.slice(30, chatsMessages.length),
            );
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  conn.setBio = async (status) => {
    return await conn.query({
      tag: "iq",
      attrs: {
        to: "s.whatsapp.net",
        type: "set",
        xmlns: "status",
      },
      content: [
        {
          tag: "status",
          attrs: {},
          content: Buffer.from(status, "utf-8"),
        },
      ],
    });
  };

  conn.serializeM = (m) => {
    return exports.smsg(conn, m);
  };

  return conn;
};

smsg = (conn, m) => {
  if (!m) return m;
  let M = proto.WebMessageInfo;
  m = M.fromObject(m);
  if (m.key) {
    m.id = m.key.id;
    m.isBaileys = m.id.startsWith("B1EY") && m.id.length === 20;
    m.chat = conn.decodeJid(
      m.key.remoteJid ||
        message.message?.senderKeyDistributionMessage?.groupId ||
        "",
    );
    m.isGroup = m.chat.endsWith("@g.us");
    m.sender = conn.decodeJid(
      (m.key.fromMe && conn.user.id) ||
        m.participant ||
        m.key.participant ||
        m.chat ||
        "",
    );
    m.fromMe = m.key.fromMe || areJidsSameUser(m.sender, conn.user.id);
  }
  if (m.message) {
    if (m.message.viewOnceMessage) {
      m.mtype = Object.keys(m.message.viewOnceMessage.message)[0];
      m.msg = m.message.viewOnceMessage.message[m.mtype];
    } else if (m.message.viewOnceMessageV2) {
      m.mtype = Object.keys(m.message.viewOnceMessageV2.message)[0];
      m.msg = m.message.viewOnceMessageV2.message[m.mtype];
    } else {
      m.mtype =
        Object.keys(m.message)[0] == "senderKeyDistributionMessage"
          ? Object.keys(m.message)[2] == "messageContextInfo"
            ? Object.keys(m.message)[1]
            : Object.keys(m.message)[2]
          : Object.keys(m.message)[0] != "messageContextInfo"
            ? Object.keys(m.message)[0]
            : Object.keys(m.message)[1];
      m.msg = m.message[m.mtype];
    }
    if (
      m.mtype === "ephemeralMessage" ||
      m.mtype === "documentWithCaptionMessage"
    ) {
      smsg(conn, m.msg);
      m.mtype = m.msg.mtype;
      m.msg = m.msg.msg;
    }
    m.text =
      m.mtype === "interactiveResponseMessage"
        ? JSON.parse(
            m.message.interactiveResponseMessage.nativeFlowResponseMessage
              .paramsJson,
          ).id
        : m.mtype === "conversation"
          ? m.message.conversation
          : m.mtype == "imageMessage"
            ? m.message.imageMessage.caption
            : m.mtype == "videoMessage"
              ? m.message.videoMessage.caption
              : m.mtype == "extendedTextMessage"
                ? m.message.extendedTextMessage.text
                : m.mtype == "buttonsResponseMessage"
                  ? m.message.buttonsResponseMessage.selectedButtonId
                  : m.mtype == "listResponseMessage"
                    ? m.message.listResponseMessage.singleSelectReply
                        .selectedRowId
                    : m.mtype == "templateButtonReplyMessage"
                      ? m.message.templateButtonReplyMessage.selectedId
                      : m.mtype == "messageContextInfo"
                        ? m.message.buttonsResponseMessage?.selectedButtonId ||
                          m.message.listResponseMessage?.singleSelectReply
                            .selectedRowId ||
                          m.text
                        : "";
    let quoted = (m.quoted =
      typeof m.msg != "undefined"
        ? m.msg.contextInfo
          ? m.msg.contextInfo.quotedMessage
          : null
        : null);
    m.mentionedJid =
      typeof m.msg != "undefined"
        ? m.msg.contextInfo
          ? m.msg.contextInfo.mentionedJid
          : []
        : [];
    if (m.quoted) {
      let type = Object.keys(m.quoted)[0];
      m.quoted = m.quoted[type];
      if (["productMessage"].includes(type)) {
        type = Object.keys(m.quoted)[0];
        m.quoted = m.quoted[type];
      }
      if (["documentWithCaptionMessage"].includes(type)) {
        type = Object.keys(m.quoted.message)[0];
        m.quoted = m.quoted.message[type];
      }
      // if (['pollCreationMessage']).includes(type) {
      // let pollmsg = await store.loadMessage(m.chat, m.msg.contextInfo.stanzaId)
      // let options = getAggregateVotesInPollMessage(pollmsg, global.sock.user.id)
      // m.quoted.options = options
      // }
      if (typeof m.quoted === "string")
        m.quoted = {
          text: m.quoted,
        };
      m.quoted.mtype = type;
      m.quoted.id = m.msg.contextInfo.stanzaId;
      m.quoted.chat = conn.decodeJid(
        m.msg.contextInfo.remoteJid || m.chat || m.sender,
      );
      m.quoted.isBaileys = m.quoted.id
        ? m.quoted.id.startsWith("B1EY") && m.quoted.id.length === 20
        : false;
      m.quoted.sender = conn.decodeJid(m.msg.contextInfo.participant);
      m.quoted.fromMe = m.quoted.sender === conn.user.jid;
      m.quoted.text =
        m.quoted.text || m.quoted.caption || m.quoted.contentText || "";
      m.quoted.name = conn.getName(m.quoted.sender);
      m.quoted.mentionedJid =
        (m.quoted.contextInfo?.mentionedJid?.length &&
          m.quoted.contextInfo.mentionedJid) ||
        [];
      let vM = (m.quoted.fakeObj = M.fromObject({
        key: {
          fromMe: m.quoted.fromMe,
          remoteJid: m.quoted.chat,
          id: m.quoted.id,
        },
        message: quoted,
        ...(m.isGroup ? { participant: m.quoted.sender } : {}),
      }));
      m.getQuotedObj = m.getQuotedMessage = async () => {
        if (!m.quoted.id) return null;
        let q = M.fromObject((await conn.loadMessage(m.quoted.id)) || vM);
        return exports.smsg(conn, q);
      };
      if (m.quoted.url || m.quoted.directPath)
        m.quoted.download = (saveToFile = false) =>
          conn.downloadM(
            m.quoted,
            m.quoted.mtype.replace(/message/i, ""),
            saveToFile,
          );
      m.quoted.reply = (text, chatId, options) =>
        conn.reply(chatId ? chatId : m.chat, text, vM, options);
      m.quoted.copy = () => exports.smsg(conn, M.fromObject(M.toObject(vM)));
      m.quoted.forward = (jid, forceForward = false) =>
        conn.forwardMessage(jid, vM, forceForward);
      m.quoted.copyNForward = (jid, forceForward = true, options = {}) =>
        conn.copyNForward(jid, vM, forceForward, options);
      m.quoted.cMod = (
        jid,
        text = "",
        sender = m.quoted.sender,
        options = {},
      ) => conn.cMod(jid, vM, text, sender, options);
      m.quoted.delete = () =>
        conn.sendMessage(m.quoted.chat, { delete: vM.key });
    }
  }
  m.name = m.pushName || conn.getName(m.sender);
  if (m.msg && m.msg.url)
    m.download = (saveToFile = false) =>
      conn.downloadM(m.msg, m.mtype.replace(/message/i, ""), saveToFile);
  m.copy = () => exports.smsg(conn, M.fromObject(M.toObject(m)));
  m.forward = (jid = m.chat, forceForward = false) =>
    conn.copyNForward(jid, m, forceForward, options);

  /*m.reply = async (text, options) => {
     await conn.sendPresenceUpdate('composing', m.chat)
     conn.sendMessage(m.chat, {
          text,
          mentions: conn.parseMention(text),
          ...options
       }, {
          quoted: m,
          ephemeralExpiration: m.expiration
     })
   }*/
  m.reply = async (pesan, options) => {
    const ppUrl = await conn
      .profilePictureUrl(m.sender, "image")
      .catch((_) => "https://telegra.ph/file/1ecdb5a0aee62ef17d7fc.jpg");
    const a = {
      contextInfo: {
        mentionedJid: conn.parseMention(pesan),
        groupMentions: [],
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: env.saluran,
          newsletterName: "Sakura flower arc",
          serverMessageId: -1,
        },
        forwardingScore: 256,
        externalAdReply: {
          title: `• Name : [ ${m.name} ]`,
          body: `Runtime : ${Func.toTime(process.uptime() * 1000)}`,
          thumbnailUrl: "https://files.catbox.moe/9q1e3v.png", //https://cdn.maelyn.tech/New Project 5 [898ABDA].png
          sourceUrl: "https://whatsapp.com/channel/0029VabPS5V3gvWSebO39V2X",
          mediaType: 1,
          renderLargerThumbnail: false,
        },
      },
    };
    try {
      if (options && pesan) {
        conn.sendFile(m.chat, options, "", pesan, m, a);
      } else {
        if (pesan) {
          conn.reply(m.chat, pesan, m, a);
        } else {
          conn.reply(m.chat, options, m, a);
        }
      }
    } catch (e) {
      conn.reply(m.chat, pesan, m, a);
    }
  };
  m.react = async (emoticon) => {
    let reactionMessage = {
      react: {
        text: emoticon,
        key: m.key,
      },
    };
    return await conn.sendMessage(m.chat, reactionMessage);
  };
  m.copyNForward = (jid = m.chat, forceForward = true, options = {}) =>
    conn.copyNForward(jid, m, forceForward, options);
  m.cMod = (jid, text = "", sender = m.sender, options = {}) =>
    conn.cMod(jid, m, text, sender, options);
  m.delete = () => conn.sendMessage(m.chat, { delete: m.key });

  try {
    if (m.msg && m.mtype == "protocolMessage")
      conn.ev.emit("message.delete", m.msg.key);
  } catch (e) {
    console.error(e);
  }
  return m;
};

exports.smsg = smsg;
