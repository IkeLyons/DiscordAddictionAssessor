const { Client, Intents, ReactionCollector } = require("discord.js");
const ConnectionManager = require("./ConnectionManager.js")
const { token } = require("./config.json");

const client = new Client({ intents: [
	Intents.FLAGS.GUILD_VOICE_STATES,
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
	Intents.FLAGS.GUILD_INTEGRATIONS
]});

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

function paginate(array, page_size, page_number) {
	return array.slice((page_number - 1) * page_size, page_number * page_size).join("");
}

const time = 60000;
const emojiNext = '➡️';
const emojiPrevious = '⬅️';
const reactionArrows = [emojiPrevious, emojiNext];

function onCollect(emoji, message, i, pages) {
	if ((emoji.name === emojiPrevious) && (i > 0)) {
	 	message.edit(pages[--i]);
	} else if ((emoji.name === emojiNext) && (i < pages.length-1)) {
	  	message.edit(pages[++i]);
	}
	return i;
}

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isCommand()) return;
	const { commandName } = interaction;

	if (commandName === "leaderboard") {
		currentCons.refreshAll();

		const response = await currentCons.getLeaderboardResponse(interaction);
		paginatedResponse = []
		for(let i = 1; i*5 <= response.length+5; i++){
			paginatedResponse.push(paginate(response, 5, i));
		}

		const m = await interaction.reply({
			content: "Heres the board! React to view other pages.\n" + paginatedResponse[0],
			fetchReply: true
		});
		const collectorFilter = (reaction, user) => {
			return !user.bot && reactionArrows.includes(reaction.emoji.name);
		}
		m.react(emojiPrevious);
		m.react(emojiNext);
		const collector = m.createReactionCollector({ filter: collectorFilter, time: time });

		let collectorPage = 0;
		collector.on('collect', (reaction, user) => {
			collectorPage = onCollect(reaction.emoji, m, collectorPage, paginatedResponse)
		});
		collector.on('end', collected => {
			console.log(`Collected ${collected.size} items`);
		});
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
