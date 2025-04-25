const { S_WHATSAPP_NET } = require("@adiwajshing/baileys");
const Jimp = require("jimp");

module.exports = {
  help: ["setpp"].map((cmd) => cmd + " <reply/image>"),
  tags: ["owner"],
  command: ["setpp"],
  run: async (m, { conn }) => {
    try {
      let q = m.quoted ? m.quoted : m;
      let mime = (m.quoted ? m.quoted : m.msg).mimetype || "";

      if (/image\/(jpe?g|png)/.test(mime)) {
        m.reply(global.status.wait);
        const buffer = await q.download();
        const { img } = await generate(buffer);

        await conn.query({
          tag: "iq",
          attrs: {
            to: S_WHATSAPP_NET,
            type: "set",
            xmlns: "w:profile:picture",
          },
          content: [
            {
              tag: "picture",
              attrs: { type: "image" },
              content: img,
            },
          ],
        });

        conn.reply(
          m.chat,
          "*🚩 Profile photo has been successfully changed.*",
          m,
        );
      } else {
        conn.reply(
          m.chat,
          "*🚩 Reply to an image to set it as the bot's profile picture.*",
          m,
        );
      }
    } catch (e) {
      conn.reply(m.chat, JSON.stringify(e, null, 2), m);
    }
  },
  owner: true,
};

async function generate(media) {
  const jimp = await Jimp.read(media);
  const min = jimp.getWidth();
  const max = jimp.getHeight();
  const cropped = jimp.crop(0, 0, min, max);

  return {
    img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
    preview: await cropped.normalize().getBufferAsync(Jimp.MIME_JPEG),
  };
}
