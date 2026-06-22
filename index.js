const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// ⚙️ ส่วนตั้งค่าเริ่มต้นสำหรับการเชื่อมต่อระบบกิลด์ BELLONA ⚔️
const DISCORD_BOT_TOKEN = "ใส่_TOKEN_บอทดีสคอร์ดของคุณตรงนี้";
const GOOGLE_SCRIPT_URL = "ใส่_WEB_APP_URL_ของ_Google_Apps_Script_ตรงนี้";
const GUILD_WEB_URL = "ใส่_URL_หน้าเว็บ_Vercel_หรือ_Netlify_ของคุณตรงนี้";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`🤖 บอทกิลด์ BELLONA ออนไลน์พร้อมศึกแล้วในชื่อ: ${client.user.tag}`);
});

// 📌 1. ระบบรับฟังคำสั่งสร้าง "โพสต์สำหรับรายงานตัววอร์ประจำวัน"
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.trim();

  // พิมพ์คำสั่ง !gvgpost เพื่อสร้างกล่องปุ่มกดรายงานตัว
  if (content === '!gvgpost') {
    // 1.1 สร้าง Embed แบนเนอร์แสดงรายละเอียดโพสต์
    const embed = new EmbedBuilder()
      .setColor('#d4af37') // สีทองธีมกิลด์ Bellona
      .setTitle('⚔️ BELLONA GVG ULTIMATE SUITE ⚔️')
      .setDescription(
        '⚔️ **เปิดรายงานตัวเข้าร่วมกิลด์วอร์วันนี้** ⚔\n\n' +
        'กรุณากดคลิกปุ่มด้านล่างเพื่อทำการเช็คชื่อของตนเองทันที ข้อมูลจะส่งตรงเข้าสู่ Google Sheet และนำขึ้นหน้าเว็บวางแผนแบบเรียลไทม์ครับ!'
      )
      .addFields(
        { name: '🟢 มาร่วมรบ', value: 'กดเมื่อพร้อมลุยสงครามกิลด์วอร์วันนี้', inline: true },
        { name: '🟠 ขอลาหยุด', value: 'กดเมื่อติดภารกิจจำเป็น ไม่สามารถมาได้', inline: true }
      )
      .setFooter({ text: 'กิลด์ BELLONA EST. 2024 - ระบบรายงานตัวออโต้' })
      .setTimestamp();

    // 1.2 สร้างปุ่ม 3 ปุ่มสีสันชัดเจน และ 1 ปุ่มลิงก์เชื่อมต่อหน้าเว็บ
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('gvg_present')
        .setLabel('🟢 มาร่วมรบ')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('gvg_leave')
        .setLabel('🟠 ขอลาหยุด')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('gvg_absent')
        .setLabel('🔴 ขาดวอร์')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setLabel('🌐 เปิดหน้าวางแผนกิลด์')
        .setURL(GUILD_WEB_URL)
        .setStyle(ButtonStyle.Link)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
    await message.delete(); // ลบคำสั่งพิมพ์ !gvgpost ออกเพื่อไม่ให้เกะกะแชท
  }

  // 📌 2. ระบบคำสั่งพิมพ์ "รายงานตัวแทนผู้อื่น" (มาแทน / ลาแทน / ขาดแทน)
  if (content.startsWith('!มาแทน') || content.startsWith('!ลาแทน') || content.startsWith('!ขาดแทน')) {
    const args = content.split(' ');
    const command = args[0];
    const charName = args.slice(1).join(' '); // รวมชื่อตัวละครที่เว้นวรรค

    if (!charName) {
      return message.reply(`⚠️ **วิธีใช้คำสั่ง:** พิมพ์ \`${command} [ชื่อตัวละคร]\` เช่น \`!มาแทน Marlochamp\``);
    }

    let statusText = 'มา';
    let statusEmoji = '🟢 มาร่วมรบ';
    if (command === '!ลาแทน') {
      statusText = 'ลา';
      statusEmoji = '🟠 ขอลาพัก';
    } else if (command === '!ขาดแทน') {
      statusText = 'ขาด';
      statusEmoji = '🔴 ขาดวอร์';
    }

    const tempMsg = await message.reply(`📡 กำลังบันทึกข้อมูลแทนคุณ **"${charName}"**...`);

    try {
      // ส่งข้อมูลเข้าสะพานเชื่อม Google Apps Script
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ charName, status: statusText })
      });
      const result = await response.json();

      if (result.status === 'success') {
        await tempMsg.edit(`👑 **ทำรายการแทนสำเร็จ:** ปรับปรุงสถานะล่าสุดของคุณ **"${charName}"** เป็น [**${statusEmoji}**] และบวกประวัติลงชีทกิลด์ให้แล้วครับ!`);
      } else {
        await tempMsg.edit(`❌ ไม่สามารถทำรายการได้เนื่องจาก: ${result.message}`);
      }
    } catch (err) {
      console.error(err);
      await tempMsg.edit(`❌ เกิดข้อผิดพลาดทางเครือข่าย ไม่สามารถเชื่อมต่อไปยังกูเกิ้ลชีทได้ในขณะนี้!`);
    }
  }
});

// 📌 3. ระบบจับสัญญาณการกดคลิกปุ่มของสมาชิก
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  // ตรวจสอบ Custom ID ของปุ่มกด
  if (['gvg_present', 'gvg_leave', 'gvg_absent'].includes(interaction.customId)) {
    // ดึงชื่อเล่นในเซิร์ฟเวอร์ดิสคอร์ด (Nickname) หากไม่มีให้ดึงชื่อโปรไฟล์จริงแทน
    const charName = interaction.member.nickname || interaction.member.user.displayName || interaction.user.username;
    
    let statusText = 'มา';
    let statusEmoji = '🟢 มาร่วมรบ';
    
    if (interaction.customId === 'gvg_leave') {
      statusText = 'ลา';
      statusEmoji = '🟠 ขอลาหยุด';
    } else if (interaction.customId === 'gvg_absent') {
      statusText = 'ขาด';
      statusEmoji = '🔴 ขาดวอร์';
    }

    // บังคับตอบกลับชั่วคราวแบบ "ephemeral" (เห็นคนเดียว) เพื่อให้ไม่เป็นการรบกวนคนอื่น
    await interaction.deferReply({ ephemeral: true });

    try {
      // ส่งข้อมูลไปยัง Google Sheets API ของคุณ
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ charName, status: statusText })
      });
      const result = await response.json();

      if (result.status === 'success') {
        await interaction.editReply({
          content: `🎉 **บันทึกสำเร็จ:** คุณทำการรายงานตัวในชื่อ **"${charName}"** ด้วยสถานะ [**${statusEmoji}**] และอัปเดตสถิติสะสมลง Google Sheet เรียบร้อยแล้วครับ!`
        });
      } else {
        await interaction.editReply({
          content: `❌ บันทึกไม่สำเร็จเนื่องจาก: ${result.message}`
        });
      }
    } catch (err) {
      console.error(err);
      await interaction.editReply({
        content: `❌ เชื่อมต่อ Google Sheet ล้มเหลว กรุณารอระบบพาสสิทธิ์ประมวลผลสักครู่!`
      });
    }
  }
})
