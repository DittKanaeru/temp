const LOAN_LIMIT = 15000; // Batas maksimum pinjaman
const WEEKLY_DEDUCTION = 5000; // Potongan otomatis tiap minggu (kelak dipanggil scheduler eksternal)

module.exports = {
  help: ["bank"],
  tags: ["rpg"],
  command: ["bank"],
  register: true,
  group: true,

  run: async (m, { conn, text }) => {
    try {
      // Bila tidak ada argumen, tampilkan dashboard.
      if (!text || text.trim().length === 0) {
        return showDashboard(m, conn, m.sender);
      }

      // Pisahkan input menjadi subperintah dan (opsional) jumlah,
      // misalnya: ".bank deposit 1000" atau ".bank bayar 500".
      let args = text.trim().split(/\s+/);
      let subCommand = args[0].toLowerCase();
      let amount = parseInt(args[1]);

      // Validasi jumlah untuk subperintah yang memerlukan nilai
      if (
        [
          "deposit",
          "nabung",
          "wd",
          "tarik",
          "pinjam",
          "loan",
          "bayar",
        ].includes(subCommand) &&
        (isNaN(amount) || amount <= 0)
      ) {
        return conn.reply(
          m.chat,
          "🚩 Jumlah tidak valid. Harap masukkan angka yang benar.",
          m,
        );
      }

      // Hanya pengirim (m.sender) yang dapat menggunakan perintah bank
      let targetJid = m.sender;
      let user =
        global.db && global.db.users
          ? global.db.users.find((v) => v.jid === targetJid)
          : null;
      if (!user) {
        return conn.reply(m.chat, "🚩 Data pengguna tidak ditemukan.", m);
      }

      // Pastikan field-field penting sudah diinisialisasi
      if (typeof user.yuan !== "number" || isNaN(user.yuan)) user.yuan = 0;
      if (typeof user.bank !== "number" || isNaN(user.bank)) user.bank = 0;
      if (typeof user.loan !== "number" || isNaN(user.loan)) user.loan = 0;

      let response = "";

      // Proses subperintah deposit / nabung : memindahkan yuan ke bank
      if (subCommand === "deposit" || subCommand === "nabung") {
        if (user.yuan < amount) {
          return conn.reply(
            m.chat,
            "🚩 Saldo yuan tidak cukup untuk deposit.",
            m,
          );
        }
        user.yuan -= amount;
        user.bank += amount;
        response = `Berhasil deposit ${formatNumber(amount)} yuan.\nSaldo bank anda sekarang: ${formatNumber(user.bank)} yuan.`;

        // Proses subperintah wd / tarik : memindahkan dana dari bank ke yuan
      } else if (subCommand === "wd" || subCommand === "tarik") {
        if (user.bank < amount) {
          return conn.reply(
            m.chat,
            "🚩 Saldo bank tidak cukup untuk penarikan.",
            m,
          );
        }
        user.bank -= amount;
        user.yuan += amount;
        response = `Berhasil tarik ${formatNumber(amount)} yuan dari bank.\nSaldo bank anda sekarang: ${formatNumber(user.bank)} yuan.`;

        // Proses subperintah pinjam / loan: meminjam dengan bunga 30%
      } else if (subCommand === "pinjam" || subCommand === "loan") {
        let tentativeLoan = amount * 1.3; // Total utang termasuk bunga 30%
        if (user.loan + tentativeLoan > LOAN_LIMIT) {
          let remaining = LOAN_LIMIT - user.loan;
          return conn.reply(
            m.chat,
            `🚩 Pinjaman melebihi limit.\nSisa limit yang dapat dipinjam: ${formatNumber(remaining)} yuan.`,
            m,
          );
        }
        user.yuan += amount;
        user.loan += tentativeLoan;
        response = `Berhasil meminjam ${formatNumber(amount)} yuan.\nTotal pinjaman (termasuk bunga 30%): ${formatNumber(user.loan)} yuan.`;

        // Proses subperintah bayar : membayar pinjaman secara manual
      } else if (subCommand === "bayar") {
        if (user.loan <= 0) {
          return conn.reply(
            m.chat,
            "🚩 Tidak ada pinjaman yang harus dibayar.",
            m,
          );
        }
        if (amount > user.loan) {
          return conn.reply(
            m.chat,
            `🚩 Jumlah pembayaran melebihi total pinjaman Anda (${formatNumber(user.loan)} yuan). Masukkan jumlah yang sesuai.`,
            m,
          );
        }
        if (user.yuan < amount) {
          return conn.reply(
            m.chat,
            `🚩 Saldo yuan tidak cukup untuk membayar pinjaman. Saldo yuan Anda: ${formatNumber(user.yuan)}.`,
            m,
          );
        }
        user.yuan -= amount;
        user.loan -= amount;
        response = `Berhasil membayar ${formatNumber(amount)} yuan untuk pinjaman.\nSisa pinjaman: ${formatNumber(user.loan)} yuan.`;
        if (user.loan === 0) {
          response += "\nPinjaman telah lunas!";
        }
      } else {
        // Bila perintah tidak dikenali, tampilkan dashboard
        return showDashboard(m, conn, targetJid);
      }

      // Pastikan hanya mengirim satu pesan dengan return
      return conn.reply(m.chat, response, m);
    } catch (e) {
      console.error("Error processing bank command:", e);
      return conn.reply(m.chat, "🚩 Error saat memproses perintah bank.", m);
    }
  },
};

// Fungsi untuk menampilkan dashboard
function showDashboard(m, conn, targetJid) {
  let user =
    global.db && global.db.users
      ? global.db.users.find((v) => v.jid === targetJid)
      : null;
  if (!user) return conn.reply(m.chat, "🚩 Data pengguna tidak ditemukan.", m);

  let name = conn.getName(targetJid);
  let displayName = user.register && user.name ? user.name : name;
  let yuan = formatNumber(user.yuan);
  let bankBalance = formatNumber(user.bank);
  let availableLoan = LOAN_LIMIT - user.loan; // Sisa limit pinjaman yang tersedia

  let res = `*[ BANK Dashboard ]*\n\n`;
  res += `*Yuan  :* ${yuan}\n`;
  res += `*Bank  :* ${bankBalance}\n`;
  res += `*Sisa Loan Limit :* ${formatNumber(availableLoan)} / ${formatNumber(LOAN_LIMIT)} yuan\n`;
  res += `Auto deduction tiap minggu : ${formatNumber(WEEKLY_DEDUCTION)} yuan\n\n`;
  res += `*[ Menu dashboard ]*\n`;
  res += `.bank deposit\n.bank wd\n.bank loan/pinjam\n.bank bayar`;

  return conn.reply(m.chat, res, m);
}

// Fungsi untuk melakukan format angka:
// Contoh: 1000 menjadi "1k", 10000 menjadi "10k", 1000000 menjadi "1jt"
function formatNumber(num) {
  if (typeof num !== "number" || isNaN(num)) return "0";
  if (num < 1000) return num.toString();
  if (num < 1000000) {
    return (
      ((num / 1000) % 1 === 0
        ? (num / 1000).toFixed(0)
        : (num / 1000).toFixed(1)) + "k"
    );
  }
  return (
    ((num / 1000000) % 1 === 0
      ? (num / 1000000).toFixed(0)
      : (num / 1000000).toFixed(1)) + "jt"
  );
}

// Contoh fungsi proses potongan otomatis tiap minggu untuk pembayaran pinjaman.
// Fungsi ini sebaiknya dipanggil oleh scheduler eksternal, misalnya via cronjob.
function processWeeklyLoanDeduction(user) {
  if (user.loan > 0) {
    user.yuan -= WEEKLY_DEDUCTION; // Saldo yuan bisa menjadi negatif
    user.loan = Math.max(0, user.loan - WEEKLY_DEDUCTION);
  }
}

// Helper function tambahan jika diperlukan
function getTargetJid(text) {
  let number = isNaN(text)
    ? text.startsWith("+")
      ? text.replace(/[()+\s-]/g, "")
      : text.split`@`[1]
    : text;
  if (isNaN(number) || number.length > 15) return null;
  return number + "@s.whatsapp.net";
}
