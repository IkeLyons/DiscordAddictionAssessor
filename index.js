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

// {userid:[timeSpentInMilliseconds, timeJoined]}
const currentlyConnected = {};

client.on('voiceStateUpdate', (oldState, newState) => {
	if (newState.channelId === null) {
		console.log('user left channel', oldState.channelID);
		const currentTime = new Date();
		const timeSpent = Math.abs(currentlyConnected[newState.member.user.id][1] - currentTime);
		const currentTotal = currentlyConnected[newState.member.user.id][0];
		// const updatedTime = Math.round(((Math.abs(currentTotal + timeSpent)) / (1000 * 60 * 60)) * 10) / 10;
		const updatedTime = ((Math.abs(currentTotal + timeSpent)) / (1000 * 60 * 60));
		pool.query(`UPDATE time_spent SET hours=${updatedTime} WHERE(user_id=${newState.member.user.id} AND server_id=${newState.guild.id})`, (err, res) => {
			console.log(err, res);
		});
		// console.log(updatedTime);
	}
	else if (oldState.channelId === null) {
		console.log('user joined channel', newState.channelID);
		pool.query(`SELECT * FROM time_spent WHERE(user_id=${newState.member.user.id} AND server_id=${newState.guild.id})`, (err, res) => {
			console.log(err);
			if (res.rowCount === 0) {
				pool.query(`INSERT INTO time_spent (user_id, server_id, hours) VALUES (${newState.member.user.id}, ${newState.guild.id}, 0)`, (err2, res2) => {
					console.log('Insert');
					console.log(err2, res2);
				});
			}
			else if (res.rowCount === 1) {
				const dur = (res.rows[0].hours / (1000 * 60 * 60)) % 24;
				console.log(dur);
				currentlyConnected[newState.member.user.id] = [dur, new Date()];
			}
			else {
				console.log('Duplicate Entry, Something went wrong');
				return;
			}
		});
	}
});

client.login(token);