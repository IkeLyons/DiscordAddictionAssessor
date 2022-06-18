const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { clientID, guildID, token } = require("./config.json");

const commands = [
  new SlashCommandBuilder().setName("leaderboard").setDescription("Get the leaderboard for most time spent in voice channels!"),
  new SlashCommandBuilder().setName("mytime").setDescription("Get how much time you have spent in voice channels."),
  new SlashCommandBuilder()
    .setName("time")
    .setDescription("Get how much time a specific user has spent in voice channels.")
    .addStringOption((option) =>
      option.setName("username").setDescription("the username of the user whose time in voice channels you want to know.").setRequired(true)
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "9" }).setToken(token);

rest
  .put(Routes.applicationCommands(clientID), { body: commands })
  .then(() => console.log("Successfully registered global application commands."))
  .catch(console.error);

rest
  .put(Routes.applicationGuildCommands(clientID, guildID), { body: commands })
  .then(() => console.log("Successfully registered dev server application commands."))
  .catch(console.error);
