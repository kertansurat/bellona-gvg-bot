const { Client, GatewayIntentBits, Partials } = require("discord.js");
const express = require("express");
const fetch = require("node-fetch"); // ต้องเพิ่ม dependency

// =========================
// EXPRESS KEEP ALIVE
// =========================
const app = express();
app.get("/", (req, res) => {
  res.send("BELLONA GVG SYSTEM ONLINE");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Web server running"));

// =========================
// DISCORD BOT
// =========================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// =========================
// CONFIG
// =========================
const SHEET_API_URL = process.env.SHEET_API_URL;

// =========================
// TEMP MEMORY (DISCORD → CHAR)
// (จะ upgrade เป็น DB ได้ภายหลัง)
// =========================
const userMap = new Map();

// =========================
// READY
// =========================
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// =========================
// REGISTER CHARACTER NAME
// =========================
// !setname Knight001
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const prefix = "!";

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(" ");
  const cmd = args.shift().toLowerCase();

  // =========================
  // SET CHARACTER NAME
  // =========================
  if (cmd === "setname") {
    const charName = args.join(" ");

    if (!charName) {
      return message.reply("❌ ใส่ชื่อตัวละคร เช่น !setname Knight001");
    }

    userMap.set(message.author.id, charName);

    return message.reply(`✅ บันทึกชื่อแล้ว: ${charName}`);
  }

  // =========================
  // CHECK IN GVG
  // =========================
  if (cmd === "gvg") {
    const status = args[0]; // มา / ลา / ขาด

    if (!status) {
      return message.reply("❌ ใช้: !gvg มา | ลา | ขาด");
    }

    const charName = userMap.get(message.author.id);

    if (!charName) {
      return message.reply("❌ กรุณาตั้งชื่อก่อน: !setname <ชื่อ>");
    }

    const payload = {
      charName,
      status
    };

    try {
      const res = await fetch(SHEET_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.status === "success") {
        return message.reply(`⚔️ บันทึก GVG แล้ว: ${charName} → ${status}`);
      } else {
        return message.reply("❌ เกิดข้อผิดพลาด");
      }
    } catch (err) {
      return message.reply("❌ API ไม่ตอบสนอง");
    }
  }

  // =========================
  // STATUS CHECK
  // =========================
  if (cmd === "status") {
    return message.reply("⚔️ BELLONA GVG SYSTEM ONLINE");
  }
});

// =========================
// LOGIN
// =========================
client.login(process.env.DISCORD_TOKEN);
