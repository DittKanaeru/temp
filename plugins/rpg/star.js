const { 
  xpRange, 
  canLevelUp,
  addStarExp,
} = require(process.cwd() + "/lib/system/starlight");

module.exports = {
  help: ['star', 'star activate', 'star buyexp', 'star claim', 'star level'],
  tags: ['rpg'],
  command: ['star'],
  group: true,
  register: true,
  run: async (m, { args, text, usedPrefix, command }) => {
    const users = global.db.users
    const user = users.find(u => u.jid === m.sender)
    if (!user) return m.reply("🚩 Data pengguna tidak ditemukan.")

    const subcommand = (args[0] || '').toLowerCase()

    switch (subcommand) {
      case 'activate': {
        const item = (args[1] || '').toLowerCase()

        if (item === 'platinumstr') {
          if ((user.platinumstr || 0) < 1) return m.reply("❌ Kamu tidak punya tiket Platinum Star!")
          user.platinumstr--
          user.starmode = 'platinum'
          user.starend = Date.now() + 14 * 24 * 60 * 60 * 1000
          m.reply("✅ Platinum Star aktif selama 2 minggu!")
        } else if (item === 'goldenstr') {
          if ((user.goldenstr || 0) < 1) return m.reply("❌ Kamu tidak punya tiket Diamond Star!")
          user.goldenstr--
          user.starmode = 'diamond'
          user.starend = Date.now() + 14 * 24 * 60 * 60 * 1000
          m.reply("✅ Diamond Star aktif selama 2 minggu!")
        } else {
          m.reply(`⚠️ Format salah!\nContoh:\n${usedPrefix}${command} activate platinumstr\n${usedPrefix}${command} activate goldenstr`)
        }
        break
      }

      case 'buyexp': {
        const jumlah = parseInt(args[1])
        if (isNaN(jumlah) || jumlah <= 0) return m.reply(`⚠️ Contoh: ${usedPrefix}${command} buyexp 20000 (yuan)`)

        if ((user.yuan || 0) < jumlah) return m.reply("❌ Yuan kamu tidak cukup!")

        const starexp = Math.floor((jumlah / 20000) * 300)
        user.yuan -= jumlah
        user.starexp = (user.starexp || 0) + starexp

        while (canLevelUp(user.starlevel || 0, user.starexp)) {
          user.starlevel = (user.starlevel || 0) + 1
          giveStarReward(user)
        }

        m.reply(`✅ Berhasil beli *${starexp}* Starexp seharga *${jumlah} Yuan*!`)
        break
      }

      case 'claim': {
        m.reply("🎟️ Semua hadiah sudah otomatis diklaim saat naik level.\nTidak perlu claim manual!")
        break
      }

      case 'level': {
        if ((user.starlevel || 0) < 10) {
          return m.reply("⚠️ Kamu harus minimal Level 10 Starlight untuk melihat daftar hadiah.")
        }

        let list = ''
        for (let i = 10; i <= (user.starlevel || 0); i++) {
          list += `• Level ${i} : Hadiah random + 9-15 Starcoin\n`
        }

        m.reply(`🎁 *STARLIGHT PRIZE POOL*\n\n${list.trim()}`)
        break
      }

      default: {
        const { min, xp } = xpRange(user.starlevel || 0)
        const progress = ((user.starexp - min) / xp) * 100

        let info = `
🌟 *PLATINUM STAR SYSTEM* 🌟

➤ Mode : *${user.starmode || 'Bronze'} Star*
➤ Level : *${user.starlevel || 0}*
➤ Starexp : *${user.starexp || 0}/${min + xp}* (${progress.toFixed(2)}%)
➤ Starcoin : *${user.starcoin || 0}*

${user.starend && Date.now() < user.starend ? `⏳ Berakhir dalam: *${toTime(user.starend - Date.now())}*` : ''}

📜 Commands:
- *${usedPrefix}${command} activate platinumstr/goldenstr*
- *${usedPrefix}${command} buyexp <jumlah yuan>*
- *${usedPrefix}${command} level* → Lihat prize pool
`.trim()

        m.reply(info)
      }
    }
  }
}

function toTime(ms) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${h} jam ${m} menit ${s} detik`
}

// --- SISTEM HADIAH STARLIGHT ---
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function giveStarReward(user) {
  const mode = user.starmode || 'bronze'
  const level = user.starlevel

  let rewardChance = 0

  if (mode === 'bronze') rewardChance = randomInt(3, 8)
  else if (mode === 'platinum') rewardChance = randomInt(2, 4)
  else if (mode === 'diamond') rewardChance = 1

  if (level % rewardChance === 0) {
    const reward = randomStarReward()
    applyReward(user, reward)

    // Bonus Starcoin 🎟️
    const starcoin = randomInt(9, 15)
    user.starcoin = (user.starcoin || 0) + starcoin
  }
}

function randomStarReward() {
  const rewards = [
    { type: 'yuan', min: 800, max: 30000 },
    { type: 'potion' },
    { type: 'rune' },
    { type: 'jade' },
    { type: 'diamond' },
    { type: 'steel', amount: 15 },
    { type: 'emerald' },
    { type: 'ruby' },
    { type: 'mithril' },
    { type: 'wood', min: 8, max: 20 }
  ]

  const pick = rewards[Math.floor(Math.random() * rewards.length)]

  if (pick.type === 'yuan') {
    const value = randomInt(pick.min, pick.max)
    return { type: 'yuan', value }
  } else if (pick.type === 'wood') {
    const value = randomInt(pick.min, pick.max)
    return { type: 'wood', value }
  } else if (pick.type === 'steel') {
    return { type: 'steel', value: pick.amount }
  } else {
    return { type: pick.type, value: 1 }
  }
}

function applyReward(user, reward) {
  user[reward.type] = (user[reward.type] || 0) + reward.value
}
