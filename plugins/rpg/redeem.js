const parseDuration = (str) => {
  const match = str.match(/(\d+)\s*(menit|jam|hari)/i);
  if (!match) return 0;
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "menit") return value * 60 * 1000;
  if (unit === "jam") return value * 60 * 60 * 1000;
  if (unit === "hari") return value * 24 * 60 * 60 * 1000;
  return 0;
};

module.exports = {
  help: [
    "redeem <kode>",
    "redeem add <kode> <item> <jumlah>|...",
    "redeem set <kode> <limit> | <durasi>",
    "redeem del <kode>",
  ],
  tags: ["rpg"],
  command: ["redeem"],
  group: true,
  register: true,
  run: async (m, { args, text }) => {
    const users = global.db.users;
    const user = users.find((u) => u.jid === m.sender);
    if (!user) return m.reply("🚩 Data pengguna tidak ditemukan.");

    global.db.redeem ??= {};

    const ownerNumber = "6285950723074@s.whatsapp.net";
    const [cmd, ...rest] = args;

    if (!cmd) {
      return m.reply(
        `🎟️ *REDEEM SYSTEM* 🎟️

Gunakan:
- *.redeem <kode>* → untuk menukarkan hadiah`,
      );
    }

    const code = cmd.toLowerCase();

    // ➡️ ADD KODE
    if (code === "--add") {
      if (m.sender !== ownerNumber)
        return m.reply("🚫 Hanya pemilik yang bisa menambahkan kode.");

      const kode = rest[0];
      const entries = rest.slice(1).join(" ").split("|");

      if (!kode || entries.length === 0)
        return m.reply(
          `⚠️ Format salah!

Contoh:
.redeem add rk-pemula yuan 30000|iron 10
`,
        );

      const items = {};
      for (const part of entries) {
        const [item, val] = part.trim().split(" ");
        if (!item || isNaN(val))
          return m.reply(`❌ Format item salah di bagian: ${part}`);
        const normalizedItem =
          item.toLowerCase() === "yen" ? "yuan" : item.toLowerCase();
        items[normalizedItem] = parseInt(val);
      }

      global.db.redeem[kode] = {
        items,
        users: [],
        expired: null,
      };

      return m.reply(
        `✅ Berhasil membuat kode *${kode}*:\n` +
          Object.entries(items)
            .map(([k, v]) => `- ${k}: ${v}`)
            .join("\n"),
      );
    }

    // ➡️ SET EXPIRATION
    if (code === "--set") {
      if (m.sender !== ownerNumber)
        return m.reply("🚫 Hanya pemilik yang bisa mengatur masa berlaku.");

      const kode = rest[0];
      const limitInfo = rest
        .slice(1)
        .join(" ")
        .split("|")
        .map((v) => v.trim());

      if (!kode || limitInfo.length < 2)
        return m.reply(
          `⚠️ Format salah!

Contoh:
.redeem set rk-pemula 40 | 2 jam
`,
        );

      if (!global.db.redeem[kode]) return m.reply("❌ Kode tidak ditemukan.");

      const durasi = parseDuration(limitInfo[1]);
      if (!durasi)
        return m.reply(
          '⚠️ Format waktu salah. Gunakan contoh seperti "2 jam", "30 menit", "1 hari".',
        );

      global.db.redeem[kode].expired = Date.now() + durasi;

      return m.reply(
        `✅ Kode *${kode}* berhasil diset masa aktif *${limitInfo[1]}*.`,
      );
    }

    // ➡️ DELETE KODE
    if (code === "--del") {
      if (m.sender !== ownerNumber)
        return m.reply("🚫 Hanya pemilik yang bisa menghapus kode.");

      const kode = rest[0];
      if (!kode || !global.db.redeem[kode])
        return m.reply("❌ Kode tidak ditemukan.");

      delete global.db.redeem[kode];

      return m.reply(`✅ Kode *${kode}* berhasil dihapus.`);
    }

    // ➡️ REDEEM KODE
    const data = global.db.redeem[code];

    if (!data)
      return m.reply(
        `🔐 Kode tidak valid atau belum tersedia.

Gunakan format:
.redeem <kode>
Contoh:
.redeem rk-pemula
`,
      );

    if (data.users.includes(m.sender))
      return m.reply("⚠️ Kamu sudah pernah menukarkan kode ini.");
    if (data.expired && Date.now() > data.expired)
      return m.reply("⏰ Kode ini sudah kadaluarsa.");

    const log = [];
    for (const [item, val] of Object.entries(data.items)) {
      user[item] = (user[item] || 0) + val;
      log.push(`- ${item}: +${val}`);
    }

    data.users.push(m.sender);

    m.reply(`🎁 *Redeem Berhasil!*\n\nKamu menerima:\n${log.join("\n")}`);
  },
};
