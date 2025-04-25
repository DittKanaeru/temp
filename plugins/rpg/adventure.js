const adventures = [
  { city: "Konoha", boss: "Uchiha Madara" },
  { city: "Marineford", boss: "Admiral Akainu" },
  { city: "Soul Society", boss: "Sosuke Aizen" },
  { city: "Shiganshina", boss: "Beast Titan" },
  { city: "Hunter Association", boss: "Hisoka" },
  { city: "Seoul", boss: "Sung Jin-Woo" },
  { city: "Floor 77 - Tower of God", boss: "Zahard" },
  { city: "Busan", boss: "Daniel Park" },
  { city: "Tokyo Jujutsu High", boss: "Sukuna" },
  { city: "Orario", boss: "Levis" },
  { city: "Yokohama", boss: "Dazai Osamu" },
  { city: "Crossbell", boss: "Arios MacLaine" },
  { city: "Piltover", boss: "Jinx" },
  { city: "Balbadd", boss: "Sinbad" },
  { city: "Aincrad", boss: "Heathcliff" },
  { city: "Re-Estize", boss: "Ainz Ooal Gown" },
  { city: "Magnolia", boss: "Acnologia" },
  { city: "Edo", boss: "Gintoki Sakata" },
  { city: "Westalis", boss: "Twilight" },
  { city: "Academy City", boss: "Accelerator" },
  { city: "Grand Line", boss: "Kaido" },
  { city: "Tartarus", boss: "Hades" },
  { city: "Demon Realm", boss: "King of Demons" },
  { city: "Seoul Station", boss: "Kang Hyeonjun" },
  { city: "Los Angeles", boss: "Johan Seong" },
  { city: "Tempest", boss: "Rimuru Tempest" },
  { city: "Dandelion Kingdom", boss: "Allen" },
  { city: "Floor 100 - Tower of God", boss: "Enryu" },
  { city: "Black Clover Kingdom", boss: "Lucifero" },
  { city: "Erisden", boss: "Shin Wolford" },
];

const quests = [
  "mengalahkan boss",
  "mengambil artefak",
  "menyelamatkan penduduk",
  "menghancurkan basis musuh",
  "merebut harta karun",
  "menyelamatkan teman",
];

const ranNumb = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const cooldown = 24 * 60 * 60 * 1000; // Cooldown 24 jam

async function run(m, { usedPrefix, command, text, user }) {
  if (user.health < 80) {
    return m.reply(
      `🚑 Kamu membutuhkan minimal 80 health untuk berpetualang!\nGunakan *${usedPrefix}heal* atau *${usedPrefix}use potion*.`,
    );
  }

  let timePassed = new Date() - new Date(user.lastadventure || 0);
  if (timePassed <= cooldown) {
    let timeLeft = cooldown - timePassed;
    return m.reply(
      `⏳ Kamu harus menunggu *🕐 ${new Date(timeLeft).toISOString().substr(11, 8)}* lagi untuk berpetualang.`,
    );
  }

  if (user.onAdventure) {
    return m.reply(`⚠️ Kamu masih dalam petualangan. Selesaikan dulu.`);
  }

  user.onAdventure = true;

  const adventure = adventures[Math.floor(Math.random() * adventures.length)];
  const quest = quests[Math.floor(Math.random() * quests.length)];

  m.reply(
    `🛡️ Kamu memulai perjalanan ke *${adventure.city}* untuk *${quest}* melawan *${adventure.boss}*...`,
  );

  setTimeout(() => {
    const isSuccess = Math.random() > 0.3; // 70% sukses
    if (!isSuccess) {
      user.health = Math.floor(user.health * 0.2);
      user.stamina = Math.floor(user.stamina * 0.2);
      user.lastadventure = new Date();
      user.onAdventure = false;

      return m.reply(
        `😵 *Petualangan Gagal!*\n\nSaat mencoba melawan *${adventure.boss}* di *${adventure.city}*, kamu mengalami kekalahan.\n\n⚠️ HP dan Stamina berkurang 80%!`,
      );
    }

    let rewardText = "";
    switch (quest) {
      case "mengalahkan boss":
        let yuan1 = ranNumb(20000, 70000);
        let frag1 = ranNumb(4, 10);
        user.yuan += yuan1;
        user.fragment += frag1;
        rewardText = `💴 ${yuan1.toLocaleString()} yuan\n🧩 ${frag1} fragment`;
        break;
      case "mengambil artefak":
        let mithril = ranNumb(10, 30);
        let glowstone = ranNumb(10, 30);
        user.mithril += mithril;
        user.glowstone += glowstone;
        rewardText = `🔮 ${mithril} mithril\n✨ ${glowstone} glowstone`;
        break;
      case "menyelamatkan penduduk":
        let yuan2 = ranNumb(10000, 40000);
        let frag2 = ranNumb(3, 7);
        user.yuan += yuan2;
        user.fragment += frag2;
        rewardText = `💴 ${yuan2.toLocaleString()} yuan\n🧩 ${frag2} fragment`;
        break;
      case "menghancurkan basis musuh":
        let yuan3 = ranNumb(15000, 50000);
        let frag3 = ranNumb(5, 12);
        user.yuan += yuan3;
        user.fragment += frag3;
        rewardText = `💴 ${yuan3.toLocaleString()} yuan\n🧩 ${frag3} fragment`;
        break;
      case "merebut harta karun":
        let yuan4 = ranNumb(40000, 100000);
        let diamond = ranNumb(1, 2);
        user.yuan += yuan4;
        user.diamond += diamond;
        rewardText = `💴 ${yuan4.toLocaleString()} yuan\n💎 ${diamond} diamond`;
        break;
      case "menyelamatkan teman":
        let yuan5 = ranNumb(20000, 50000);
        let crystal = ranNumb(1, 5);
        user.yuan += yuan5;
        user.crystal += crystal;
        rewardText = `💴 ${yuan5.toLocaleString()} yuan\n🔮 ${crystal} crystal`;
        break;
    }

    user.lastadventure = new Date();
    user.onAdventure = false;

    m.reply(
      `🌟 *Petualangan Berhasil!*\n\nKamu bertarung melawan *${adventure.boss}* di *${adventure.city}* untuk *${quest}*.\n\n🎁 Hadiah:\n${rewardText}`,
    );
  }, 30 * 1000); // Delay 30 detik
}

module.exports = {
  help: ["adventure", "berpetualang"],
  tags: ["rpg"],
  command: /^(adventure|(ber)?petualang(ang)?)$/i,
  register: true,
  group: true,
  cooldown,
  limit: true,
  run,
};
