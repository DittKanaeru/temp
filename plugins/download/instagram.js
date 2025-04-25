module.exports = {
  help: ["Instagram"].map((cmd) => cmd + " <url>"),
  tags: ["download"],
  command: ["instagram", "ig"],
  run: async (m, { conn, usedPrefix, command, args, Func }) => {
    try {
      if (!args || !args[0])
        return conn.reply(
          m.chat,
          Func.example(
            usedPrefix,
            command,
            "https://www.instagram.com/p/CK0tLXyAzEI",
          ),
          m,
        );

      if (!args[0].match(/(https:\/\/www.instagram.com)/gi))
        return conn.reply(
          m.chat,
          "Invalid Instagram URL. Please provide a valid URL.",
          m,
        );

      conn.sendReact(m.chat, "🕒", m.key);

      // Define API Key and API Endpoint
      const API_KEY = "Rk-Ruka"; // Replace with your actual API key
      const API_ENDPOINT = "https://api.maelyn.tech/api/instagram";

      // Fetch data from the Maelyn API
      const response = await Func.fetchJson(`${API_ENDPOINT}?url=${args[0]}`, {
        headers: {
          "mg-apikey": API_KEY,
        },
      });

      if (response.status !== "Success") {
        return conn.reply(
          m.chat,
          `Error: ${response.code}. Unable to fetch data.`,
          m,
        );
      }

      const results = response.result;
      const metaInfo = response.maelyn_meta;

      // Send media files to the user
      for (let item of results) {
        const { thumbnail_link, download_link } = item;
        conn.sendFile(
          m.chat,
          download_link,
          "media.mp4",
          `Udah yaa kak!`,
          m,
        );
        await Func.delay(1500); // Delay between file sends
      }

      // Log meta information (Optional)
      console.log(
        `Response Time: ${metaInfo.response_time}, Server: ${metaInfo.server}`,
      );
    } catch (error) {
      console.error(error);
      return conn.reply(m.chat, `Error: Unable to process your request.`, m);
    }
  },
  register: false,
  limit: false,
};
