/*const moment = require('moment');
const Func = require(process.cwd() + '/lib/system/functions.js');
const { 
  createArenaRoom,
  getArenaRoom,
  acceptArenaChallenge,
  cleanupExpiredRooms,
  canUserDuel,
  getDuelResult,
  handleBetDistribution,
  getArenaTicketCooldown,
  isValidBetAmount,
  generateFaqText 
} = require('./_funcarena.js');

let arenaRooms = {};

module.exports = { name: "arena", alias: ["duel"], category: "rpg", async run({ msg, db, args, command, prefix }) { const user = msg.sender; const sub = args[0]?.toLowerCase();

// Pembersihan room kadaluarsa
arenaRooms = cleanupExpiredRooms(arenaRooms);

switch (sub) {
  case 'pvp': {
    let target = msg.mention[0];
    if (!target || target === user) return msg.reply("Tag lawan yang ingin ditantang.");

    if (!canUserDuel(db, user)) return msg.reply("Kamu tidak punya arena ticket atau sedang cooldown.");
    
    if (Object.values(arenaRooms).some(r => r.userA === user)) return msg.reply("Kamu sudah memiliki tantangan aktif.");

    const room = createArenaRoom(user, target);
    arenaRooms[room.id] = room;

    msg.reply(`@${target.split('@')[0]}, kamu ditantang duel oleh @${user.split('@')[0]}!

Balas dengan .arena accept @${user.split('@')[0]} untuk menerima.`); break; }

case 'accept': {
    let challenger = msg.mention[0];
    if (!challenger) return msg.reply("Tag penantang yang ingin kamu lawan.");

    const room = Object.values(arenaRooms).find(r => r.userA === challenger && r.userB === user);
    if (!room) return msg.reply("Tidak ada tantangan aktif dari user tersebut.");

    if (!canUserDuel(db, user)) return msg.reply("Kamu tidak punya arena ticket atau sedang cooldown.");

    room.accepted = true;
    room.prepareStart = Date.now();
    room.status = 'prepare';

    msg.reply("Duel dimulai! Kamu punya 5 menit untuk mempersiapkan dan memasang taruhan. Gunakan *.arena bet <jumlah> room <id>*");
    break;
  }

  case 'bet': {
    const amount = parseFloat(args[1]);
    const roomId = args[3];

    if (!isValidBetAmount(amount)) return msg.reply("Minimal taruhan 1k yen dan harus menggunakan desimal.");

    const room = getArenaRoom(arenaRooms, roomId);
    if (!room || room.status !== 'prepare') return msg.reply("Room tidak ditemukan atau tidak dalam fase taruhan.");

    if (!room.bets) room.bets = { A: {}, B: {} };
    const team = (msg.sender === room.userA) ? 'A' : (msg.sender === room.userB) ? 'B' : null;
    if (!team) return msg.reply("Hanya user yang berada di arena yang bisa memicu taruhan.");

    if ((room.bets[team][user] || 0) + amount > 30000) return msg.reply("Taruhan kamu melebihi batas 30k yen.");

    if (!room.bets[team][user]) room.bets[team][user] = 0;
    room.bets[team][user] += amount;

    msg.reply(`Taruhan berhasil. Kamu mendukung tim ${team} dengan ${amount} yen.`);
    break;
  }

  case 'faq': {
    msg.reply(generateFaqText(prefix));
    break;
  }

  default: {
    msg.reply(`Gunakan:

.arena pvp @user .arena accept @user .arena bet 3k room <id> .arena faq`); break; } } } };*/
