const fs = require("fs");
const path = require("path");

module.exports = {
  help: ["clearsessi"],
  tags: ["owner"],
  command: ["csessi", "clearsessi"],
  run: async (m, { conn, env }) => {
    try {
      const directory = path.join(process.cwd(), env.sessions);
      const excludeFiles = ["creds.json", "store-contacts.json", "store.json"];
      const files = await fs.promises.readdir(directory);

      const trashFiles = files.filter((file) => !excludeFiles.includes(file));

      for (const file of trashFiles) {
        const filePath = path.join(directory, file);
        await fs.promises.unlink(filePath);
      }

      await conn.reply(
        m.chat,
        `Success Delete File Trash Total: *[ ${trashFiles.length} ]*`,
        m,
      );
    } catch (err) {
      console.error("Error:", err);
      await conn.reply(
        m.chat,
        "An error occurred while clearing session trash.",
        m,
      );
    }
  },
  owner: true,
};
