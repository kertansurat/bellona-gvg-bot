// --- โค้ด index.js ฉบับสมบูรณ์ (ตรวจสอบวงเล็บปิดครบ 100%) ---
const Express = require('express');
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, PermissionsBitField } = require('discord.js');
require('dotenv').config();

const expressApp = Express();
const port = process.env.PORT || 3000;

// --- Diagnostic: ตรวจสอบตัวแปรระบบ ---
console.log('--- เริ่มการตรวจสอบ Diagnostic (Diagnostics) ---');
console.log(`- เช็ค DISCORD_BOT_TOKEN: ${process.env.DISCORD_BOT_TOKEN ? 'พบ ✅ (มีความยาว)' : 'ไม่พบ ❌ (กรุณาใส่ใน Environment ของ Render)'}`);
console.log(`- เช็ค GOOGLE_SCRIPT_URL: ${process.env.GOOGLE_SCRIPT_URL ? 'พบ ✅ (มีความยาว)' : 'ไม่พบ ❌ (กรุณาใส่ใน Environment ของ Render)'}`);
console.log(`- เช็ค GUILD_WEB_URL: ${process.env.GUILD_WEB_URL ? 'พบ ✅ (มีความยาว)' : 'ไม่พบ ❌ (กรุณาใส่ใน Environment ของ Render)'}`);
console.log('--- จบการตรวจสอบ ---');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
});

client.once(Events.ClientReady, (c) => {
  console.log(`✅ บอทกิลด์ BELLONA ออนไลน์พร้อมลุยในชื่อ: ${c.user.tag}`);
});

expressApp.get('/', (req, res) => {
  res.send('⚔️ บอท GVG กิลด์ BELLONA ทำงานอยู่ ⚔️');
});

client.login(process.env.DISCORD_BOT_TOKEN);

expressApp.listen(port, () => {
  console.log(`📡 เว็บเซิร์ฟเวอร์เปิดใช้งานที่พอร์ต: ${port}`);
});

// --- สิ้นสุดไฟล์ (ตรวจสอบวงเล็บปิดครบถ้วน) ---
