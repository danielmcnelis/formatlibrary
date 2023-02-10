
import { Client, GatewayIntentBits } from 'discord.js'
import { config } from '@fl/config'

const client = new Client({ 
    intents: [ 
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions, 
        GatewayIntentBits.DirectMessages
    ],
    partials: [
        'MESSAGE',
        'CHANNEL',
        'REACTION',
        'GUILD_MEMBER',
        'USER'
    ]
})

client.login(config.services.bot.token)

export { client }