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
	console.log("Starting up Discord Addiction Assessor!");
});

// {userid:[timeSpentInMilliseconds, timeJoined, serverId]}
const currentlyConnected = {};

function addUser(userId, serverId) {
	const currentTime = new Date();
	pool.query(`SELECT * FROM time_spent WHERE(user_id=${userId} AND server_id=${serverId})`, (err, res) => {
		console.log(err);
		if (res.rowCount === 0) {
			pool.query(`INSERT INTO time_spent (user_id, server_id, hours) VALUES (${userId}, ${serverId}, 0)`, (err2, res2) => {
				console.log(err2, res2);
			});
		}
		else if (res.rowCount === 1) {
			currentlyConnected[userId] = [res.rows[0].hours, currentTime, serverId];
		}
		else {
			console.log('Duplicate Entry, Something went wrong');
			return;
		}
	});
}

function deleteUser(userId, serverId) {
	if (currentlyConnected[userId] != undefined) {
		const currentTime = new Date();
		const updatedTime = getTimeSpent(userId, currentTime);
		pool.query(`UPDATE time_spent SET hours=${updatedTime} WHERE(user_id=${userId} AND server_id=${serverId})`, (err) => {
			console.log(err);
		});
		delete currentlyConnected[userId];
	}
}

async function refreshUser(userId, serverId) {
	if (currentlyConnected[userId] != undefined) {
		const currentTime = new Date();
		const updatedTime = getTimeSpent(userId, currentTime);	
		const response = await pool.query(`UPDATE time_spent SET hours=${updatedTime} WHERE(user_id=${userId} AND server_id=${serverId})`);
		currentlyConnected[userId] = [updatedTime, currentTime, serverId];
		return response;
	}
}

async function getUser(userId, serverId) {
	const response = await pool.query(`SELECT user_id, server_id, hours FROM time_spent WHERE(user_id=${userId} AND server_id=${serverId})`);
	let timeSpentString = "";
	for (const user of response.rows) {
		const seconds = Math.floor((user.hours * 60 * 60) % 60);
		const minutes = Math.floor((user.hours * 60) % 60);
		const hours = Math.floor(user.hours);
		timeSpentString = `${hours} hours, ${minutes} minutes, and ${seconds} seconds`;
	}
	return timeSpentString;
}

function getUserFromMention(mention) {
	if (!mention) return;

	if (mention.startsWith('<@') && mention.endsWith('>')) {
		mention = mention.slice(2, -1);

		if (mention.startsWith('!')) {
			mention = mention.slice(1);
		}

		return mention;
	}
}

function getTimeSpent(user, currentTime){
	const timeSpent = Math.abs(currentlyConnected[user][1] - currentTime) / (1000 * 60 * 60);
	const currentTotal = currentlyConnected[user][0];
	return Math.abs(currentTotal + timeSpent);
}

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isCommand()) return;
	const { commandName } = interaction;

	if (commandName === "leaderboard") {
		// Refresh for everyone currently connected
		for (const user in currentlyConnected) {
			const serverid = currentlyConnected[user][2];
			await refreshUser(user, serverid);
		}

		let leaderboard = "";
		const response = await pool.query(`SELECT user_id, server_id, hours FROM time_spent WHERE(server_id=${interaction.guild.id})ORDER BY hours DESC LIMIT 5`);
		let i = 0;
		for (const user of response.rows) {
			i++;
			const seconds = Math.floor((user.hours * 60 * 60) % 60);
			const minutes = Math.floor((user.hours * 60) % 60);
			const hours = Math.floor(user.hours);
			const username = await interaction.guild.members.fetch(user.user_id);
			leaderboard = leaderboard + `#${i}:${username}\t\t\t${hours} hours,\t${minutes} minutes,\t${seconds} seconds\n`;
		}

		await interaction.reply("heres the board!\n" + leaderboard);
	}
	else if (commandName === "time") {
		const option = interaction.options.get("username");
		const inputtedUser = getUserFromMention(option.value);
		if (!inputtedUser) {
			await interaction.reply("Please @ mention the user you would like to search");
			return;
		}
		await refreshUser(inputtedUser, interaction.guild.id);
		const timeText = await getUser(inputtedUser, interaction.guild.id);
		await interaction.reply(`${option.value} has spent ${timeText} wasting away in this server's voice channels`);
	}
	else if (commandName === "mytime") {
		await refreshUser(interaction.member.user.id, interaction.guild.id);
		const timeString = await getUser(interaction.member.user.id, interaction.guild.id);
		await interaction.reply(`You have spent ${timeString} wasting away in this server's voice channels`);
	}
});

client.on('voiceStateUpdate', (oldState, newState) => {
	if (newState.channelId === null) {
		// User left a channel
		deleteUser(newState.member.user.id, newState.guild.id);
	}
	else if (oldState.channelId === null) {
		// User joined a channel
		addUser(newState.member.user.id, newState.guild.id);
	}
	else {
		// User moved channels
		if (newState.channelId === newState.guild.afkChannelId) {
			// User moved to afk channel
			deleteUser(newState.member.user.id, newState.guild.id);
		}
		else if (!(newState.member.user.id in currentlyConnected)) {
			addUser(newState.member.user.id, newState.guild.id);
		}
	}
});

client.login(token);
