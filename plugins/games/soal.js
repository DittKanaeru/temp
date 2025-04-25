module.exports = {
  help: ["soal"],
  tags: ["games"],
  command: ["soal", "soalclue", "soalskip"],
  run: async (m, { conn, env, command, usedPrefix }) => {
    conn.soal = conn.soal || {};
    if (command === "soalclue") {
      if (!conn.soal[m.chat])
        return conn.reply(m.chat, "❌ Tidak ada soal aktif!", m);
      let ans = conn.soal[m.chat][1]?.jawbaan?.trim();
      if (!ans) return conn.reply(m.chat, "⚠️ Clue tidak tersedia!", m);
      let clue = ans.replace(/[AIUEOaiueo]/g, "_");
      return conn.reply(m.chat, `💡 *Clue:* ${clue}`, conn.soal[m.chat][0]);
    }
    if (command === "soalskip") {
      if (!conn.soal[m.chat])
        return conn.reply(m.chat, "❌ Tidak ada soal yang perlu di-skip!", m);
      let ans = conn.soal[m.chat][1]?.jawbaan;
      if (!ans) return conn.reply(m.chat, "⚠️ Soal tidak valid!", m);
      conn.reply(
        m.chat,
        `⚠️ *Soal di-skip!*\n\n📖 *jawaban:* ${ans}`,
        conn.soal[m.chat][0],
      );
      delete conn.soal[m.chat];
      return;
    }
    if (conn.soal[m.chat])
      return conn.reply(
        m.chat,
        "⏳ Soal masih berlangsung!",
        conn.soal[m.chat][0],
      );
    try {
      let json = await Func.fetchJson(
        "https://raw.githubusercontent.com/Dwi-Merajah/Database-Public/main/games/soal.json",
      );
      if (!json || json.length === 0) return m.reply("Data kosong!");
      let { soal, jawbaan } = Func.random(json);
      if (!soal || !jawbaan) return m.reply("Gagal memuat soal!");
      let teks = `🌸  *S O A L*  🌸 \n\n`;
      teks += `${soal}\n\n`;
      teks += `Waktu: [ *${(env.timeout / 1000).toFixed(0)} detik* ]\n`;
      teks += `Reply pesan ini untuk menjawab.\n`;
      teks += `Ketik *${usedPrefix}soalclue* untuk bantuan dan *${usedPrefix}soalskip* untuk melewati soal.`;
      conn.soal[m.chat] = [
        await conn.reply(m.chat, teks, m),
        { jawbaan },
        setTimeout(() => {
          if (conn.soal[m.chat]) {
            conn.reply(
              m.chat,
              `⏰ *Waktu habis!*\n\n📖 *jawaban:* ${jawbaan}`,
              conn.soal[m.chat][0],
            );
            delete conn.soal[m.chat];
          }
        }, env.timeout),
      ];
    } catch (e) {
      console.error(e);
      conn.reply(m.chat, "⚠️ Terjadi kesalahan, coba lagi nanti!", m);
    }
  },
  game: true,
  before: async (m, { conn, env, users, prefixes }) => {
    let yuan = users.premium
      ? Func.randomInt(100, 500)
      : Func.randomInt(env.min_reward, env.max_reward);
    let exp = Func.randomInt(200, 1000);
    conn.soal = conn.soal || {};
    if (!m.quoted || m.quoted.sender !== conn.decodeJid(conn.user.id)) return;
    if (!conn.soal[m.chat] && /soalclue/i.test(m.quoted.text))
      return conn.reply(
        m.chat,
        Func.texted(
          "bold",
          `📮 Soal tersebut telah berakhir, silahkan kirim _${prefixes[0]}soal_ untuk mendapatkan soal baru.`,
        ),
        m,
      );
    if (m.quoted && /soalclue/i.test(m.quoted.text)) {
      let gameData = conn.soal[m.chat];
      let correctAnswer = gameData[1]?.jawbaan?.toLowerCase().trim();
      if (!correctAnswer) return;
      let userAnswer = m.text.toLowerCase().trim();
      if (userAnswer === correctAnswer) {
        let teks = `*Correct answer!* `;
        teks += `You earned *+${Func.formatNumber(yuan)}* yuan & *+${Func.formatNumber(exp)}* exp\n`;
        teks += `send .soal to play again.`;
        m.reply(teks).then(() => {
          users.yuan += yuan;
          users.exp += exp;
          clearTimeout(gameData[2]);
          delete conn.soal[m.chat];
        });
      } else if (Func.similarity(userAnswer, correctAnswer, 0.72)) {
        conn.reply(m.chat, "🔍 Dikit lagi.. coba lagi!", m);
      } else {
        let penalty = Math.min(users.yuan || 0, yuan);
        users.yuan = Math.max(0, (users.yuan || 0) - penalty);
        conn.reply(
          m.chat,
          `❌ jawaban salah!\n*-${Func.formatNumber(penalty)} yuan*`,
          m,
        );
      }
    }
  },
};
