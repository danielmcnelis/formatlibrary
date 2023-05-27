
import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js'
import { Entry, Format, Player, Server, Tournament } from '@fl/models'
import { hasPartnerAccess, selectTournamentForDeckCheck } from '@fl/bot-functions'
import { drawDeck, isMod } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'

export default {
    data: new SlashCommandBuilder()
        .setName('deck')
        .setDescription(`Check tournament deck. 🧐`)
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Tag the user to check.')
                .setRequired(false)
        ),
    async execute(interaction) {
        await interaction.deferReply()
        const discordId = interaction.options.getUser('user')?.id || interaction.user.id
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasPartnerAccess(server)) return await interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (discordId !== interaction.user.id && !isMod(server, interaction.member)) return await interaction.editReply({ content: `You do not have permission to do that.` })
    
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        const tournaments = await Tournament.findActiveByFormatAndServerId(format, interaction.guildId)
       
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