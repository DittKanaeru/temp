const env = require(process.cwd() + "/config.json");

const models = {
  users: Object.freeze({
    afk: -1,

    afkReason: "",

    exp: 0,

    health: 100,

    mana: 0,

    potion: 0,

    experience: 0,

    wins: 0,

    lose: 0,

    item: "",

    armor: "",

    armordefend: 0,

    role: "",

    damage: 0,

    skill: "",

    job: "",

    crit: 0,

    afkObj: {},

    level: 0,

    limit: env.limit,

    banned: false,

    ban_temporary: 0,

    ban_times: 0,

    premium: false,

    expired: 0,

    hit: 0,

    usebot: 0,

    lastseen: 0,

    claim: 0,

    yuan: 0,

    pasangan: "",
  }),

  groups: Object.freeze({
    activity: 0,

    antilink: true,

    game: false,

    filter: false,

    left: true,

    mute: false,

    member: {},

    text_left: "",

    text_welcome: "",

    detect: false,

    demote: "",

    promote: "",

    welcome: true,

    expired: 0,

    stay: false,
  }),

  chats: Object.freeze({
    chat: 0,

    lastchat: 0,

    lastseen: 0,
  }),

  setting: Object.freeze({
    groupmode: false,

    sk_pack: "Sticker by",

    sk_author: env.footer,

    self: false,

    prefix: [".", "#", "!", "/"],

    onlyprefix: "+",

    multiprefix: true,

    toxic: [
      "ajg",
      "ajig",
      "anjas",
      "anjg",
      "anjim",
      "anjing",
      "anjrot",
      "anying",
      "asw",
      "autis",
      "babi",
      "bacod",
      "bacot",
      "bagong",
      "bajingan",
      "bangsad",
      "bangsat",
      "bastard",
      "bego",
      "bgsd",
      "biadab",
      "biadap",
      "bitch",
      "bngst",
      "bodoh",
      "bokep",
      "cocote",
      "coli",
      "colmek",
      "comli",
      "dajjal",
      "dancok",
      "dongo",
      "fuck",
      "gelay",
      "goblog",
      "goblok",
      "guoblog",
      "guoblok",
      "hairul",
      "henceut",
      "idiot",
      "itil",
      "jamet",
      "jancok",
      "jembut",
      "jingan",
      "kafir",
      "kanjut",
      "kanyut",
      "keparat",
      "kntl",
      "kontol",
      "lana",
      "loli",
      "lont",
      "lonte",
      "mancing",
      "meki",
      "memek",
      "ngentod",
      "ngentot",
      "ngewe",
      "ngocok",
      "ngtd",
      "njeng",
      "njing",
      "njinx",
      "oppai",
      "pantek",
      "pantek",
      "peler",
      "pepek",
      "pilat",
      "pler",
      "pornhub",
      "pucek",
      "puki",
      "pukimak",
      "redhub",
      "sange",
      "setan",
      "silit",
      "telaso",
      "tempek",
      "tete",
      "titit",
      "toket",
      "tolol",
      "tomlol",
      "tytyd",
      "wildan",
      "xnxx",
    ],

    online: true,

    owners: ["6285950723074"],

    lastReset: new Date() * 1,

    backupTime: 0,

    backup: true,

    cover: env.cover,

    link: env.url,
  }),
};

module.exports = { models };
