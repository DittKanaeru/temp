module.exports = {
  help: ["market"],
  tags: ["rpg"],
  command: ["market"],
  register: true,
  group: true,
  run: async (m, { conn, text, machine, users, args, usedPrefix, command }) => {
    try {
      const store = {
        kayu: { price: 5 },
        batu: { price: 10 },
        pickaxe: { price: 300 },
      };

      const formatYuan = (num) => {
        return num >= 1000
          ? (num / 1000).toFixed(1).replace(/\.0$/, "") + "k"
          : num;
      };

      const subcmd = args[0]?.toLowerCase();
      const item = args[1]?.toLowerCase();
      const amountArg = args[2];

      if (!subcmd || subcmd === "list") {
        let text =
          "*♝ Market List ♝*\n\n> Example : .market buy <item> <jumlah> / .market sell <item> <jumlah>\n\n━─┈────────────┈─━\n";
        for (let key in store) {
          const buy = store[key].price;
          const sell = Math.floor(buy * 0.6);
          text += `♜ *${key}*\n*Harga Beli:* ${formatYuan(buy)} yuan\n*Harga Jual:* ${formatYuan(sell)} yuan\n\n`;
        }
        return m.reply(text.trim());
      }

      if (!["buy", "sell"].includes(subcmd))
        return m.reply(
          "🚩 Subcommand tidak dikenal. Gunakan `.market buy`, `.market sell`, atau `.market list`",
        );

      if (!item || !store[item])
        return m.reply("🚩 Item tidak ditemukan di market.");

      const price = store[item].price;
      const isTool = ["pedang", "pancing", "pickaxe"].includes(item);
      let amount =
        amountArg === "all"
          ? subcmd === "buy"
            ? Math.floor(users.yuan / price)
            : users[item] || 0
          : parseInt(amountArg);

      if (!amount || isNaN(amount) || amount <= 0)
        return m.reply("🚩 Masukkan jumlah yang valid.");
      if (isTool) amount = 1;

      if (subcmd === "buy") {
        if (isTool && users[item] >= 1)
          return m.reply(
            `🚩 Kamu sudah memiliki ${item}, tidak bisa membeli lagi.`,
          );

        let total = price * amount;

        // Diskon
        if (amount >= 50) {
          total *= 0.85;
        } else if (amount >= 12) {
          total *= 0.9;
        }

        total = Math.floor(total);

        if (users.yuan < total) return m.reply("🚩 Yuan kamu tidak cukup.");
        users.yuan -= total;
        users[item] = (users[item] || 0) + amount;

        return m.reply(
          `✅ Kamu membeli *${amount}* ${item} seharga *${formatYuan(total)}* yuan!`,
        );
      }

      if (subcmd === "sell") {
        if (!users[item] || users[item] < amount)
          return m.reply(`🚩 Kamu tidak memiliki cukup ${item} untuk dijual.`);

        const sellPrice = Math.floor(price * 0.6);
        const total = sellPrice * amount;

        users.yuan += total;
        users[item] -= amount;

        return m.reply(
          `✅ Kamu menjual *${amount}* ${item} dan mendapatkan *${formatYuan(total)}* yuan!`,
        );
      }

      await machine.save(global.db);
    } catch (e) {
      conn.reply(m.chat, Func.jsonFormat(e), m);
    }
  },
  register: true,
};
