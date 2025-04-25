module.exports = {
  help: ["tebakjenaka"],
  tags: ["games"],
  command: ["tebakjenaka", "jenakaclue", "jenakaskip"],
  run: async (m, { conn, env, command, usedPrefix }) => {
    conn.tebakjenaka = conn.tebakjenaka || {};
    if (command === "jenakaclue") {
      if (!conn.tebakjenaka[m.chat])
        return conn.reply(m.chat, "❌ Tidak ada soal aktif!", m);
      let ans = conn.tebakjenaka[m.chat][1]?.jawaban?.trim();
      if (!ans) return conn.reply(m.chat, "⚠️ Clue tidak tersedia!", m);
      let clue = ans.replace(/[AIUEOaiueo]/g, "_");
      return conn.reply(
        m.chat,
        `💡 *Clue:* ${clue}`,
        conn.tebakjenaka[m.chat][0],
      );
    }
    if (command === "jenakaskip") {
      if (!conn.tebakjenaka[m.chat])
        return conn.reply(m.chat, "❌ Tidak ada soal yang perlu di-skip!", m);
      let ans = conn.tebakjenaka[m.chat][1]?.jawaban;
      if (!ans) return conn.reply(m.chat, "⚠️ Soal tidak valid!", m);
      conn.reply(
        m.chat,
        `⚠️ *Soal di-skip!*\n\n📖 *Jawaban:* ${ans}`,
        conn.tebakjenaka[m.chat][0],
      );
      delete conn.tebakjenaka[m.chat];
      return;
    }
    if (conn.tebakjenaka[m.chat])
      return conn.reply(
        m.chat,
        "⏳ Soal masih berlangsung!",
        conn.tebakjenaka[m.chat][0],
      );
    try {
      let json = await Func.fetchJson(
        "https://raw.githubusercontent.com/Dwi-Merajah/Database-Public/main/games/tebakjenaka.json",
      );
      if (!json || json.length === 0) return m.reply("Data kosong!");
      let { pertanyaan, jawaban } = Func.random(json).result;
      if (!pertanyaan || !jawaban) return m.reply("Gagal memuat pertanyaan!");
      let teks = `🌸  *T E B A K - J E N A K A*  🌸 \n\n`;
      teks += `${pertanyaan}\n\n`;
      teks += `Waktu: [ *${(env.timeout / 1000).toFixed(0)} detik* ]\n`;
      teks += `Reply pesan ini untuk menjawab.\n`;
      teks += `Ketik *${usedPrefix}jenakaclue* untuk bantuan dan *${usedPrefix}jenakaskip* untuk melewati soal.`;
      conn.tebakjenaka[m.chat] = [
        await conn.reply(m.chat, teks, m),
        { jawaban },
        setTimeout(() => {
          if (conn.tebakjenaka[m.chat]) {
            conn.reply(
              m.chat,
              `⏰ *Waktu habis!*\n\n📖 *Jawaban:* ${jawaban}`,
              conn.tebakjenaka[m.chat][0],
            );
            delete conn.tebakjenaka[m.chat];
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
    conn.tebakjenaka = conn.tebakjenaka || {};
    if (!m.quoted || m.quoted.sender !== conn.decodeJid(conn.user.id)) return;
    if (!conn.tebakjenaka[m.chat] && /jenakaclue/i.test(m.quoted.text))
      return conn.reply(
        m.chat,
        Func.texted(
          "bold",
          `📮 Soal tersebut telah berakhir, silahkan kirim _${prefixes[0]}tebakjenaka_ untuk mendapatkan soal baru.`,
        ),
        m,
      );
    if (m.quoted && /jenakaclue/i.test(m.quoted.text)) {
      let gameData = conn.tebakjenaka[m.chat];
      let correctAnswer = gameData[1]?.jawaban?.toLowerCase().trim();
      if (!correctAnswer) return;
      let userAnswer = m.text.toLowerCase().trim();
      if (userAnswer === correctAnswer) {
        let teks = `*Correct answer!* `;
        teks += `You earned *+${Func.formatNumber(yuan)}* yuan & *+${Func.formatNumber(exp)}* exp\n`;
        teks += `send .tebakjenaka to play again.`;
        m.reply(teks).then(() => {
          users.yuan += yuan;
          users.exp += exp;
          clearTimeout(gameData[2]);
          delete conn.tebakjenaka[m.chat];
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
