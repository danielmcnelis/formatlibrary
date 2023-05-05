
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'

export default {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('View the RetroBot user guide. 🦮'),
	async execute(interaction) {
        const botEmbed = new EmbedBuilder()
	        .setColor('#38C368')
        	.setTitle('RetroBot User Guide')
	        .setDescription('A Yu-Gi-Oh! Bot powered by FormatLibrary.com.\n' )
	        .setURL('https://discord.com/invite/formatlibrary')
	        .setAuthor({ name: 'Jazz#2704', iconURL: 'https://i.imgur.com/wz5TqmR.png', url: 'https://discord.com/invite/formatlibrary' })
            .setThumbnail('https://cdn.formatlibrary.com/images/logos/Format%20Library.png')
            .addFields(
                { name: 'How to Use This Bot', value: '\nThe following commands can be used for any format in the appropriate server, channels, or via DM.' },
        	    { name: 'Cards', value: '\n/card - Look up a card. \n'},
                { name: 'Rated Pools', value: '\n/rated - DM to join a rated pool. \n/exit - DM to leave a rated pool. \n/pools - DM to view the rated pools you waiting in. \n/lobby - Post the currently occupied rated pools. \n'},
                { name: 'Rated Reports', value: '\n/loss - Report a loss to another player. \n/undo - Undo the last report if you made a mistake. \n'},
                { name: 'Rated Stats', value: '\n/stats - Post a player\'s stats. \n/leaderboard - Post the top rated players. \n/h2h - Post the H2H record between 2 players. \n/history - Post a graph of your Elo history. \n/records - View your recent rated match records. \n'},
                { name: 'Notifications', value: '\n/role - Add or remove a role notified for upcoming tournaments. \n/grind - Add or remove a role notified for rated play. \n'},
                { name: 'Format Info', value: '\n/legal - Privately check if your deck is legal. \n/info - Post a link to the format overview. \n/activity - Post a graph of dueling activity. \n'},
                { name: 'Tournaments', value: '\n/join - Register for an upcoming tournament.\n/drop - Drop from a tournament. \n/bracket - Post the bracket(s) for the current tournament(s). \n/standings - Post the current standings (Swiss only). \n/timer - Post the time remaining in the round.'},
                // { name: 'Ironmans', value: '\n/iron - Join an ironman queue.\n/queue - Check an ironman queue. \n'},
                { name: 'Misc.', value: '\n/duelingbook - Set your DuelingBook name. \n/profile - Post a player\'s profile. \n/rng - Random number from 1 to X. \n/flip - Flip a coin. \n/dice - Roll a 6-sided die. \n/help - View the RetroBot User Guide. \n/mod - View the RetroBot Moderator Guide.'}
            )
            
        interaction.user.send({ embeds: [botEmbed] }).catch((err) => console.log(err))
        return await interaction.reply({ content: "I messaged you the RetroBot User Guide."})
	}
}