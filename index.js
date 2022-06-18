const { Client, Intents } = require("discord.js");
const { token } = require("./config.json");

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_INTEGRATIONS] });

client.once("ready", () => {
	console.log("Ready!");
});

client.on("interactionCreate", async (interaction) => {
	//   if (!interaction.isCommand()) return;
	console.log(interaction);
	const { commandName } = interaction;

	if (commandName === "leaderboard") {
		await interaction.reply("heres the board!");
	}
	else if (commandName === "time") {
		await interaction.reply("user");
	}
	else if (commandName === "mytime") {
		console.log("time");
		await interaction.reply("mytime");
	}
});

client.login(token);
