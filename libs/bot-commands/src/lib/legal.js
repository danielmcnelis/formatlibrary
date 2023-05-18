
import { SlashCommandBuilder } from 'discord.js'
import { Format, Server } from '@fl/models'
import { checkDeckList } from '@fl/bot-functions'

export default {
    data: new SlashCommandBuilder()
        .setName('legal')
        .setDescription('Check deck legality. 👍'),
    async execute(interaction) {
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        if (!format) return await interaction.reply({ content: `Try using /legal in channels like: <#414575168174948372> or <#629464112749084673>.`})
        if (format.category !== 'TCG') return await interaction.reply(`Sorry, ${format.category} formats are not supported at this time.`)
        interaction.reply(`Please check your DMs.`)
        const issues = await checkDeckList(interaction.member, format)

        const { illegalCards, forbiddenCards, limitedCards, semiLimitedCards, unrecognizedCards } = issues
        if (illegalCards.length || forbiddenCards.length || limitedCards.length || semiLimitedCards.length) {      
            let response = [`I'm sorry, ${interaction.user.username}, your deck is not legal for ${format.name} Format. ${server.emoji || format.emoji}`]
            if (illegalCards.length) response = [...response, `\nThe following cards are not included in this format:`, ...illegalCards]
            if (forbiddenCards.length) response = [...response, `\nThe following cards are forbidden:`, ...forbiddenCards]
            if (limitedCards.length) response = [...response, `\nThe following cards are limited:`, ...limitedCards]
            if (semiLimitedCards.length) response = [...response, `\nThe following cards are semi-limited:`, ...semiLimitedCards]
            
            for (let i = 0; i < response.length; i += 50) {
                if (response[i+50] && response[i+50].startsWith("\n")) {
                    interaction.member.send({ content: response.slice(i, i+51).join('\n').toString()}).catch((err) => console.log(err))
                    i++
                } else {
                    interaction.member.send({ content: response.slice(i, i+50).join('\n').toString()}).catch((err) => console.log(err))
                }
            }
        } else if (unrecognizedCards.length) {
            let response = `I'm sorry, ${interaction.user.username}, the following card IDs were not found in our database:\n${unrecognizedCards.join('\n')}`
            response += `\n\nThese cards are either alternate artwork, new to the TCG, OCG only, or incorrect in our database. Please contact the Tournament Organizer or the Admin if you can't resolve this.`
            return await interaction.member.send({ content: response.toString() }).catch((err) => console.log(err))
        } else {
            return await interaction.member.send({ content: `Congrats, your ${format.name} Format deck is perfectly legal! ${format.emoji}`}).catch((err) => console.log(err))
        }
    }
}