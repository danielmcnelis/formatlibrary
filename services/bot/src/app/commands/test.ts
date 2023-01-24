
import { SlashCommandBuilder } from 'discord.js'
import { isProgrammer } from '../functions/utility'
import { updateDeckTypes } from '../functions/chron'
import * as emojis from '../emojis/emojis'
import { client } from '../static/clients.js'

export default {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Performs a test. 🧪'),
    async execute(interaction) {
        if (isProgrammer(interaction.member)) {
            updateDeckTypes(client)
            await interaction.reply(emojis.yellow)
        } else {
            await interaction.reply('🧪')
        }
    }
}