
import { SlashCommandBuilder } from 'discord.js'
import { Deck, Event, Format, Player, Server, Team, Tournament } from '@fl/models'
import { composeBlogPost, composeThumbnails, displayDecks, displayReplays, generateMatchupData, publishDecks, isCommunityPartner, isMod } from '@fl/bot-functions'
import { Op } from 'sequelize'

export default {
    data: new SlashCommandBuilder()
        .setName('coverage')
        .setDescription('Mod Only - Post tournament coverage. 🖊️')
		.addStringOption(str =>
            str
                .setName('tournament')
                .setDescription('Enter tournament name or abbreviation.')
                .setRequired(true)
        )
        .setDMPermission(false),
    async execute(interaction) {
        await interaction.deferReply()
        const formatLibraryServer = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!isMod(formatLibraryServer, interaction.member) && !isCommunityPartner(interaction.member)) return await interaction.editReply({ content: `You do not have permission to do that.` })
        
        const input = interaction.options.getString('tournament')     
        const event = await Event.findOne({
            where: { 
                [Op.or]: {
                    name: {[Op.iLike]: input},
                    abbreviation: {[Op.iLike]: input}
                }
            },
            include: [Format, Player, Server, Team, Tournament]
        })

        if (!event) return await interaction.editReply({ content: `No event found.` })

        const count = await Tournament.count({
            where:{
                id: {[Op.or]: [event.primaryTournamentId, event.topCutTournamentId] },
                state: {[Op.not]: 'complete'}
            }
        })

        if (count) return await interaction.editReply({ content: `Please use the **/end** command first.` })
        if (event.display === false) await event.update({ display: true })

        await interaction.editReply({ content: `Generating coverage for ${event.name}. Please wait.` })
        await displayDecks(interaction, event)
        await publishDecks(interaction, event)
        await displayReplays(interaction, event)
        await composeThumbnails(interaction, event)

        if (event.tournament) {
            await generateMatchupData(interaction, event, event.tournament)
        }

        await composeBlogPost(interaction, event) 
        return
    }
}