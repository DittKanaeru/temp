module.exports = {
  before: async function (m, { conn, users }) {
    if (m.chat.endsWith("broadcast") || users.banned || m.isBaileys) return;
    let msg = db.msgs[m.text];
    if (!msg) return;
    let _m = conn.serializeM(
      JSON.parse(JSON.stringify(msg), (_, v) =>
        v?.type === "Buffer" && Array.isArray(v.data) ? Buffer.from(v.data) : v,
      ),
    );
    await _m.copyNForward(m.chat, true);
  },
};
