const confirmationDatabase = {};

const craftingRecipes = {
  armor: { steel: 2, string: 4, iron: 6 },
  sword: { iron: 11, steel: 4 },
  pickaxe: { iron: 12, wood: 12 },
  bow: { wood: 29, string: 3, iron: 1 },
  fishingrod: { iron: 10, string: 4 },
  steel: { iron: 2, yuan: 4000 },

  wand: { wood: 10, crystal: 4 },
  dagger: { iron: 8, string: 2 },
  shield: { iron: 15, wood: 10 },
};

module.exports = {
  help: ["craft <item> <jumlah>", "crafting"],
  tags: ["rpg"],
  command: ["craft", "crafting"],
  register: true,
  group: true,

  run: async (m, { args, usedPrefix, command }) => {
    const users = global.db.users;
    const user = users.find((u) => u.jid === m.sender);
    if (!user) return m.reply("🚩 Data pengguna tidak ditemukan.");

    if (!args[0]) {
      let info = `╭━━〔 *📜 Daftar Crafting* 〕━━⬣\n`;
      info += `┃ Format: *${usedPrefix + command} [item] [jumlah]*\n`;
      info += `┃ Contoh: *${usedPrefix}${command} sword 1*\n┃\n`;
      info += `┃ ✦ List item yang bisa dibuat:\n`;
      for (const key of Object.keys(craftingRecipes)) {
        info += `┃ ∘ *${key.charAt(0).toUpperCase() + key.slice(1)}*\n`;
      }
      info += `╰━━━━━━━━━━━━━━━━━━⬣`;
      return m.reply(info);
    }

    const [item, countArg] = args;
    const itemName = item.toLowerCase();
    const total = Math.max(1, parseInt(countArg) || 1);

    if (!craftingRecipes[itemName]) {
      return m.reply(
        `❌ Item *${itemName}* tidak ditemukan. Silakan cek kembali list crafting.`,
      );
    }

    const recipe = craftingRecipes[itemName];
    const confirmKey = `${m.sender}_confirm`;

    let confirmText = `╭─❏ *[ Konfirmasi Crafting ]*\n│\n`;
    confirmText += `│ 🛠️ Item : *${itemName}*\n`;
    confirmText += `│ 🔢 Jumlah : *${total}*\n│\n`;
    confirmText += `│ 📦 *Kebutuhan Bahan*:\n`;
    for (const [res, qty] of Object.entries(recipe)) {
      confirmText += `│ ∘ ${res.charAt(0).toUpperCase() + res.slice(1)} : *${qty * total}*\n`;
    }
    confirmText += `│\n│ Balas *Iya* dalam 40 detik untuk konfirmasi.\n╰─────────────────────⬣`;

    confirmationDatabase[confirmKey] = { item: itemName, total, recipe };

    m.reply(confirmText);

    // Bikin timeout auto-cancel 40 detik
    setTimeout(() => {
      if (confirmationDatabase[confirmKey]) {
        delete confirmationDatabase[confirmKey];
        m.reply(
          "⌛ Konfirmasi crafting dibatalkan karena tidak ada jawaban dalam 40 detik.",
        );
      }
    }, 40000); // 40 detik
  },

  before: async (m) => {
    const users = global.db.users;
    const user = users.find((u) => u.jid === m.sender);
    if (!user) return;

    const confirmKey = `${m.sender}_confirm`;
    const confirmation = confirmationDatabase[confirmKey];
    if (!confirmation) return;

    const lowerText = (m.text || "").trim().toLowerCase();
    if (
      lowerText === "iya" ||
      lowerText === "y" ||
      lowerText === "konfirmasi"
    ) {
      const { item, total, recipe } = confirmation;
      const missing = Object.entries(recipe).filter(
        ([res, qty]) => (user[res] || 0) < qty * total,
      );

      if (missing.length > 0) {
        const missingText = missing
          .map(([res, qty]) => `${qty * total - (user[res] || 0)} ${res}`)
          .join(", ");
        delete confirmationDatabase[confirmKey];
        return m.reply(
          `❌ Kamu kekurangan ${missingText} untuk membuat *${item}*.`,
        );
      }

      for (const [res, qty] of Object.entries(recipe)) {
        user[res] -= qty * total;
      }

      const durability = 250;
      user[`${item}durability`] =
        (user[`${item}durability`] || 0) + durability * total;
      user[item] = (user[item] || 0) + total;
      user.craftcount = (user.craftcount || 0) + total;

      delete confirmationDatabase[confirmKey];

      return m.reply(
        `✅ *Crafting Berhasil!*\n\n🧱 Item: *${item}*\n🔢 Jumlah: *${total}*\n🛠️ Durability: *${user[`${item}durability`]}*`,
      );
    }
  },
};
