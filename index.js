const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const CFonts = require("cfonts");
let restartCount = 0;
const MAX_RESTARTS = 3;

require("dotenv").config();
require("rootpath")();
console.clear();

CFonts.say("Amicy Yukio", {
  colors: ["cyan", "blue"],
  font: "block",
  align: "center",
  gradient: ["cyan", "blue"],
  transitionGradient: true,
});

function start() {
  if (restartCount >= MAX_RESTARTS) {
    console.error(
      chalk.redBright("❌ Maksimal restart tercapai. Proses dihentikan."),
    );
    return;
  }

  console.log(
    chalk.yellowBright(
      `🚀 Starting bot... (Restart ${restartCount}/${MAX_RESTARTS})`,
    ),
  );
  const args = [path.join(process.cwd(), "main.js"), ...process.argv.slice(2)];
  const p = spawn(process.argv[0], args, {
    stdio: ["inherit", "inherit", "inherit", "ipc"],
  });

  p.on("message", (data) => {
    try {
      if (data === "reset") {
        console.log(chalk.blueBright("🔄 Restarting bot..."));
        p.kill();
        restartCount = 0;
        start();
      }
    } catch (err) {
      console.error("Error handling message:", err);
    }
  });

  p.on("exit", (code) => {
    console.error(chalk.redBright(`⚠️ Bot exited with code: ${code}`));
    if (code === 1) {
      console.log(chalk.yellowBright("⏳ Waiting 5 seconds before restart..."));
      setTimeout(() => {
        restartCount++;
        start();
      }, 5000);
    } else if (code !== 0) {
      console.log(chalk.redBright("❌ Fatal error detected. Exiting process."));
    }
  });

  p.on("error", (err) => {
    console.error(chalk.redBright("❌ Spawn error:"), err);
  });
}

start();
