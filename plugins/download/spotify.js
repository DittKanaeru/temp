const axios = require("axios");

module.exports = {
  help: ["spotify"].map((cmd) => cmd + " <query/url>"),
  tags: ["download"],
  command: ["spotify"],
  run: async (m, { conn, usedPrefix, command, args, text, env }) => {
    try {
      global.spotify = global.spotify || [];
      const check = global.spotify.find((v) => v.jid === m.sender);

      if (!args || !args[0]) {
        return conn.reply(
          m.chat,
          Func.example(
            usedPrefix,
            command,
            "https://open.spotify.com/track/6cHCixTkEFATjcu5ig8a7I",
          ),
          m
        );
      }

      conn.sendReact(m.chat, "🕒", m.key);

      let input = args.join(" ").trim();
      let isUrl = /^(https?:\/\/[^\s]+)$/.test(input);

      // 🔥 Pindahkan ini ke atas: kalau user ketik angka + ada sesi -> langsung download
      if (check && !isNaN(input)) {
        if (Number(input) > check.results.length) {
          return m.reply(Func.texted("bold", `📮 Melebihi jumlah data.`));
        }
        const url = check.results[Number(input) - 1];

        let download = await axios.get(`https://api.apigratis.tech/downloader/spotify?url=${encodeURIComponent(url)}`);
        let downloadData = download.data;

        if (!downloadData.status) {
          return m.reply(Func.texted("bold", "❌ Gagal mengambil lagu. Coba lagi."));
        }

        let song = downloadData.result;

        let caption = `🌸  *S P O T I F Y*\n\n`;
        caption += `	◦  *Title* : ${song.title}\n`;
        caption += `	◦  *Artist* : ${song.artist}\n`;
        caption += `	◦  *Source* : ${url}\n\n`;
        caption += env.footer;

        await conn.sendMessageModify(m.chat, caption, m, {
          largeThumb: true,
          thumbnailUrl: song.image,
        });
        await conn.sendFile(m.chat, song.url, `${song.title}.mp3`, "", m, null, {
          mimetype: "audio/mpeg",
          fileName: `${song.title}.mp3`,
          asDocument: false,
        });
        return; // ❗ Penting: selesai sampai sini, jangan lanjut search lagi
      }

      // Kalau bukan angka + session, baru lanjut cek URL atau search baru
      let url;
      if (isUrl) {
        url = input;
      } else {
        let search = await axios.get(`https://api.suraweb.online/search/spotify?q=${encodeURIComponent(input)}`);
        let searchData = search.data;

        if (!searchData.tracks || !searchData.tracks.length) {
          return m.reply(Func.texted("bold", "❌ Tidak ditemukan hasil untuk pencarian tersebut."));
        }

        let trackList = searchData.tracks.map((v) => v.link);

        if (!check) {
          global.spotify.push({
            jid: m.sender,
            results: trackList,
            created_at: new Date() * 1,
          });
        } else {
          check.results = trackList;
        }

        let p = `Untuk mendapatkan lagu gunakan perintah ini *${usedPrefix + command} nomor*\n`;
        p += `*Example:* ${usedPrefix + command} 1\n\n`;
        searchData.tracks.forEach((v, i) => {
          p += `*${i + 1}*. ${v.name}\n`;
          p += `◦ *Artists:* ${v.artists}\n`;
          p += `◦ *Duration:* ${v.duration} ms\n\n`;
        });
        p += env.footer;
        return m.reply(p);
      }

      // Kalau input awal adalah url track langsung, download
      if (!url.includes("open.spotify.com/track")) {
        return m.reply(Func.texted("bold", "❌ URL tidak valid. Pastikan link Spotify Track."));
      }

      let download = await axios.get(`https://api.apigratis.tech/downloader/spotify?url=${encodeURIComponent(url)}`);
      let downloadData = download.data;

      if (!downloadData.status) {
        return m.reply(Func.texted("bold", "❌ Gagal mengambil lagu. Coba lagi."));
      }

      let song = downloadData.result;

      let caption = `🌸  *S P O T I F Y*\n\n`;
      caption += `	◦  *Title* : ${song.title}\n`;
      caption += `	◦  *Artist* : ${song.artist}\n`;
      caption += `	◦  *Source* : ${url}\n\n`;
      caption += env.footer;

      await conn.sendMessageModify(m.chat, caption, m, {
        largeThumb: true,
        thumbnailUrl: song.image,
      });
      await conn.sendFile(m.chat, song.url, `${song.title}.mp3`, "", m, null, {
        mimetype: "audio/mpeg",
        fileName: `${song.title}.mp3`,
        asDocument: false,
      });

    } catch (e) {
      console.log(e);
      return conn.reply(m.chat, Func.jsonFormat(e), m);
    }
  },
  register: true,
  limit: true,
};
