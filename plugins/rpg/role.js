const roleSkills = {
  mage: "mythic flame",
  archer: "phantom shot",
  tanker: "demonic shield",
  assassin: "shadow sword",
  fighter: "berserker rage",
};

const roleDescriptions = {
  mage: "Mage - Pengguna sihir dan elemen jarak jauh.",
  archer: "Archer - Penembak jitu jarak jauh.",
  tanker: "Tanker - Pelindung dengan pertahanan tinggi.",
  assassin: "Assassin - Pembunuh cepat dan diam-diam.",
  fighter: "Fighter - Petarung jarak dekat yang kuat.",
};

const defaultStats = {
  mage: {
    health: 80,
    damage: 35,
    mana: 100,
    crit: 20,
    level: 1,
  },
  archer: {
    health: 85,
    damage: 30,
    mana: 90,
    crit: 35,
    level: 1,
  },
  tanker: {
    health: 150,
    damage: 15,
    mana: 30,
    crit: 10,
    level: 1,
  },
  assassin: {
    health: 75,
    damage: 40,
    mana: 40,
    crit: 45,
    level: 1,
  },
  fighter: {
    health: 100,
    damage: 30,
    mana: 40,
    crit: 25,
    level: 1,
  },
};
const cooldownPeriod = 2 * 30 * 24 * 60 * 60 * 1000; // 2 bulan

module.exports = {
  help: ["pilihrole"],
  tags: ["rpg"],
  command: ["pilihrole", "selectrole"],
  register: true,
  group: true,

  run: async (m, { conn, usedPrefix, text, command }) => {
    try {
      const user = global.db.users.find((v) => v.jid === m.sender);
      const roles = Object.keys(roleDescriptions);
      const chosenRole = text.trim().toLowerCase();

      if (!chosenRole) {
        let list = roles
          .map(
            (role) =>
              `› *[ ${role.charAt(0).toUpperCase() + role.slice(1)} ]*\n${roleDescriptions[role]}`,
          )
          .join("\n\n");
        return conn.reply(
          m.chat,
          `Wahai pejuang, pilihlah role yang ingin kamu gunakan.

Ingat, kamu hanya bisa memilih *1 role setiap 2 bulan*. Role menentukan skill dan statistik awalmu.

*[ Role List ]*\n\n${list}

Cara menggunakan:
${usedPrefix + command} <nama_role>

Contoh:
${usedPrefix + command} mage`,
          m,
        );
      }

      if (!roles.includes(chosenRole)) {
        let list = roles
          .map(
            (role) =>
              `› *[ ${role.charAt(0).toUpperCase() + role.slice(1)} ]*\n${roleDescriptions[role]}`,
          )
          .join("\n\n");
        return conn.reply(
          m.chat,
          `Role yang kamu pilih tidak valid.

*[ Role List ]*\n\n${list}

Cara menggunakan:
${usedPrefix + command} <nama_role>

Contoh:
${usedPrefix + command} mage`,
          m,
        );
      }

      const now = Date.now();
      if (
        user.role &&
        user.lastRoleChange &&
        now - user.lastRoleChange < cooldownPeriod
      ) {
        return conn.reply(
          m.chat,
          `Role-mu saat ini adalah *${user.role}* dan belum bisa diganti sampai 2 bulan ke depan.`,
          m,
        );
      }

      // Set role, skill, dan semua stats
      user.role = chosenRole;
      user.skill = roleSkills[chosenRole];
      user.lastRoleChange = now;

      // Assign default stats
      Object.assign(user, defaultStats[chosenRole]);

      return conn.reply(
        m.chat,
        `Kamu telah memilih *${chosenRole.charAt(0).toUpperCase() + chosenRole.slice(1)}* sebagai role-mu.

Skill: *${roleSkills[chosenRole].toUpperCase()}*
sekarang statistikmu sudah di sesuaikan berdasarkan dengan role yang kamu pilih! ingat tak ada role yang sempurna lengkapilah satu sama lain dan jadilah satu,
Gunakan dengan bijak dan jadilah legenda di medan tempur.`,
        m,
      );
    } catch (e) {
      console.error(e);
      conn.reply(m.chat, "🚩 Terjadi kesalahan saat memilih role.", m);
    }
  },
};
