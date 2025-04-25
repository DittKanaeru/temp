const moment = require("moment-timezone");

module.exports = {
  help: ["daftar <nama.nomor/umur>"],
  tags: ["misc"],
  command: ["daftar", "reg", "register"],
  run: async (m, { conn, users, text, env, usedPrefix, command }) => {
    conn.otp = conn.otp || {}; // Menginisialisasi conn.otp jika undefined
    const machine = new (require(
      process.cwd() + "/lib/system/database/localdb",
    ))(env.database);

    if (users.register) return m.reply("❌ Kamu sudah terdaftar.");
    if (!text.includes(".")) {
      return m.reply(
        `⚠️ Format salah! Gunakan salah satu format berikut:\n\n✅ *${usedPrefix + command} nama.nomor* (contoh: Amicy.6281234567890)\n✅ *${usedPrefix + command} nama.umur* (contoh: Amicy.20)`,
      );
    }

    let [name, data] = text.split(".").map((v) => v.trim());
    if (!name) return m.reply("⚠️ Nama tidak boleh kosong.");

    if (/^\d+$/.test(data)) {
      // Mengecek apakah data berupa angka
      if (data.length >= 10) {
        // Jika data adalah nomor
        let otp = Math.floor(100000 + Math.random() * 900000); // Membuat kode OTP acak
        conn.otp[m.sender] = { otp, number: data, type: "nomor", name };

        m.reply(
          `📩 *Kode verifikasi telah dikirim ke Nomor @${data.split("@")[0]}*. Silakan cek private message dan selesaikan pendaftaran.`,
        );

        await conn.reply(
          data + "@s.whatsapp.net",
          `📩 *Kode OTP kamu:* *${otp}*\nGunakan kode ini untuk verifikasi pendaftaran.`,
          m,
        );
        return;
      } else {
        // Jika data adalah umur
        let id = "Amicy-" + Math.random().toString(36).slice(2, 10);
        users.register = true;
        users.name = name;
        users.age = data;
        users.regTime = Date.now();
        users.sn = id;

        await machine.save(global.db);

        return m.reply(
          `✅ *Pendaftaran Berhasil!*\n\n👤 Nama: ${name}\n🎂 Umur: ${data}\n🆔 ID: ${id}\n🕒 Waktu: ${moment.tz(Date.now(), "Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss")}\n\n⚠️ *Tidak ada hadiah untuk pendaftaran dengan nama & umur.*`,
        );
      }
    } else {
      return m.reply(
        `⚠️ Format salah! Gunakan salah satu format berikut:\n\n✅ *${usedPrefix + command} nama.nomor* (contoh: Amicy.6281234567890)\n✅ *${usedPrefix + command} nama.umur* (contoh: Amicy.20)`,
      );
    }
  },

  before: async (m, { conn, users, Func }) => {
    conn.otp = conn.otp || {}; // Menginisialisasi conn.otp jika undefined
    if (!m.text || !conn.otp[m.sender]) return;

    let { otp, number, type, name } = conn.otp[m.sender];
    if (m.text.trim() === otp.toString()) {
      const machine = new (require(
        process.cwd() + "/lib/system/database/localdb",
      ))("database");
      let id = "Rk-" + Func.makeId(5);

      users.register = true;
      users.sn = id;
      users.regTime = Date.now();
      users.name = name;
      if (type === "nomor") users.number = number;

      let yuan = Func.randomInt(1000, 10000);
      let limit = Func.randomInt(10, 100);
      users.yuan = yuan;
      users.limit = limit;

      await machine.save(global.db);

      conn.reply(
        m.chat,
        `✅ *Verifikasi Berhasil!*\n\n👤 Nama: ${name}\n📱 Nomor: ${number}\n🆔 ID: ${id}\n💰 Hadiah: ${yuan} yuan & ${limit} Limit\n\nTerima kasih telah mendaftar!`,
        m,
      );

      delete conn.otp[m.sender];
    }
  },
};
