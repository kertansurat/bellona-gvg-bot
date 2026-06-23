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
const ADMIN_ROLE = process.env.ADMIN_ROLE;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =========================
// READY
// =========================
client.once("ready", () => {
  console.log("Bot online:", client.user.tag);
});

// =========================
// COMMANDS
// =========================
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  const content = msg.content.trim();

  // REGISTER
  if (content === "!register") {
    const modal = new ModalBuilder()
      .setCustomId("register_modal")
      .setTitle("Register Character");

    const charInput = new TextInputBuilder()
      .setCustomId("char")
      .setLabel("Character Name")
      .setStyle(TextInputStyle.Short);

    const jobMenu = new StringSelectMenuBuilder()
      .setCustomId("job_select")
      .setPlaceholder("Select Job")
      .addOptions([
        { label: "Knight", value: "Knight" },
        { label: "Lord Knight", value: "Lord Knight" },
        { label: "Sniper", value: "Sniper" },
        { label: "Champion", value: "Champion" },
        { label: "Wizard", value: "Wizard" },
        { label: "High Wizard", value: "High Wizard" }
      ]);

    const row1 = new ActionRowBuilder().addComponents(charInput);

    await msg.reply({ content: "Use modal in interaction", ephemeral: true });
  }

  // GVG POST
  if (content === "!gvgpost") {
    const embed = new EmbedBuilder()
      .setTitle("⚔️ GVG CHECK IN")
      .setDescription("กดปุ่มเพื่อเช็คชื่อ")
      .setColor(0xd4af37);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("gvg_yes").setLabel("มา").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("gvg_no").setLabel("ลา").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("gvg_absent").setLabel("ขาด").setStyle(ButtonStyle.Danger)
    );

    await msg.channel.send({ embeds: [embed], components: [row] });
  }
});

// =========================
// INTERACTIONS
// =========================
client.on("interactionCreate", async (i) => {

  if (i.isButton()) {

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
        character: i.user.globalName || i.user.username,
        status
      })
    });

    const data = await res.json();

    return i.editReply("บันทึกแล้ว: " + data.status);
  }
});

client.login(TOKEN);
