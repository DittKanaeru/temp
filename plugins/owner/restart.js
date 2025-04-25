module.exports = {
  help: ["restart"],
  tags: ["owner"],
  command: ["restart"],
  run: async (m, { conn, env }) => {
    const machine = new (require(
      process.cwd() + "/lib/system/database/localdb",
    ))(env.database);
    await conn.reply(m.chat, "*Restarting . . .*", m).then(async () => {
      await machine.save();
      process.send("reset");
    });
  },
  owner: true,
};
