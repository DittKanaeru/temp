module.exports = {
  help: ["family100"],
  tags: ["games"],
  command: ["family100", "familyskip"],
  run: async (m, { conn, env, command, usedPrefix }) => {
    conn.family100 = conn.family100 || {};
    if (command === "familyskip") {
      if (!conn.family100[m.chat])
        return conn.reply(m.chat, "Tidak ada soal yang perlu di-skip.", m);
      let ans = conn.family100[m.chat]?.jawaban;
      if (!ans) return conn.reply(m.chat, "Soal tidak valid.", m);
      conn.reply(
        m.chat,
        `Soal telah di-skip.\n\nJawaban:\n${ans.map((a, i) => `(${i + 1}) ${a}`).join("\n")}`,
        conn.family100[m.chat].message,
      );
      delete conn.family100[m.chat];
      return;
    }
    if (conn.family100[m.chat])
      return conn.reply(
        m.chat,
        "Masih ada soal yang berlangsung.",
        conn.family100[m.chat].message,
      );
    try {
      let json = await Func.fetchJson(
        "https://raw.githubusercontent.com/Dwi-Merajah/Database-Public/main/games/family100.json",
      );
      if (!json || json.length === 0) return m.reply("Data kosong.");
      let { soal, jawaban } = Func.random(json);
      if (!soal || !jawaban) return m.reply("Gagal memuat soal.");
      let teks = `🌸  *Family 100*  🌸 \n\n`;
      teks += `Soal: ${soal}\n`;
      teks += `Terdapat ${jawaban.length} jawaban.\n\n`;
      teks += `Waktu: ${(env.timeout / 1000).toFixed(0)} detik.\n`;
      teks += `Reply pesan ini untuk menjawab.\n`;
      teks += `Ketik *${usedPrefix}familyskip* untuk melewati soal.`;
      conn.family100[m.chat] = {
        message: await conn.reply(m.chat, teks, m),
        jawaban,
        ditemukan: [],
        penjawab: [],
        timeout: setTimeout(() => {
          if (conn.family100[m.chat]) {
            let teksWaktuHabis = `⏳ *Waktu habis! Berikut jawabannya:*\n\n`;
            let mentions = [];
            conn.family100[m.chat].jawaban.forEach((ans, i) => {
              let found = conn.family100[m.chat].penjawab.find(
                (p) => p.answer === ans,
              );
              if (found) {
                teksWaktuHabis += `${i + 1}. ${ans} (@${found.jid.split("@")[0]})\n`;
                mentions.push(found.jid);
              } else {
                teksWaktuHabis += `${i + 1}. ${ans}\n`;
              }
            });
            conn.reply(m.chat, teksWaktuHabis, conn.family100[m.chat].message);
            delete conn.family100[m.chat];
          }
        }, env.timeout),
      };
    } catch (e) {
      console.error(e);
      conn.reply(m.chat, "Terjadi kesalahan, coba lagi nanti.", m);
    }
  },
  game: true,
  before: async (m, { conn, env, users }) => {
    if (m.plugin || m.isCommand) return;
    conn.family100 = conn.family100 || {};
    let gameData = conn.family100[m.chat];
    if (!gameData) return;
    let userAnswer = m.text.toLowerCase().trim();
    if (gameData.ditemukan.includes(userAnswer)) {
      return conn.reply(m.chat, "Jawaban sudah ditemukan sebelumnya.", m);
    }
    let correctAnswer = gameData.jawaban.find(
      (jawaban) => jawaban.toLowerCase().trim() === userAnswer,
    );
    let similarAnswer = gameData.jawaban.find((jawaban) =>
      Func.similarity(jawaban.toLowerCase().trim(), userAnswer, 0.72),
    );
    if (correctAnswer) {
      let reward = users.premium
        ? Func.randomInt(100, 500)
        : Func.randomInt(env.min_reward, env.max_reward);
      users.yuan += reward;
      gameData.ditemukan.push(correctAnswer);
      gameData.penjawab.push({ jid: m.sender, answer: correctAnswer, reward });
      let remaining = gameData.jawaban.length - gameData.ditemukan.length;
      let response = `Benar! +${reward} yuan\n`;
      response += `Jawaban ditemukan: ${gameData.ditemukan.length}/${gameData.jawaban.length}\n\n`;
      response += `✅ *Jawaban yang ditemukan:*\n`;
      gameData.penjawab.forEach((data, i) => {
        response += `(${i + 1}) ${data.answer} - @${data.jid.split("@")[0]} (+${data.reward} yuan)\n`;
      });
      if (remaining > 0) {
        response += `\nSisa jawaban: ${remaining}\nLanjutkan menjawab!`;
      } else {
        response += `\n*Semua jawaban ditemukan!*`;
        clearTimeout(gameData.timeout);
        delete conn.family100[m.chat];
      }
      conn.reply(m.chat, response, m);
    } else if (similarAnswer) {
      conn.reply(m.chat, "Hampir benar! Coba sedikit lagi.", m);
    }
  },
};
