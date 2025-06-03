
import { SlashCommandBuilder } from 'discord.js'    
import { isModerator, hasPartnerAccess, selectPairing, undoMatch, cancelPairing } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { Format, Pairing, Player, Server } from '@fl/models'
import { Op } from 'sequelize'

export default {
    data: new SlashCommandBuilder()
        .setName('cancel')
        .setDescription(`Cancel a rated pairing.`)
        .setDMPermission(false).setName('rated')
            .setDescription('Join the rated pool for any format. 🎮')
            .addStringOption(option =>
                option.setName('format')
                    .setDescription('Enter format name')
                    .setAutocomplete(true)
                    .setRequired(true)
            ),
        async autocomplete(interaction) {
            const focusedValue = interaction.options.getFocused()
            const formats = await Format.findAll({
                where: {
                    [Op.or]: {
                        name: {[Op.iLike]: focusedValue + '%'},
                        abbreviation: {[Op.iLike]: focusedValue + '%'}
                    },
                    category: {[Op.notIn]: ['discontinued', 'multiple']},
                    isHighlander: false
                },
                limit: 4,
                order: [["useSeasonalElo", "DESC"], ["sortPriority", "ASC"], ["isSpotlight", "DESC"], ["name", "ASC"]]
            }) 
            await interaction.respond(
                formats.map(f => ({ name: f.name, value: f.name })),
            )
        },                
    async execute(interaction) {
        try {
            await interaction.deferReply()
            const formatName = interaction.options.getString('format')
            const format = await Format.findOne({
                where: {
                    name: {[Op.iLike]: formatName + '%'}
                },
                order: [["useSeasonalElo", "DESC"], ["isPopular", "DESC"], ["isSpotlight", "DESC"], ["name", "ASC"]]
            })

            if (!format) return await interaction.editReply(`Hmm... I could not find a format called "${formatName}". Please try again.`)
            
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
            const serverId = server.hasInternalLadder || !format.hostedOneFl ? server.id : '414551319031054346'
            const pairings = await Pairing.findAll({ where: { formatId: format.id, serverId: serverId, status: 'active' }, order: [['createdAt', 'DESC']]})
            const authorIsMod = isModerator(server, interaction.member)
            if (!authorIsMod) return await interaction.editReply({ content: `You do not have permission to do that.`})
            const pairing = await selectPairing(interaction, pairings.slice(0, 25))
            return await cancelPairing(interaction, pairing.id)
        } catch (err) {
            console.log(err)
        }
    }
}
