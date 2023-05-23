const { Client, Intents } = require("discord.js");
const ConnectionManager = require("./ConnectionManager.js")
const { token } = require("./config.json");

const client = new Client({ intents: [Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_INTEGRATIONS] });

client.once("ready", () => {
	console.log("Starting up Discord Addiction Assessor!");
});

const currentCons = new ConnectionManager();

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

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isCommand()) return;
	const { commandName } = interaction;

	if (commandName === "leaderboard") {
		currentCons.refreshAll();

		const response = await currentCons.getLeaderboardResponse(interaction);

		await interaction.reply("heres the board!\n" + response);

	}
	else if (commandName === "time") {
		const option = interaction.options.get("username");
		const inputtedUser = getUserFromMention(option.value);
		if (!inputtedUser) {
			await interaction.reply("Please @ mention the user you would like to search");
			return;
		}
		await currentCons.refreshUser(inputtedUser, interaction.guild.id);
		const timeText = await currentCons.getUser(inputtedUser, interaction.guild.id);
		await interaction.reply(`${option.value} has spent ${timeText} wasting away in this server's voice channels`);
	}
	else if (commandName === "mytime") {
		await currentCons.refreshUser(interaction.member.user.id, interaction.guild.id);
		const timeString = await currentCons.getUser(interaction.member.user.id, interaction.guild.id);
		await interaction.reply(`You have spent ${timeString} wasting away in this server's voice channels`);
	}
});

client.on('voiceStateUpdate', (oldState, newState) => {
	if (newState.channelId === null) { // User left a channel
		currentCons.deleteUser(newState.member.user.id, newState.guild.id);
	}
	else if (oldState.channelId === null) { // User joined a channel
		// addUser(newState.member.user.id, newState.guild.id);
		currentCons.addUser(newState.member.user.id, newState.guild.id);
	}
	else { //User moved channels
		if (newState.channelId === newState.guild.afkChannelId) { // User moved to afk channel
			currentCons.deleteUser(newState.member.user.id, newState.guild.id);
		}
		else if (!currentCons.isUserConnected(newState.member.user.id)) {
			currentCons.addUser(newState.member.user.id, newState.guild.id);
		}
	}
});

client.login(token);
