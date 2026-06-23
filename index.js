const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder
} = require("discord.js");

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const API = process.env.GOOGLE_SCRIPT_URL;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =========================
// ROOC JOB LIST
// =========================
const jobs = [
  "Knight","Lord Knight","Crusader","Paladin",
  "Wizard","High Wizard","Sage","Professor",
  "Sniper","Clown","Bard",
  "Champion","High Priest","Monk",
  "Whitesmith","Creator",
  "Assassin Cross","Stalker"
];

// =========================
// READY
// =========================
client.once("ready", () => {
  console.log("BOT READY:", client.user.tag);
});

// =========================
// COMMANDS
// =========================
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  const args = msg.content.split(" ");
  const cmd = args[0];

  // REGISTER
  if (cmd === "!register") {

    const jobMenu = new StringSelectMenuBuilder()
      .setCustomId("job_select")
      .setPlaceholder("Select Job")
      .addOptions(jobs.map(j => ({
        label: j,
        value: j
      })));

    const row = new ActionRowBuilder().addComponents(jobMenu);

    const modal = new ModalBuilder()
      .setCustomId("register_modal")
      .setTitle("Register Character");

    const charInput = new TextInputBuilder()
      .setCustomId("char")
      .setLabel("Character Name")
      .setStyle(TextInputStyle.Short);

    const row2 = new ActionRowBuilder().addComponents(charInput);

    msg.channel.send({ content: "เลือกอาชีพ + กรอกชื่อ (ระบบกำลังพัฒนา flow เต็ม)" });
  }

  // GVG POST
  if (cmd === "!gvgpost") {
    const embed = new EmbedBuilder()
      .setTitle("⚔️ ROOC GVG CHECK IN")
      .setColor(0xd4af37);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("gvg_yes").setLabel("มา").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("gvg_no").setLabel("ลา").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("gvg_absent").setLabel("ขาด").setStyle(ButtonStyle.Danger)
    );

    msg.channel.send({ embeds: [embed], components: [row] });
  }
});

// =========================
// INTERACTIONS
// =========================
client.on("interactionCreate", async (i) => {

  if (!i.isButton()) return;

  let status = "มา";
  if (i.customId === "gvg_no") status = "ลา";
  if (i.customId === "gvg_absent") status = "ขาด";

  await i.deferReply({ ephemeral: true });

  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "attendance",
      discordId: i.user.id,
      discordName: i.user.username,
      character: i.user.username,
      status
    })
  });

  const data = await res.json();

  i.editReply(`บันทึกแล้ว: ${data.status}`);
});

client.login(TOKEN);
