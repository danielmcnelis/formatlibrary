
import { REST, Routes } from 'discord.js'
import { config } from '@fl/config'
import commands from '@fl/bot-commands'

const discordBotToken = config.services.bot.token
const clientId = config.services.bot.clientId
const guildId = '414551319031054346'

const formatLibraryCommandNames = Object.values(commands.formatLibraryCommands).map((command: any) => command.data.toJSON())
const globalCommandNames = Object.values(commands.globalCommands).map((command: any) => command.data.toJSON())

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(discordBotToken);

// and deploy your commands!
;(async () => {
	try {
		console.log(`Started refreshing ${formatLibraryCommandNames.length} Format Library application (/) commands.`)

		// The put method is used to fully refresh all commands in the guild with the current set
		await rest.put(
            Routes.applicationCommands(clientId),
            { body: formatLibraryCommandNames },
		);

		console.log(`Successfully reloaded ${formatLibraryCommandNames.length} Format Library application (/) commands.`);

		console.log(`Started refreshing ${globalCommandNames.length} application (/) commands.`)

		// The put method is used to fully refresh all commands in the guild with the current set
		await rest.put(
            Routes.applicationCommands(clientId),
            { body: globalCommandNames },
		);

		console.log(`Successfully reloaded ${globalCommandNames.length} global application (/) commands.`);        
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error)
	}

    process.exit(0)
})();

