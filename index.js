const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const express = require('express');

// ==========================================
// ⚙️ 1. สร้าง Web Server จิ๋วเพื่อให้ Render เข้ามาตรวจสอบสถานะ
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🤖 บอทกิลด์ BELLONA GVG ออนไลน์และพร้อมรบแล้วบน Render!');
});

app.listen(PORT, () => {
  console.log(`🌍 เซิร์ฟเวอร์ตรวจสอบสถานะทำงานอย่างสมบูรณ์แบบที่พอร์ต: ${PORT}`);
});

// ==========================================
// 🔍 2. ดึงรหัสความปลอดภัยจาก Environment Variables
// ==========================================
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
const GUILD_WEB_URL = process.env.GUILD_WEB_URL;

console.log("=== [BELLONA BOT STARTUP DIAGNOSTICS] ===");
console.log("NODE_VERSION:", process.version);
console.log("DISCORD_BOT_TOKEN:", DISCORD_BOT_TOKEN ? "✅ ตรวจพบรหัสแล้ว" : "❌ ไม่พบรหัส (MISSING)");
console.log("GOOGLE_SCRIPT_URL:", GOOGLE_SCRIPT_URL ? "✅ ตรวจพบลิงก์แล้ว" : "❌ ไม่พบลิงก์ (MISSING)");
console.log("GUILD_WEB_URL:", GUILD_WEB_URL ? "✅ ตรวจพบลิงก์แล้ว" : "❌ ไม่พบลิงก์ (MISSING)");
console.log("=========================================");

if (!DISCORD_BOT_TOKEN) {
  console.error("🚨 [FATAL ERROR]: ไม่สามารถรันบอทได้เนื่องจากขาด DISCORD_BOT_TOKEN!");
  process.exit(1); 
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`🤖 บอทกิลด์ BELLONA ออนไลน์พร้อมลุยในชื่อ: ${client.user.tag}`);
});

// ==========================================
// 📌 3. ระบบสร้างโพสต์แผงเช็คชื่อด้วยคำสั่ง !gvgpost
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.trim();

  if (content === '!gvgpost') {
    try {
      const embed = new EmbedBuilder()
        .setColor('#b83d1d') // สีแดงสนิมอัคนีธีมประจำกิลด์ Bellona
        .setTitle('⚔️ BELLONA GVG ULTIMATE SUITE ⚔️')
        .setDescription(
          '🛡️ **เปิดระบบรายงานตัวเข้าร่วมกิลด์วอร์วันนี้** 🛡️\n\n' +
          'กรุณาคลิกเลือกปุ่มสถานะด้านล่างนี้ ข้อมูลเช็คชื่อจะส่งตรงไปบันทึกลงใน Google Sheet และแสดงผลบนหน้าแผนปาร์ตี้ของเว็บกิลด์แบบเรียลไทม์ทันทีครับ!'
        )
        .addFields(
          { name: '🟢 มาร่วมรบ', value: 'กดเพื่อยืนยันการเข้าร่วมศึกวอร์วันนี้', inline: true },
          { name: '🟠 ขอลาพัก', value: 'กดหากติดภารกิจสำคัญไม่สามารถมาได้', inline: true },
          { name: '🔴 ขาดวอร์', value: 'กดระบุสถานะโดดวอร์วันนี้', inline: true }
        )
        .setFooter({ text: 'กิลด์ BELLONA EST. 2024 - ระบบรายงานตัวอัตโนมัติ' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('gvg_present')
          .setLabel('🟢 มาร่วมรบ')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('gvg_leave')
          .setLabel('🟠 ขอลาพัก')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('gvg_absent')
          .setLabel('🔴 ขาดวอร์')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setLabel('🌐 เปิดหน้าวางแผนกิลด์')
          .setURL(GUILD_WEB_URL || "https://vercel.com")
          .setStyle(ButtonStyle.Link)
      );

      await message.channel.send({ embeds: [embed], components: [row] });
      await message.delete(); // ลบข้อความสั่ง !gvgpost ของแอดมินออก
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการส่ง GVG Post:", err);
    }
  }

  // ==========================================
  // 📌 4. คำสั่งจัดการรายงานตัวแทนเพื่อนในกิลด์ (!มาแทน, !ลาแทน, !ขาดแทน)
  // ==========================================
  if (content.startsWith('!มาแทน') || content.startsWith('!ลาแทน') || content.startsWith('!ขาดแทน')) {
    const args = content.split(' ');
    const command = args[0];
    const charName = args.slice(1).join(' '); // รวมข้อความกรณีชื่อมีเว้นวรรค

    if (!charName) {
      return message.reply(`⚠️ **วิธีใช้งานคำสั่ง:** พิมพ์ \`${command} [ชื่อตัวละคร]\` เช่น \`${command} Marlochamp\``);
    }

    let statusText = 'มา';
    let statusEmoji = '🟢 มาร่วมรบ';
    
    if (command === '!ลาแทน') {
      statusText = 'ลา';
      statusEmoji = '🟠 ขอลาพัก';
    } else if (command === '!ขาดแทน') {
      statusText = 'ขาด';
      statusEmoji = '🔴 ขาดเช็คชื่อ';
    }

    const tempMsg = await message.reply(`📡 กำลังส่งข้อมูลของตัวละคร **"${charName}"** ไปยังฐานข้อมูลกิลด์...`);

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ charName, status: statusText })
      });
      const result = await response.json();

      if (result.status === 'success') {
        await tempMsg.edit(`👑 **ลงทะเบียนแทนสำเร็จ:** บันทึกสถานะของคุณ **"${charName}"** เป็น [**${statusEmoji}**] และอัปเดตข้อมูลในชีทเรียบร้อยแล้วครับ!`);
      } else {
        await tempMsg.edit(`❌ ไม่สามารถทำรายการได้เนื่องจาก: ${result.message}`);
      }
    } catch (err) {
      console.error(err);
      await tempMsg.edit(`❌ ไม่สามารถเชื่อมต่อกับ Google Sheet ได้ในขณะนี้ กรุณาตรวจสอบ Web App URL ของท่าน!`);
    }
  }
});

// ==========================================
// 📌 5. ระบบตรวจจับและประมวลผลเมื่อสมาชิกกดปุ่มเช็คชื่อ
// ==========================================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (['gvg_present', 'gvg_leave', 'gvg_absent'].includes(interaction.customId)) {
    const charName = interaction.member.nickname || interaction.member.user.displayName || interaction.user.username;
    
    let statusText = 'มา';
    let statusEmoji = '🟢 มาร่วมรบ';
    
    if (interaction.customId === 'gvg_leave') {
      statusText = 'ลา';
      statusEmoji = '🟠 ขอลาพัก';
    } else if (interaction.customId === 'gvg_absent') {
      statusText = 'ขาด';
      statusEmoji = '🔴 ขาดเช็คชื่อ';
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ charName, status: statusText })
      });
      const result = await response.json();

      if (result.status === 'success') {
        await interaction.editReply({
          content: `🎉 **บันทึกข้อมูลเรียบร้อย:** คุณทำการรายงานตัวในชื่อดิสคอร์ด **"${charName}"** ด้วยสถานะ [**${statusEmoji}**] และส่งขึ้นระบบเรียลไทม์เรียบร้อยแล้วครับ!`
        });
      } else {
        await interaction.editReply({
          content: `❌ บันทึกไม่สำเร็จเนื่องจาก: ${result.message}`
        });
      }
    } catch (err) {
      console.error(err);
      await interaction.editReply({
        content: `❌ การส่งข้อมูลล้มเหลว กรุณาติดต่อหัวหน้ากิลด์เพื่อตรวจสอบสถานะเซิร์ฟเวอร์ของบอท!`
      });
    }
  }
});

client.login(DISCORD_BOT_TOKEN);
```
eof

---
