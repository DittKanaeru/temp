/*const fetch = require('node-fetch');

module.exports = {
  help: ['stalk <platform> <userId> <zoneId>'],
  tags: ['internet'],
  command: /^(stalk)$/i,
  limit: true,
  register: true,
  run: async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`❗ Contoh penggunaan:\n${usedPrefix}${command} ml <userId> <zoneId>\n${usedPrefix}${command} yt <username>\n${usedPrefix}${command} roblox <username>\n${usedPrefix}${command} tiktok <username>`);

    const [platform, userId, zoneId] = text.split(' ');

    if (!platform || !userId || !zoneId) return m.reply(`❗ Contoh penggunaan yang benar:\n${usedPrefix}${command} ml <userId> <zoneId>\n${usedPrefix}${command} yt <username>\n${usedPrefix}${command} roblox <username>\n${usedPrefix}${command} tiktok <username>`);

    let apiUrl;
    let responseJson;

    switch (platform.toLowerCase()) {
      case 'ml':
        // API Mobile Legends
        apiUrl = `https://api.ryzendesu.vip/api/stalk/mobile-legends?userId=${userId}&zoneId=${zoneId}`;
        break;

      case 'yt':
        // API YouTube
        apiUrl = `https://api.ryzendesu.vip/api/stalk/youtube?username=${userId}`;
        break;

      case 'roblox':
        // API Roblox
        apiUrl = `https://api.suraweb.online/tools/stalkroblox?q=${userId}`;
        break;

      case 'tiktok':
        // API TikTok
        apiUrl = `https://api.ryzendesu.vip/api/stalk/tiktok?username=${userId}`;
        break;

      default:
        return m.reply(`❗ Platform tidak dikenali. Gunakan 'ml', 'yt', 'roblox', atau 'tiktok'.`);
    }

    try {
      const response = await fetch(apiUrl, { method: 'GET', headers: { 'accept': 'application/json' } });
      responseJson = await response.json();

      if (!response.ok) {
        throw new Error('Terjadi kesalahan dalam mengambil data.');
      }

      let replyMessage = '';

      switch (platform.toLowerCase()) {
        case 'ml':
          if (responseJson.success) {
            replyMessage = `👾 **Mobile Legends**\nUsername: ${responseJson.username}\nRegion: ${responseJson.region}`;
          } else {
            replyMessage = `❗ Data tidak ditemukan untuk pengguna Mobile Legends ${userId}.`;
          }
          break;

        case 'yt':
          if (responseJson.channelMetadata) {
            const { username, subscriberCount, videoCount, avatarUrl, description, channelUrl } = responseJson.channelMetadata;
            replyMessage = `🎥 **YouTube Channel**\nUsername: ${username}\nSubscribers: ${subscriberCount}\nVideos: ${videoCount}\nDescription: ${description}\nChannel: ${channelUrl}`;
            replyMessage += `\n\n🌟 Terbaru: [${responseJson.videoDataList[0]?.title}](${responseJson.videoDataList[0]?.navigationUrl})`;
          } else {
            replyMessage = `❗ Data tidak ditemukan untuk channel YouTube ${userId}.`;
          }
          break;

        case 'roblox':
          if (responseJson.creator) {
            const { name, displayName, profileDetails, userInfo } = responseJson;
            replyMessage = `🎮 **Roblox**\nUsername: ${name}\nDisplay Name: ${displayName}\nCreated: ${userInfo.created}\nProfile: [Avatar](${profileDetails})`;
            replyMessage += `\nFollowers: ${responseJson.userFollowers.data.length}\nFollowing: ${responseJson.userFollowing.data.length}`;
            replyMessage += `\n\n🕹️ Game Terbaru: ${responseJson.userGames.data[0]?.name}`;
          } else {
            replyMessage = `❗ Data tidak ditemukan untuk pengguna Roblox ${userId}.`;
          }
          break;

        case 'tiktok':
          if (responseJson.userInfo) {
            const { username, name, avatar, bio, verified, totalFollowers, totalFollowing, totalLikes, totalVideos } = responseJson.userInfo;
            replyMessage = `🎵 **TikTok**\nUsername: ${username}\nName: ${name}\nBio: ${bio}\nVerified: ${verified ? 'Yes' : 'No'}`;
            replyMessage += `\nFollowers: ${totalFollowers}\nFollowing: ${totalFollowing}\nLikes: ${totalLikes}\nVideos: ${totalVideos}`;
            replyMessage += `\nAvatar: ![Avatar](${avatar})`;
          } else {
            replyMessage = `❗ Data tidak ditemukan untuk pengguna TikTok ${userId}.`;
          }
          break;

        default:
          replyMessage = `❗ Platform tidak dikenali. Gunakan 'ml', 'yt', 'roblox', atau 'tiktok'.`;
          break;
      }

      await m.reply(replyMessage);

    } catch (error) {
      console.error(error);
      m.reply('❗ Terjadi kesalahan saat mencari data.');
    }
  }
};*/
