const { Function: Func, Scraper } = new (require("@neoxr/wb"))();
require("./functions"), require("./scraper");
const fs = require("fs");
const chalk = require("chalk");

global.Api = new (require("./neoxrApi"))(
  process.env.API_ENDPOINT,
  process.env.API_KEY,
);
global.Func = Func;
global.Scraper = Scraper;

global.multiplier = 1000;

global.status = Object.freeze({
  invalid: Func.Styles("Invalid url"),
  wrong: Func.Styles("Wrong format."),
  fail: Func.Styles("Can't get metadata"),
  error: Func.Styles("Error occurred"),
  limit: Func.Styles(
    `The limit has been exhausted and will be reset at 00.00.\n\nTo get more limits, upgrade to premium.`,
  ),
  banned: Func.Styles("You have been banned from using this bot."),
  errorF: Func.Styles("Sorry this feature is in error."),
  premium: Func.Styles("This feature only for premium user."),
  auth: Func.Styles(
    "you do not have access to this feature, please register first to get access.",
  ),
  owner: Func.Styles("This command only for owner."),
  group: Func.Styles("This command will only work in groups."),
  botAdmin: Func.Styles("This command will work when I become an admin."),
  admin: Func.Styles("This command only for group admin."),
  private: Func.Styles("Use this command in private chat."),
  gameInGroup: Func.Styles(
    "Game features have not been activated for this group.",
  ),
  gameLevel: Func.Styles(
    "You cannot play the game because your level has reached the maximum limit.",
  ),
});

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright("Update 'config.js'"));
  delete require.cache[file];
  require(file);
});
