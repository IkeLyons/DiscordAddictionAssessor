const { Client, Intents } = require("discord.js");
const DBClient = require("pg");
const { token, dbUser, dbHost, dbDatabase, dbPassword, dbPort } = require("./config.json");

const pool = new DBClient.Pool({
	user: dbUser,
	host: dbHost,
	database: dbDatabase,
	password: dbPassword,
	port: dbPort,
});
pool.connect();
pool.query('SELECT NOW()', (err, res) => {
	console.log(err, res);
	pool.end();
});

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
	console.log(newState.member.user.id);
	if (newState.channelId === null) {
		console.log('user left channel', oldState.channelID);
	}
	else if (oldState.channelId === null) {
		console.log('user joined channel', newState.channelID);
	}
});

client.login(token);
