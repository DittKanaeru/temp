const fs = require("fs");

module.exports = {
  help: ["sf", "df"].map((cmd) => cmd + " <filename>"),
  tags: ["owner"],
  command: ["sf", "df"],
  run: async (m, { usedPrefix, command, text }) => {
    const pluginPath = process.cwd() + "/plugins/";
    const ListFolders = fs
      .readdirSync(pluginPath)
      .filter((f) => fs.statSync(pluginPath + f).isDirectory());
    const folderList = ListFolders.map((f, i) => `*${i + 1}.* ${f}`).join("\n");
    const example = `*• Example:* ${usedPrefix + command} [foldernumber/foldername],[filename] atau hanya [filename]\n\n*• List Folders (${ListFolders.length} folders):*\n${folderList}`;

    if (!text) return m.reply(example);

    let folderInput, fileName;
    if (text.includes(",")) {
      [folderInput, fileName] = text.split(",").map((v) => v.trim());
    } else {
      fileName = text.trim();
    }

    if (!fileName) return m.reply(example);
    let targetFolder = folderInput
      ? isNaN(folderInput)
        ? folderInput
        : ListFolders[folderInput - 1]
      : "";
    let basePath = targetFolder ? `${pluginPath + targetFolder}/` : pluginPath;
    if (folderInput && !targetFolder)
      return m.reply(`❌ Folder tidak ditemukan!\n\n${example}`);
    let filePath = `${basePath}${fileName}.js`;
    if (command === "sf") {
      if (!m.quoted?.text) return m.reply(`Balas pesan yang ingin disimpan!`);
      try {
        fs.writeFileSync(filePath, m.quoted.text);
        m.reply(
          `✅ File berhasil disimpan${fs.existsSync(filePath) ? " (ditimpa)" : ""} di:\n*${filePath}*`,
        );
      } catch (err) {
        m.reply(`❌ Gagal menyimpan file: ${err.message}`);
      }
    } else if (command === "df") {
      if (!fs.existsSync(filePath))
        return m.reply(
          `File *${fileName}.js* tidak ditemukan${targetFolder ? ` di folder *${targetFolder}*` : ""}!`,
        );
      try {
        fs.unlinkSync(filePath);
        m.reply(
          `✅ File *${fileName}.js* berhasil dihapus${targetFolder ? ` dari folder *${targetFolder}*` : ""}!`,
        );
      } catch (err) {
        m.reply(`❌ Gagal menghapus file: ${err.message}`);
      }
    }
  },
  owner: true,
};
