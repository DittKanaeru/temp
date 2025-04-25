const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function ffmpeg(buffer, args = [], ext = "", ext2 = "") {
  return new Promise(async (resolve, reject) => {
    try {
      let tmp = path.join(process.cwd(), "/temp", +new Date() + "." + ext);
      let out = tmp + "." + ext2;
      await fs.promises.writeFile(tmp, buffer);
      spawn("ffmpeg", ["-y", "-i", tmp, ...args, out])
        .on("error", reject)
        .on("close", async (code) => {
          try {
            await fs.promises.unlink(tmp);
            if (code !== 0) return reject(code);
            resolve({
              data: await fs.promises.readFile(out),
              filename: out,
              delete() {
                return fs.promises.unlink(out);
              },
            });
          } catch (e) {
            reject(e);
          }
        });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Convert Audio to Playable WhatsApp Audio
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext File Extension
 */
function toPTT(buffer, ext) {
  return ffmpeg(
    buffer,
    ["-vn", "-c:a", "libopus", "-b:a", "128k", "-vbr", "on"],
    ext,
    "ogg",
  );
}

/**
 * Convert Audio to Playable WhatsApp PTT
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext File Extension
 */
function toAudio(buffer, ext) {
  return ffmpeg(
    buffer,
    [
      "-vn",
      "-c:a",
      "libopus",
      "-b:a",
      "128k",
      "-vbr",
      "on",
      "-compression_level",
      "10",
    ],
    ext,
    "opus",
  );
}

/**
 * Convert Any Video to Playable WhatsApp MP4
 * @param {Buffer} buffer Video Buffer
 * @param {String} ext File Extension
 */
function toVideo(buffer, ext) {
  return ffmpeg(
    buffer,
    [
      "-movflags",
      "+faststart", // Membantu streaming lebih cepat di WhatsApp
      "-c:v",
      "libx264", // Gunakan codec H.264
      "-preset",
      "fast", // Preset konversi cepat
      "-crf",
      "28", // Kualitas video (0 = lossless, 51 = paling buruk)
      "-c:a",
      "aac", // Gunakan AAC untuk audio
      "-b:a",
      "128k", // Bitrate audio 128kbps
      "-ar",
      "44100", // Sample rate audio
      "-strict",
      "experimental", // Pastikan kompatibilitas audio
    ],
    ext,
    "mp4",
  );
}

module.exports = {
  toAudio,
  toPTT,
  toVideo,
  ffmpeg,
};
