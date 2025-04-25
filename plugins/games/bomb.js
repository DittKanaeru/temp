module.exports = {
  help: ["bomb"],
  tags: ["games"],
  command: ["bomb"],
  run: async (m, { conn, env }) => {
    conn.bomb = conn.bomb || {};
    if (conn.bomb[m.chat])
      return conn.reply(
        m.chat,
        "⏳ Soal masih berlangsung!",
        conn.bomb[m.chat][0],
      );
    try {
      const bom = ["💥", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅"].sort(
        () => Math.random() - 0.5,
      );
      const number = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
      const array = bom.map((v, i) => ({
        emot: v,
        number: number[i],
        position: i + 1,
        state: false,
      }));
      let teks = `🌸  *B O M B*  🌸 \n\n`;
      teks += `Kirim angka *1* - *9* untuk membuka kotak nomor di bawah ini:\n\n`;
      teks +=
        array
          .slice(0, 3)
          .map((v) => (v.state ? v.emot : v.number))
          .join("") + "\n";
      teks +=
        array
          .slice(3, 6)
          .map((v) => (v.state ? v.emot : v.number))
          .join("") + "\n";
      teks +=
        array
          .slice(6)
          .map((v) => (v.state ? v.emot : v.number))
          .join("") + "\n\n";
      teks += `Timeout: [ *${env.timeout / 1000 / 60} menit* ]\n`;
      teks += `Apabila mendapat kotak yang berisi bom maka yuan akan dikurangi.`;
      conn.bomb[m.chat] = [
        await conn.reply(m.chat, teks, m),
        array,
        setTimeout(() => {
          let v = array.find((v) => v.emot == "💥");
          if (conn.bomb[m.chat])
            conn.reply(
              m.chat,
              `*Waktu habis!* Bom berada di kotak nomor ${v.number}.`,
              conn.bomb[m.chat][0],
            );
          delete conn.bomb[m.chat];
        }, env.timeout),
      ];
    } catch (e) {
      console.error(e);
      conn.reply(m.chat, "⚠️ Terjadi kesalahan, coba lagi nanti!", m);
    }
  },
  game: true,
  before: async (m, { conn, body, env, users, prefixes }) => {
    let yuan = users.premium
      ? Func.randomInt(100, 500)
      : Func.randomInt(env.min_reward, env.max_reward);
    let exp = Func.randomInt(200, 1000);
    conn.bomb = conn.bomb || {};
    if (!(m.chat in conn.bomb) && m.quoted && /kotak/i.test(m.quoted.text)) {
      return conn.reply(
        m.chat,
        Func.texted(
          "bold",
          `📮 Sesi telah berakhir, silakan kirim _${prefixes[0]}bomb_ untuk membuat sesi baru.`,
        ),
        m,
      );
    }
    if (m.chat in conn.bomb && !isNaN(body)) {
      let json = conn.bomb[m.chat][1].find((v) => v.position == body);
      if (!json)
        return conn.reply(
          m.chat,
          Func.texted("bold", `📮 Untuk membuka kotak, kirim angka 1 - 9`),
          m,
        );
      if (json.emot == "💥") {
        json.state = true;
        let bomb = conn.bomb[m.chat][1];
        let teks = `🌸  *B O M B*  🌸 \n\n`;
        teks +=
          bomb
            .slice(0, 3)
            .map((v) => (v.state ? v.emot : v.number))
            .join("") + "\n";
        teks +=
          bomb
            .slice(3, 6)
            .map((v) => (v.state ? v.emot : v.number))
            .join("") + "\n";
        teks +=
          bomb
            .slice(6)
            .map((v) => (v.state ? v.emot : v.number))
            .join("") + "\n\n";
        teks += `Timeout: [ *${env.timeout / 1000 / 60} menit* ]\n`;
        teks += `*Permainan selesai!* Kotak berisi bom terbuka: (- *${Func.formatNumber(yuan)}*)`;
        conn.reply(m.chat, teks, m).then(() => {
          users.yuan += yuan;
          users.exp += exp;
          clearTimeout(conn.bomb[m.chat][2]);
          delete conn.bomb[m.chat];
        });
      } else if (json.state) {
        return conn.reply(
          m.chat,
          Func.texted(
            "bold",
            `📮 Kotak ${json.number} sudah dibuka, silakan pilih kotak yang lain.`,
          ),
          m,
        );
      } else {
        json.state = true;
        let changes = conn.bomb[m.chat][1];
        let open = changes.filter((v) => v.state && v.emot != "💥").length;
        if (open >= 8) {
          let teks = `🌸  *B O M B*  🌸 \n\n`;
          teks += `Kirim angka *1* - *9* untuk membuka kotak nomor di bawah ini:\n\n`;
          teks +=
            changes
              .slice(0, 3)
              .map((v) => (v.state ? v.emot : v.number))
              .join("") + "\n";
          teks +=
            changes
              .slice(3, 6)
              .map((v) => (v.state ? v.emot : v.number))
              .join("") + "\n";
          teks +=
            changes
              .slice(6)
              .map((v) => (v.state ? v.emot : v.number))
              .join("") + "\n\n";
          teks += `Timeout: [ *${env.timeout / 1000 / 60} menit* ]\n`;
          teks += `*Permainan selesai!* Kotak berisi bom tidak terbuka: (+ *${Func.formatNumber(yuan)}*)`;
          conn.reply(m.chat, teks, m).then(() => {
            users.yuan += yuan;
            clearTimeout(conn.bomb[m.chat][2]);
            delete conn.bomb[m.chat];
          });
        } else {
          let teks = `🌸  *B O M B*  🌸 \n\n`;
          teks += `Kirim angka *1* - *9* untuk membuka kotak nomor di bawah ini:\n\n`;
          teks +=
            changes
              .slice(0, 3)
              .map((v) => (v.state ? v.emot : v.number))
              .join("") + "\n";
          teks +=
            changes
              .slice(3, 6)
              .map((v) => (v.state ? v.emot : v.number))
              .join("") + "\n";
          teks +=
            changes
              .slice(6)
              .map((v) => (v.state ? v.emot : v.number))
              .join("") + "\n\n";
          teks += `Timeout: [ *${env.timeout / 1000 / 60} menit* ]\n`;
          teks += `Kotak berisi bom tidak terbuka: (+ *${Func.formatNumber(yuan)}*)`;
          conn.reply(m.chat, teks, m).then(() => {
            users.yuan += yuan;
          });
        }
      }
    }
  },
};
