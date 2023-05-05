
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { Server } from '@fl/models'
import { hasAffiliateAccess, isMod } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'

export default {
	data: new SlashCommandBuilder()
		.setName('mod')
		.setDescription('View the RetroBot Moderator guide. 👮'),
	async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })
    
        if (!hasAffiliateAccess(server)) return await interaction.reply({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        if (!isMod(server, interaction.member)) return await interaction.reply({ content: "You do not have permission to do that."})

        const botEmbed = new EmbedBuilder()
	        .setColor('#38C368')
        	.setTitle('RetroBot Moderator Guide')
	        .setDescription('A Yu-Gi-Oh! Bot powered by FormatLibrary.com.\n' )
	        .setURL('https://discord.com/invite/formatlibrary')
	        .setAuthor({ name: 'Jazz#2704', iconURL: 'https://i.imgur.com/wz5TqmR.png', url: 'https://discord.com/invite/formatlibrary' })
            .setThumbnail('https://cdn.formatlibrary.com/images/logos/Format%20Library.png')
        	.addFields(
                { name: 'Rated Play', value: '\n/manual - Manually record a match result. \n/records - View a player\'s recent match records. \n/undo - Undo one of the recent match results.'},
                { name: 'Tournaments', value: '\n/create -  Create a new tournament \n/destroy -  Delete a tournament. \n/signup - Directly add a player to a bracket. \n/close - Close tournament registration. \n/open - Open tournament registration. \n/start - Start a tournament. \n/settimer- Start a timer and notify players. \n/noshow - Report a no-show. \n/deck - Check a player\'s tournament deck. \n/remove - Remove a player from a bracket.  \n/end - End a tournament.'},
            )

        interaction.user.send({ embeds: [botEmbed] }).catch((err) => console.log(err))
        return await interaction.reply({ content: "I messaged you the RetroBot Moderator Guide."})
	}
}