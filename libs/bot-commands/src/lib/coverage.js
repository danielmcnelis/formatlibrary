
import { SlashCommandBuilder } from 'discord.js'
import { Event, Format, Player, Server, Team, Tournament } from '@fl/models'
import { composeBlogPost, composeThumbnails, displayDecks, displayReplays, generateMatchupData, publishDecks, isCommunityPartner, isModerator } from '@fl/bot-functions'
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
        try {
            await interaction.deferReply()
            const formatLibraryServer = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            if (!isModerator(formatLibraryServer, interaction.member) && !isCommunityPartner(interaction.member)) return await interaction.editReply({ content: `You do not have permission to do that.` })
            
            const input = interaction.options.getString('tournament')     
            const event = await Event.findOne({
                where: { 
                    [Op.or]: {
                        name: {[Op.iLike]: input},
                        abbreviation: {[Op.iLike]: input}
                    }
                },
                include: [Format, { model: Player, as: 'winner' }, Server, { model: Team, as: 'winningTeam' }, { model: Tournament, as: 'primaryTournament' }]
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

            if (event.primaryTournament) {
                await generateMatchupData(interaction, event, event.primaryTournament)
            }

            await composeBlogPost(interaction, event) 
            return
        } catch (err) {
            console.log(err)
        }
    }
}