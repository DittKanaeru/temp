module.exports = {
  help: ["tebaklagu"],
  tags: ["games"],
  command: ["tebaklagu", "laguclue", "laguskip"],
  run: async (m, { conn, env, command, usedPrefix }) => {
    conn.tebaklagu = conn.tebaklagu || {};
    if (command === "laguclue") {
      if (!conn.tebaklagu[m.chat])
        return conn.reply(m.chat, "❌ Tidak ada soal aktif!", m);
      let ans = conn.tebaklagu[m.chat][1]?.jawaban?.trim();
      if (!ans) return conn.reply(m.chat, "⚠️ Clue tidak tersedia!", m);
      let clue = ans.replace(/[AIUEOaiueo]/g, "_");
      return conn.reply(
        m.chat,
        `💡 *Clue:* ${clue}`,
        conn.tebaklagu[m.chat][0],
      );
    }
    if (command === "laguskip") {
      if (!conn.tebaklagu[m.chat])
        return conn.reply(m.chat, "❌ Tidak ada soal yang perlu di-skip!", m);
      let ans = conn.tebaklagu[m.chat][1]?.jawaban;
      if (!ans) return conn.reply(m.chat, "⚠️ Soal tidak valid!", m);
      conn.reply(
        m.chat,
        `⚠️ *Soal di-skip!*\n\n📖 *Jawaban:* ${ans}`,
        conn.tebaklagu[m.chat][0],
      );
      delete conn.tebaklagu[m.chat];
      return;
    }
    if (conn.tebaklagu[m.chat])
      return conn.reply(
        m.chat,
        "⏳ Soal masih berlangsung!",
        conn.tebaklagu[m.chat][0],
      );
    try {
      let json = await Func.fetchJson(
        "https://raw.githubusercontent.com/Dwi-Merajah/Database-Public/main/games/tebaklagu.json",
      );
      if (!json || json.length === 0) return m.reply("Data kosong!");
      let { artis: soal, jawaban, lagu } = Func.random(json);
      if (!soal || !jawaban || !lagu) return m.reply("Gagal memuat soal!");
      let teks = `🌸  *T E B A K - L A G U*  🌸 \n\n`;
      teks += `Artis: ${soal}\n\n`;
      teks += `Waktu: [ *${(env.timeout / 1000).toFixed(0)} detik* ]\n`;
      teks += `Reply pesan ini untuk menjawab.\n`;
      teks += `Ketik *${usedPrefix}laguclue* untuk bantuan dan *${usedPrefix}laguskip* untuk melewati soal.`;
      conn.tebaklagu[m.chat] = [
        await conn.reply(m.chat, teks, m),
        { jawaban },
        setTimeout(() => {
          if (conn.tebaklagu[m.chat]) {
            conn.reply(
              m.chat,
              `⏰ *Waktu habis!*\n\n📖 *Jawaban:* ${jawaban}`,
              conn.tebaklagu[m.chat][0],
            );
            delete conn.tebaklagu[m.chat];
          }
        }, env.timeout),
      ];
      conn.sendFile(m.chat, lagu, "", "", m, { ptt: true });
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
    conn.tebaklagu = conn.tebaklagu || {};
    if (!m.quoted || m.quoted.sender !== conn.decodeJid(conn.user.id)) return;
    if (!conn.tebaklagu[m.chat] && /laguclue/i.test(m.quoted.text))
      return conn.reply(
        m.chat,
        Func.texted(
          "bold",
          `📮 Soal tersebut telah berakhir, silahkan kirim _${prefixes[0]}tebaklagu_ untuk mendapatkan soal baru.`,
        ),
        m,
      );
    if (m.quoted && /laguclue/i.test(m.quoted.text)) {
      let gameData = conn.tebaklagu[m.chat];
      let correctAnswer = gameData[1]?.jawaban?.toLowerCase().trim();
      if (!correctAnswer) return;
      let userAnswer = m.text.toLowerCase().trim();
      if (userAnswer === correctAnswer) {
        let teks = `*Correct answer!* `;
        teks += `You earned *+${Func.formatNumber(yuan)}* yuan & *+${Func.formatNumber(exp)}* exp\n`;
        teks += `send .tebaklagu to play again.`;
        m.reply(teks).then(() => {
          users.yuan += yuan;
          users.exp += exp;
          clearTimeout(gameData[2]);
          delete conn.tebaklagu[m.chat];
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
