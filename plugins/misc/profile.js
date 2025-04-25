const levelling = require(process.cwd() + "/lib/system/leveling");

module.exports = {
  help: ["profile"],
  tags: ["misc"],
  command: ["me", "profile"],
  run: async (m, { conn, text, env }) => {
    try {
      let targetJid = text ? getTargetJid(text) : m.sender;
      let user = global.db.users.find((v) => v.jid === targetJid);
      if (!user)
        return conn.reply(m.chat, "🚩 Data pengguna tidak ditemukan.", m);

      let { min, xp } = levelling.xpRange(user.level, global.multiplier);
      let name = conn.getName(targetJid);
      let pasanganJid = user.pasangan || null;
      let pasangan = pasanganJid ? "@" + pasanganJid.split("@")[0] : "Jomblo";
      let expired =
        user.expired - Date.now() > 1 ? toDate(user.expired - Date.now()) : "-";

      // PROFILE TEXT
      let profile = `*[ PROFILE ]*\n`;
      profile += `*Nama :* ${user.register ? user.name : name}\n`;
      profile += `*Level :* ${user.level} (${user.exp - min}/${xp} XP)\n`;
      profile += `*Role :* ${user.role}\n`;
      profile += `*Tag :* ${Func.role(user.level)}\n\n`;

      profile += `*[ STATISTICS ]*\n`;
      profile += `*Job :* ${user.job || "_Belum Memiliki Job_"}\n`;
      profile += `*Class :* ${user.skill || "_Belum Memiliki Class_"}\n`;
      profile += `*Health :* ${user.health || 0}\n`;
      profile += `*Mana :* ${user.mana || 0}\n`;
      profile += `*Damage :* ${user.damage || 0}\n`;
      profile += `*Crit Chance :* ${user.crit || 0}%\n`;
      profile += `*Item :* ${user.item || "_Tidak Ada_"}\n`;
      profile += `*Armor :* ${user.armor || "_Tidak Ada_"}\n`;
      profile += `*Potion :* ${user.potion || 0}\n`;
      profile += `*Hit :* ${Func.h2k(user.hit || 0)}\n`;
      profile += `*Yuan :* ${Func.m2k(user.yuan)}\n`;
      profile += `*Limit :* ${user.premium ? "UNLIMITED" : Func.formatNumber(user.limit)}\n`;
      profile += `*Menang :* ${Func.formatNumber(user.win || 0)} | *Kalah :* ${Func.formatNumber(user.lose || 0)}\n\n`;

      profile += `*[ STATUS ]*\n`;
      profile += `*Pasangan :* ${pasangan}\n`;
      profile += `*Premium :* ${user.premium ? "√" : "×"}\n`;

      m.reply(profile);
    } catch (error) {
      console.error(error);
      conn.reply(m.chat, "🚩 Error generating profile.", m);
    }
  },
  register: true,
};

function getTargetJid(text) {
  let number = isNaN(text)
    ? text.startsWith("+")
      ? text.replace(/[()+\s-]/g, "")
      : text.split`@`[1]
    : text;

  if (isNaN(number) || number.length > 15) return null;

  return number + "@s.whatsapp.net";
}

function toDate(ms) {
  let days = Math.floor(ms / (24 * 60 * 60 * 1000));
  let hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  let minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  return `${days}h ${hours}m ${minutes}m`;
}
