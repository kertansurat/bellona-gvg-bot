const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

// =============================
// ⚙️ Environment Variables
// =============================
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
const GUILD_WEB_URL = process.env.GUILD_WEB_URL;

if (!DISCORD_BOT_TOKEN) {
  console.error('❌ ไม่พบ DISCORD_BOT_TOKEN');
  process.exit(1);
}

if (!GOOGLE_SCRIPT_URL) {
  console.error('❌ ไม่พบ GOOGLE_SCRIPT_URL');
  process.exit(1);
}

if (!GUILD_WEB_URL) {
  console.error('❌ ไม่พบ GUILD_WEB_URL');
  process.exit(1);
}

// =============================
// 🤖 Discord Client
// =============================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =============================
// 🚀 Bot Ready
// =============================
client.once('ready', () => {
  console.log(`🤖 บอทออนไลน์แล้ว: ${client.user.tag}`);
});

// =============================
// 📌 Message Commands
// =============================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.trim();

  // =====================================
  // !gvgpost
  // =====================================
  if (content === '!gvgpost') {
    const embed = new EmbedBuilder()
      .setColor('#d4af37')
      .setTitle('⚔️ BELLONA GVG ULTIMATE SUITE ⚔️')
      .setDescription(
        '⚔️ **เปิดรายงานตัวเข้าร่วมกิลด์วอร์วันนี้** ⚔️\n\n' +
        'กรุณากดปุ่มด้านล่างเพื่อทำการเช็คชื่อ ระบบจะส่งข้อมูลไปยัง Google Sheet และหน้าเว็บกิลด์โดยอัตโนมัติ'
      )
      .addFields(
        {
          name: '🟢 มาร่วมรบ',
          value: 'พร้อมเข้าร่วมกิลด์วอร์',
          inline: true
        },
        {
          name: '🟠 ขอลาหยุด',
          value: 'ติดภารกิจ ไม่สามารถเข้าร่วมได้',
          inline: true
        },
        {
          name: '🔴 ขาดวอร์',
          value: 'ไม่เข้าร่วมวอร์',
          inline: true
        }
      )
      .setFooter({
        text: 'BELLONA Guild Attendance System'
      })
      .setTimestamp();

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

    await message.channel.send({
      embeds: [embed],
      components: [row]
    });

    try {
      await message.delete();
    } catch (err) {
      console.log('⚠️ ไม่สามารถลบข้อความคำสั่งได้');
    }

    return;
  }

  // =====================================
  // !มาแทน
  // !ลาแทน
  // !ขาดแทน
  // =====================================
  if (
    content.startsWith('!มาแทน') ||
    content.startsWith('!ลาแทน') ||
    content.startsWith('!ขาดแทน')
  ) {
    const args = content.split(' ');
    const command = args[0];
    const charName = args.slice(1).join(' ');

    if (!charName) {
      return message.reply(
        `⚠️ วิธีใช้:\n${command} [ชื่อตัวละคร]\nตัวอย่าง: !มาแทน Marlochamp`
      );
    }

    let statusText = 'มา';
    let statusEmoji = '🟢 มาร่วมรบ';

    if (command === '!ลาแทน') {
      statusText = 'ลา';
      statusEmoji = '🟠 ขอลาหยุด';
    }

    if (command === '!ขาดแทน') {
      statusText = 'ขาด';
      statusEmoji = '🔴 ขาดวอร์';
    }

    const tempMsg = await message.reply(
      `📡 กำลังบันทึกข้อมูล "${charName}" ...`
    );

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          charName,
          status: statusText
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        await tempMsg.edit(
          `✅ บันทึกสำเร็จ\n` +
          `👤 ${charName}\n` +
          `📋 ${statusEmoji}`
        );
      } else {
        await tempMsg.edit(
          `❌ ไม่สามารถบันทึกข้อมูลได้\n${result.message}`
        );
      }
    } catch (error) {
      console.error(error);

      await tempMsg.edit(
        '❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Google Apps Script'
      );
    }

    return;
  }
});

// =============================
// 📌 Button Interactions
// =============================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (
    ![
      'gvg_present',
      'gvg_leave',
      'gvg_absent'
    ].includes(interaction.customId)
  ) {
    return;
  }

  const charName =
    interaction.member?.nickname ||
    interaction.member?.displayName ||
    interaction.user.globalName ||
    interaction.user.username;

  let statusText = 'มา';
  let statusEmoji = '🟢 มาร่วมรบ';

  if (interaction.customId === 'gvg_leave') {
    statusText = 'ลา';
    statusEmoji = '🟠 ขอลาหยุด';
  }

  if (interaction.customId === 'gvg_absent') {
    statusText = 'ขาด';
    statusEmoji = '🔴 ขาดวอร์';
  }

  await interaction.deferReply({
    ephemeral: true
  });

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        charName,
        status: statusText
      })
    });

    const result = await response.json();

    if (result.status === 'success') {
      await interaction.editReply({
        content:
          `✅ บันทึกข้อมูลเรียบร้อย\n\n` +
          `👤 ตัวละคร: **${charName}**\n` +
          `📋 สถานะ: **${statusEmoji}**`
      });
    } else {
      await interaction.editReply({
        content:
          `❌ ไม่สามารถบันทึกข้อมูลได้\n${result.message}`
      });
    }
  } catch (error) {
    console.error(error);

    await interaction.editReply({
      content:
        '❌ ไม่สามารถเชื่อมต่อ Google Apps Script ได้'
    });
  }
});

// =============================
// 🛡 Error Handling
// =============================
process.on('unhandledRejection', (error) => {
  console.error('UNHANDLED REJECTION:', error);
});

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
});

// =============================
// 🔐 Login
// =============================
client.login(DISCORD_BOT_TOKEN);
