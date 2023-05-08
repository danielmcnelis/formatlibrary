
import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js'
import { Entry, Format, Player, Server, Tournament } from '@fl/models'
import { Op } from 'sequelize'
import { selectTournamentForDeckCheck } from '@fl/bot-functions'
import { drawDeck, isMod } from '@fl/bot-functions'

export default {
    data: new SlashCommandBuilder()
        .setName('deck')
        .setDescription(`Check tournament deck. 🧐`)
        .addUserOption(option =>
            option
                .setName('player')
                .setDescription('The tournament player to check.')
                .setRequired(false)
        ),
    async execute(interaction) {
        await interaction.deferReply()
        const user = interaction.options.getUser('player')
        
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })
        
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })

        if (!format) return
        
        const tournaments = await Tournament.findAll({
            where: { 
                state: {[Op.or]: ["pending", "standby", "underway"]}, 
                formatName: format.name,
                serverId: interaction.guildId 
            },
            order: [["createdAt", "ASC"]]
        })

        if (!user) return await interaction.editReply({ content: `Player not found.` })
        const discordId = user.id
        if (!isMod(server, interaction.member)) return await interaction.editReply({ content: `You do not have permission to do that.` })

        const player = await Player.findOne({ where: { discordId: discordId } })
        if (!player) return

        const entries = []

        for (let i = 0; i < tournaments.length; i++) {
            try {
                const tournament = tournaments[i]
                const entry = await Entry.findOne({
                    where: {
                        playerId: player.id,
                        tournamentId: tournament.id
                    },
                    include: Tournament
                })

                if (entry) entries.push(entry)
            } catch (err) {
                console.log(err)
            }
        }

        const entry = await selectTournamentForDeckCheck(interaction, entries, format)
        if (!entry) return

        interaction.editReply({ content: `Please check your DMs.` })
        const deckAttachments = await drawDeck(entry.ydk) || []
        const ydkFile = new AttachmentBuilder(Buffer.from(entry.ydk), { name: `${player.discordName}#${player.discriminator}_${entry.tournament.abbreviation || entry.tournament.name}.ydk` })
        return await interaction.member.send({ content: `${player.name}'s deck for ${entry.tournament.name} is:\n<${entry.url}>`, files: [...deckAttachments, ydkFile]}).catch((err) => console.log(err))
    }
}