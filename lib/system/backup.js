const fs = require("fs");
const path = require("path");
const env = require(process.cwd() + "/config.json");

module.exports = class Session {
  constructor() {
    this.init();
  }

  init() {
    const backup = `./${env.sessions}_backup`;
    if (!fs.existsSync(backup)) {
      fs.mkdirSync(backup);
    }
  }

  async backups(conn, session) {
    try {
      const users = conn.user.id;
      const backup = path.join(
        `./${env.sessions}_backup`,
        conn.decodeJid(users).replace(/@.+/, ""),
      );
      const source = path.join(session, "creds.json");
      await Func.delay(1500);
      if (fs.existsSync(source)) {
        if (!fs.existsSync(backup)) {
          fs.mkdirSync(backup);
        }
        const data = require(source);
        fs.writeFileSync(path.join(backup, "creds.json"), JSON.stringify(data));
      }
    } catch (error) {
      console.error("Error during session backup");
    }
  }

  async restore(conn, session) {
    try {
      const users = conn.user.id;
      const backup = path.join(
        `./${env.sessions}_backup`,
        conn.decodeJid(users).replace(/@.+/, ""),
        "creds.json",
      );
      const creds = path.join(session, "creds.json");
      await Func.delay(1500);
      if (fs.existsSync(backup)) {
        const data = require(backup);
        fs.writeFileSync(creds, JSON.stringify(data));
      } else {
        console.log("No backup found for restoration.");
      }
    } catch (error) {
      console.error("Error during session restoration");
    }
  }

  isBackupExist(conn) {
    try {
      const users = conn.user.id;
      const backup = path.join(
        `./${env.sessions}_backup`,
        conn.decodeJid(users).replace(/@.+/, ""),
        "creds.json",
      );
      return fs.existsSync(backup);
    } catch (error) {
      return false;
    }
  }
};
