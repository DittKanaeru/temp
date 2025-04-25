(async () => {
  require("./lib/system/functions");
  require("./lib/system/scraper");
  require("./lib/system/config.js");
  require("dotenv").config();
  const {
    default: makeWASocket,
    useMultiFileAuthState,
    makeInMemoryStore,
    makeCacheableSignalKeyStore,
    DisconnectReason,
    fetchLatestBaileysVersion,
    PHONENUMBER_MCC,
    Browsers,
    proto,
    jidNormalizedUser,
  } = require("@adiwajshing/baileys");

  const env = require("./config.json");
  const path = require("path");
  const pino = require("pino");
  const { Boom } = require("@hapi/boom");
  const fs = require("fs");
  const chokidar = require("chokidar");
  const { promisify } = require("util");
  const exec = promisify(require("child_process").exec).bind(
    require("child_process"),
  );
  const moment = require("moment-timezone");
  const chalk = require("chalk");
  const PhoneNumber = require("awesome-phonenumber");
  const NodeCache = require("node-cache");
  const yargs = require("yargs/yargs");
  const readdir = promisify(fs.readdir);
  const stat = promisify(fs.stat);
  const syntaxerror = require("syntax-error");

  let simple = require("./lib/system/simple");
  const machine = new (require("./lib/system/database/localdb"))(env.database);
  const Session = require("./lib/system/backup");
  const session = new Session();

  global.db = {
    users: [],
    chats: [],
    groups: [],
    redeem: {},
    menfess: {},
    statistic: {},
    sticker: {},
    msgs: {},
    setting: {},
    ...((await machine.fetch()) || {}),
  };

  await machine.save(global.db);
  setInterval(async () => {
    if (global.db) await machine.save(global.db);
  }, 30 * 1000);

  global.store = makeInMemoryStore({
    logger: pino().child({ level: "silent", stream: "store" }),
  });

  global.opts = new Object(
    yargs(process.argv.slice(2)).exitProcess(false).parse(),
  );

  const msgRetryCounterMap = (MessageRetryMap) => {};
  const messageRetryCache = new NodeCache();
  const { state, saveState, saveCreds } = await useMultiFileAuthState(
    env.sessions,
  );
  const { version } = await fetchLatestBaileysVersion();
  store.readFromFile(process.cwd() + `/${env.sessions}/store.json`);

  const connectionOptions = {
    printQRInTerminal: !env.pairing.state,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 10000,
    patchMessageBeforeSending: (message) => {
      const requiresPatch =
        message.buttonsMessage ||
        message.templateMessage ||
        message.listMessage;
      if (requiresPatch) {
        message = {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadataVersion: 2,
                deviceListMetadata: {},
              },
              ...message,
            },
          },
        };
      }
      return message;
    },
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => {
      if (store) {
        const msg = await store.loadMessage(key.remoteJid, key.id);
        return msg.message || undefined;
      }
      return {
        conversation: "[ Amicy Gen 2 ]",
      };
    },
    msgRetryCounterCache: messageRetryCache,
    defaultQueryTimeoutMs: 0,
    version,
    browser: Browsers.windows("Edge"),
    logger: pino({
      level: "fatal",
    }),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(
        state.keys,
        pino().child({
          level: "silent",
          stream: "store",
        }),
      ),
    },
  };
  setInterval(
    async () => {
      await exec("rm -rf ./temp/*");
    },
    60 * 60 * 1000,
  );
  global.conn = simple.makeWASocket(connectionOptions);
  conn.isInit = false;
  const connectionUpdate = async (update) => {
    const {
      connection,
      lastDisconnect,
      isNewLogin,
      receivedPendingNotifications,
    } = update;

    let time = chalk.cyan.bold(
      moment().tz(process.env.Server).format("HH:mm:ss"),
    );
    let reason = lastDisconnect?.error
      ? new Boom(lastDisconnect.error)?.output?.statusCode
      : null;
    let sessionPath = env.sessions
      ? path.join(process.cwd(), env.sessions)
      : null;

    if (isNewLogin) conn.isInit = true;

    if (
      connection === "connecting" ||
      receivedPendingNotifications === "false"
    ) {
      console.log(chalk.yellow(`[ ${time} ] 📑 Connecting...`));
    } else if (connection === "open") {
      if (sessionPath) session.backups(conn, sessionPath);
      console.log(chalk.green.bold(`[ ${time} ] ✅ Connected successfully!`));
    } else if (connection === "close") {
      let message = "⚠️ Connection closed, reconnecting...";
      let shouldExit = false;
      let shouldDeleteSession = false;

      switch (reason) {
        case DisconnectReason.badSession:
          message = "❌ Bad Session! Deleting session and reconnecting...";
          shouldExit = true;
          shouldDeleteSession = true;
          break;
        case DisconnectReason.connectionClosed:
          message = "⚠️ Connection closed, reconnecting...";
          break;
        case DisconnectReason.connectionLost:
          message = "⚠️ Connection lost, trying to reconnect...";
          break;
        case DisconnectReason.connectionReplaced:
          message = "❌ Connection replaced! Another instance is active.";
          shouldExit = true;
          break;
        case DisconnectReason.loggedOut:
          message = "❌ Logged out! Deleting session and exiting...";
          shouldExit = true;
          shouldDeleteSession = true;
          break;
        case DisconnectReason.restartRequired:
          message = "🔄 Restart required, please wait...";
          break;
        case DisconnectReason.timedOut:
          message = "⚠️ Connection timeout, retrying...";
          break;
        default:
          message = `⚠️ Connection closed: ${reason || "Unknown Reason"}`;
      }

      console.log(chalk.redBright(`[ ${time} ] [ Disconnect ] ${message}`));

      if (shouldDeleteSession && sessionPath && fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        console.log(
          chalk.redBright(`🗑️ Session folder deleted: ${sessionPath}`),
        );
      }

      if (shouldExit) {
        console.log(chalk.yellow(`[ ${time} ] ❌ Exiting process...`));
        process.exit(1);
      }

      if (reason !== 405) {
        reloadHandler(true);
      } else {
        console.warn(
          chalk.yellow(
            `[ ${time} ] ⚠️ Detected reason 405, avoiding infinite reconnect loop.`,
          ),
        );
      }
    }
  };
  async function validatePhoneNumber(input) {
    if (!input) return null;
    let phoneNumber = String(input).replace(/[^0-9]/g, "");
    let pn = phoneNumber.startsWith("+")
      ? new PhoneNumber(phoneNumber)
      : new PhoneNumber(`+${phoneNumber}`);
    if (!pn.isValid() || !pn.isMobile()) {
      console.log(
        chalk.redBright(
          "❌ Invalid phone number. Please enter a valid WhatsApp number (e.g., 62xxx).",
        ),
      );
      return null;
    }
    return pn.getNumber("e164").replace("+", "");
  }
  if (env.pairing.state && !conn.authState.creds.registered) {
    try {
      const phoneNumber = await validatePhoneNumber(env.pairing.numberbot);
      setTimeout(async () => {
        let code = await conn.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(
          chalk.black(chalk.bgGreen(`Your Pairing Code : `)),
          chalk.black(chalk.white(code)),
        );
      }, 3000);
    } catch (error) {
      console.error(chalk.red("❌ Error requesting pairing code:"), error);
    }
  }
  store.bind(conn.ev);
  let isInit = true,
    handler = require("./handler");
  reloadHandler = function (restatConn) {
    let Handler = require("./handler");
    if (Object.keys(Handler || {}).length) handler = Handler;
    if (restatConn) {
      try {
        conn.ws.close();
      } catch {}
      conn = {
        ...conn,
        ...simple.makeWASocket(connectionOptions),
      };
    }
    if (!isInit) {
      conn.ev.off("messages.upsert", conn.handler);
      conn.ev.off("group-participants.update", conn.participantsUpdate);
      conn.ev.off("connection.update", conn.connectionUpdate);
      conn.ev.off("creds.update", conn.credsUpdate);
    }

    conn.welcome =
      "Welcome to *@subject* @user\nSemoga betah Dan jangan lupa baca deskripsi\n@desc";
    conn.bye = "Goodbye @user,\nSemoga tenang di alam sana.";
    conn.spromote = "@user telah naik jabatan";
    conn.sdemote = "@user telah turun jabatan🗿";

    conn.handler = handler.handler.bind(conn);
    conn.participantsUpdate = handler.participantsUpdate.bind(conn);
    conn.connectionUpdate = connectionUpdate.bind(conn);
    conn.credsUpdate = saveCreds.bind(conn);

    conn.ev.on("messages.upsert", conn.handler);
    conn.ev.on("group-participants.update", conn.participantsUpdate);
    conn.ev.on("connection.update", conn.connectionUpdate);
    conn.ev.on("creds.update", conn.credsUpdate);

    conn.ev.on("contacts.update", (update) => {
      for (let contact of update) {
        let id = jidNormalizedUser(contact.id);
        if (store && store.contacts)
          store.contacts[id] = {
            ...(store.contacts?.[id] || {}),
            ...(contact || {}),
          };
      }
    });

    conn.ev.on("groups.update", (updates) => {
      for (const update of updates) {
        const id = update.id;
        if (store.groupMetadata[id]) {
          store.groupMetadata[id] = {
            ...(store.groupMetadata[id] || {}),
            ...(update || {}),
          };
        }
      }
    });
    isInit = false;
    return true;
  };
  setInterval(async () => {
    if (store.contacts)
      fs.writeFileSync(
        process.cwd() + `/${env.sessions}/store-contacts.json`,
        JSON.stringify(store.contacts),
      );
    store.writeToFile(process.cwd() + `/${env.sessions}/store.json`);
  }, 10 * 1000);
  global.plugins = {};
  async function scanPlugins(dir) {
    let subdirs = await fs.promises.readdir(dir);
    let files = await Promise.all(
      subdirs.map(async (subdir) => {
        let res = path.resolve(dir, subdir);
        return (await fs.promises.stat(res)).isDirectory()
          ? scanPlugins(res)
          : res;
      }),
    );
    return files.flat();
  }
  async function loadPlugins() {
    try {
      let files = await scanPlugins("./plugins");
      let plugins = {};
      for (let filename of files) {
        if (!filename.endsWith(".js")) continue;
        let pluginPath = path.resolve(filename);
        try {
          delete require.cache[require.resolve(pluginPath)];
          let plugin = require(pluginPath);
          if (
            typeof plugin !== "object" ||
            (!plugin.run &&
              typeof plugin.before !== "function" &&
              typeof plugin.all !== "function")
          ) {
            console.log(
              chalk.red.bold(`[ Error ] Invalid plugin format: ${filename}`),
            );
            continue;
          }
          plugins[filename] = plugin;
        } catch (e) {
          console.log(
            chalk.red.bold(
              `[ Error ] Failed to load plugin: ${filename}\n${e.stack}`,
            ),
          );
        }
      }
      global.plugins = plugins;
      return plugins;
    } catch (e) {
      console.error(chalk.red.bold("[ Fatal Error ] Plugin loading failed"), e);
    }
  }
  const watcher = chokidar.watch(path.resolve("./plugins"), {
    persistent: true,
    ignoreInitial: true,
  });
  watcher
    .on("add", async (filename) => reloadPlugin(filename, "added"))
    .on("change", async (filename) => reloadPlugin(filename, "updated"))
    .on("unlink", (filename) => {
      console.log(chalk.yellow.bold(`[ Delete ] Plugin Removed: ${filename}`));
      delete global.plugins[filename];
    });
  async function reloadPlugin(filename, type) {
    if (!filename.endsWith(".js")) return;
    let pluginPath = path.resolve(filename);
    console.log(
      chalk.yellow.bold(
        `[ ${type.toUpperCase()} ] Plugin ${type}: ${filename}`,
      ),
    );
    try {
      delete require.cache[require.resolve(pluginPath)];
      let plugin = require(pluginPath);
      if (
        typeof plugin !== "object" ||
        (!plugin.run &&
          typeof plugin.before !== "function" &&
          typeof plugin.all !== "function")
      ) {
        console.log(
          chalk.red.bold(`[ Error ] Invalid plugin format: ${filename}`),
        );
        return;
      }
      global.plugins[filename] = plugin;
      console.log(
        chalk.green.bold(
          `[ Success ] Plugin ${type}: ${filename}, before: ${typeof plugin.before === "function"}, all: ${typeof plugin.all === "function"}, run: ${typeof plugin.run === "function"}`,
        ),
      );
    } catch (e) {
      console.log(
        chalk.red.bold(
          `[ Error ] Failed to reload plugin: ${filename}\n${e.stack}`,
        ),
      );
    }
  }
  const resetLimit = async () => {
    const setting = global.db.setting;
    try {
      const Makassar = new Date(
        new Date().toLocaleString("en-US", { timeZone: process.env.Server }),
      );
      setting.lastReset = new Date().getTime();
      global.db.users
        .filter((v) => v.limit < env.limit && !v.premium)
        .forEach((v) => (v.limit = env.limit));
      Object.values(global.db.statistic).forEach((v) => (v.today = 0));
      Object.values(global.db.users).forEach((v) => (v.daily = false));
      await conn.reply(
        env.official,
        `*[ Auto Information ]*\nLimit pengguna gratis telah di reset.`,
      );
      console.log("Limit telah direset pada jam 12 malam");
    } catch (e) {
      console.log("Terjadi kesalahan saat mereset limit:", e);
    }
  };
  const msToMidnight = () => {
    const Makassar = new Date(
      new Date().toLocaleString("en-US", { timeZone: process.env.Server }),
    );
    const midnight = new Date(Makassar);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime() - Makassar.getTime();
  };
  const scheduleReset = () => {
    const waitTime = msToMidnight();
    setTimeout(() => {
      resetLimit();
      scheduleReset();
    }, waitTime);
  };
  loadPlugins();
  scheduleReset();
  reloadHandler();
})();
