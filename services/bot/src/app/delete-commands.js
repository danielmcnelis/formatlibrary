
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { config } from '@fl/config'

const token = config.services.bot.token
const clientId = config.services.bot.clientId
const guildId = '414551319031054346'
    
const rest = new REST({ version: '9' }).setToken(token);
rest.get(Routes.applicationGuildCommands(clientId, guildId))
    .then(data => {
        const promises = [];
        for (const command of data) {
            const deleteUrl = `${Routes.applicationGuildCommands(clientId, guildId)}/${command.id}`;
            promises.push(rest.delete(deleteUrl));
        }
        return Promise.all(promises);
    });
