const { Client, Intents } = require("discord.js");
const { token } = require("./config.json");

const client = new Client({ intents: [Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_INTEGRATIONS] });

client.once("ready", () => {
	console.log("Ready!");
});

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isCommand()) return;
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

client.on('voiceStateUpdate', (oldState, newState) => {
	// console.log(oldState);
	// console.log(newState);
	if (newState.channelId === null) {
		console.log('user left channel', oldState.channelID);
	}
	else if (oldState.channelId === null) {
		console.log('user joined channel', newState.channelID);
	}
});

client.login(token);
