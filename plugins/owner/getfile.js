const fs = require("fs");

module.exports = {
  help: ["gp"].map((a) => a + " <filename>"),
  tags: ["owner"],
  command: ["gp", "getplugins"],
  run: async (m, { usedPrefix, command, text }) => {
    const pluginPath = process.cwd() + "/plugins/";
    const ListPlugins = Object.keys(plugins).map(
      (p) => p.split("/plugins/")[1],
    );
    const pluginList = ListPlugins.map((p, i) => `*${i + 1}.* ${p}`).join("\n");
    const example = `*• Example:* ${usedPrefix + command} [filename/number]\n*• List Plugins (${ListPlugins.length} files):*\n${pluginList}`;
    if (!text) return m.reply(example);
    let targetFile = isNaN(text) ? text : ListPlugins[text - 1];
    if (!targetFile || !fs.existsSync(pluginPath + targetFile))
      return m.reply(example);
    m.reply(fs.readFileSync(pluginPath + targetFile).toString());
  },
  owner: true,
};
