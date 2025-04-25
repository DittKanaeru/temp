module.exports = {
  help: ["inv"],
  tags: ["rpg"],
  command: ["inv", "inventory"],
  group: true,
  register: true,
  run: async (m, { conn }) => {
    let users = global.db.users;
    let user = users.find((u) => u.jid === m.sender);
    if (!user) return m.reply("🚩 Data pengguna tidak ditemukan.");

    let text = `🎒 *[ Inventory ${user.name || "Unknown"} ]* 🎒\n\n`;

    // === STATS ===
    text += `*[ STATS ]*\n`;
    text += `- Health: *${user.health || 0}/${user.MAXhealth || 0}*\n`;
    text += `- Mana: *${user.mana || 0}/${user.MAXmana || 0}*\n`;
    text += `- Limit: *${user.limit || 0}*\n\n`;

    // === TOOLS NEED ===
    text += `*[ TOOLS NEED ]*\n`;
    text += `- Rune: *${user.rune || 0}*\n`;
    text += `- Mitril: *${user.mitril || 0}*\n`;
    text += `- Jade: *${user.jade || 0}*\n`;
    text += `- Skill Coin: *${user.scoin || 0}*\n`;
    text += `- Crystal core: *${user.crystalcore || 0}*\n\n`;

    // === HEALTH AND MANA REGEN ===
    text += `*[ HEALTH AND MANA REGEN ]*\n`;
    text += `- Healing Herb Soup: *${user.healingHerbSoup || 0}*\n`;
    text += `- Vitality Cake: *${user.vitalityCake || 0}*\n`;
    text += `- Sacred Watermelon: *${user.sacredWatermelon || 0}*\n`;
    text += `- Phoenix Roast: *${user.phoenixRoast || 0}*\n`;
    text += `- Crimson Apple: *${user.crimsonApple || 0}*\n\n`;

    text += `*[ MANA REGEN ]*\n`;
    text += `- Arcane Bread: *${user.arcaneBread || 0}*\n`;
    text += `- Etherberry Juice: *${user.etherberryJuice || 0}*\n`;
    text += `- Void Tea: *${user.voidTea || 0}*\n`;
    text += `- Mystic Elixir: *${user.mysticElixir || 0}*\n`;
    text += `- Mana Pudding: *${user.manaPudding || 0}*\n\n`;

    // === ITEM ===
    text += `*[ COIN AND TICKET ]*\n`;
    text += `- Vrpass: *${user.vrpass || 0}*\n`;
    text += `- Spin Tiket: *${user.spintiket || 0}*\n`;
    text += `- Starcoin: *${user.starcoin || 0}*\n`;
    text += `- Platinum Ticket: *${user.platinumstr || 0}*\n`;
    text += `- Diamond Ticket: *${user.goldenstr || 0}*\n\n`;

    // === CHEST ===
    text += `*[ CHEST ]*\n`;
    text += `- Common: *${user.common || 0}*\n`;
    text += `- Uncommon: *${user.uncommon || 0}*\n`;
    text += `- Mythic: *${user.mythic || 0}*\n`;
    text += `- Legendary: *${user.legendary || 0}*\n\n`;

    // === BACKPACK ===
    text += `*[ BACKPACK ]*\n`;
    text += `- Diamond: *${user.diamond || 0}*\n`;
    text += `- Gold: *${user.gold || 0}*\n`;
    text += `- Emerald: *${user.emerald || 0}*\n`;
    text += `- Ruby: *${user.ruby || 0}*\n`;
    text += `- Core: *${user.core || 0}*\n`;
    text += `- Potion: *${user.potion || 0}*\n`;
    text += `- Trash: *${user.trash || 0}*\n`;
    text += `- Wood: *${user.wood || 0}*\n`;
    text += `- Iron: *${user.iron || 0}*\n`;
    text += `- Rock: *${user.rock || 0}*\n`;
    text += `- Minyak: *${user.minyak || 0}*\n`;
    text += `- Susu: *${user.susu || 0}*\n`;
    text += `- String: *${user.string || 0}*\n`;
    text += `- Coal: *${user.coal || 0}*\n`;
    text += `- Steel: *${user.steel || 0}*\n\n`;

    m.reply(text.trim());
  },
};
