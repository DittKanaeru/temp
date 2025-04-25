module.exports = {
  help: ["tebakanime"],
  tags: ["games"],
  command: ["tebakanime", "animeclue", "animeskip"],
  run: async (m, { conn, env, command, usedPrefix }) => {
    conn.tebakanime = conn.tebakanime || {};
    if (command === "animeclue") {
      if (!conn.tebakanime[m.chat])
        return conn.reply(m.chat, "❌ Tidak ada soal aktif!", m);
      let ans = conn.tebakanime[m.chat][1]?.jawaban?.trim();
      if (!ans) return conn.reply(m.chat, "⚠️ Clue tidak tersedia!", m);
      let clue = ans.replace(/[AIUEOaiueo]/g, "_");
      return conn.reply(
        m.chat,
        `💡 *Clue:* ${clue}`,
        conn.tebakanime[m.chat][0],
      );
    }
    if (command === "animeskip") {
      if (!conn.tebakanime[m.chat])
        return conn.reply(m.chat, "❌ Tidak ada soal yang perlu di-skip!", m);
      let ans = conn.tebakanime[m.chat][1]?.jawaban;
      if (!ans) return conn.reply(m.chat, "⚠️ Soal tidak valid!", m);
      conn.reply(
        m.chat,
        `⚠️ *Soal di-skip!*\n\n📖 *Jawaban:* ${ans}`,
        conn.tebakanime[m.chat][0],
      );
      delete conn.tebakanime[m.chat];
      return;
    }
    if (conn.tebakanime[m.chat])
      return conn.reply(
        m.chat,
        "⏳ Soal masih berlangsung!",
        conn.tebakanime[m.chat][0],
      );
    try {
      let json = await Func.fetchJson(
        "https://raw.githubusercontent.com/Dwi-Merajah/Database-Public/main/games/tebakanime.json",
      );
      if (!json || json.length === 0) return m.reply("Data kosong!");
      let { img: soal, jawaban } = Func.random(json);
      if (!soal || !jawaban) return m.reply("Gagal memuat soal!");
      let teks = `🌸  *T E B A K - A N I M E*  🌸 \n\n`;
      teks += `Waktu: [ *${(env.timeout / 1000).toFixed(0)} detik* ]\n`;
      teks += `Reply pesan ini untuk menjawab.\n`;
      teks += `Ketik *${usedPrefix}animeclue* untuk bantuan dan *${usedPrefix}animeskip* untuk melewati soal.`;
      conn.tebakanime[m.chat] = [
        await conn.sendFile(m.chat, soal, "", teks, m),
        { jawaban },
        setTimeout(() => {
          if (conn.tebakanime[m.chat]) {
            conn.reply(
              m.chat,
              `⏰ *Waktu habis!*\n\n📖 *Jawaban:* ${jawaban}`,
              conn.tebakanime[m.chat][0],
            );
            delete conn.tebakanime[m.chat];
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
    conn.tebakanime = conn.tebakanime || {};
    if (!m.quoted || m.quoted.sender !== conn.decodeJid(conn.user.id)) return;
    if (!conn.tebakanime[m.chat] && /animeclue/i.test(m.quoted.text))
      return conn.reply(
        m.chat,
        Func.texted(
          "bold",
          `📮 Soal tersebut telah berakhir, silahkan kirim _${prefixes[0]}tebakanime_ untuk mendapatkan soal baru.`,
        ),
        m,
      );
    if (m.quoted && /animeclue/i.test(m.quoted.text)) {
      let gameData = conn.tebakanime[m.chat];
      let correctAnswer = gameData[1]?.jawaban?.toLowerCase().trim();
      if (!correctAnswer) return;
      let userAnswer = m.text.toLowerCase().trim();
      if (userAnswer === correctAnswer) {
        let teks = `*Correct answer!* `;
        teks += `You earned *+${Func.formatNumber(yuan)}* yuan & *+${Func.formatNumber(exp)}* exp\n`;
        teks += `send .tebakanime to play again.`;
        m.reply(teks).then(() => {
          users.yuan += yuan;
          users.exp += exp;
          clearTimeout(gameData[2]);
          delete conn.tebakanime[m.chat];
        });
      } else if (Func.similarity(userAnswer, correctAnswer, 0.72)) {
        conn.reply(m.chat, "🔍 Dikit lagi.. coba lagi!", m);
      } else {
        let penalty = Math.min(users.yuan || 0, yuan);
        users.yuan = Math.max(0, (users.yuan || 0) - penalty);
        conn.reply(
          m.chat,
          `❌ Jawaban salah!\n*-${Func.formatNumber(penalty)} yuan*`,
          m,
        );
      }
    }
  },
};
