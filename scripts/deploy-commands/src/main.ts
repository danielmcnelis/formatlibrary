
import { REST, Routes } from 'discord.js'
// import * as fs from 'fs'
import { config } from '@fl/config'
import commands from '@fl/bot-commands'

const discordBotToken = config.services.bot.token
const clientId = config.services.bot.clientId

// const guildId = '414551319031054346'
// Grab all the command files from the commands directory you created earlier
// const commandFiles = fs.readdirSync('./services/bot/src/app/commands').filter(file => file.endsWith('.js'))

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
// for (const file of commandFiles) {
//     if (file.includes('index')) continue
// 	const command = require(`./services/bot/src/app/commands/${file}`)
// 	commands.push(command.data.toJSON())
// }

const commandNames = Object.values(commands).map((command: any) => command.data.toJSON())

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(discordBotToken);

// and deploy your commands!
;(async () => {
	try {
		console.log(`Started refreshing ${commandNames.length} application (/) commands.`)

		// The put method is used to fully refresh all commands in the guild with the current set
		await rest.put(
            Routes.applicationCommands(clientId),
            { body: commandNames },
		);

		console.log(`Successfully reloaded ${commandNames.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error)
	}

    process.exit(0)
})();

