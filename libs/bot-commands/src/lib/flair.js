
import { SlashCommandBuilder } from 'discord.js'    

export default {
    data: new SlashCommandBuilder()
        .setName('flair')
        .setDescription(`Add subscriber flair. 👒`)
        .addStringOption(option =>
            option.setName('role')
                .setDescription('Subscriber Role.')
                .setRequired(true))
                .addChoices(
					{ name: 'Airbellum Subscriber', value: '1105203082909986866' },
					{ name: 'Alius Subscriber', value: '1105201244722712697' },
					{ name: 'Breaker Subscriber', value: '1103204327927074847' },
				)
        ,
    async execute(interaction) {
        console.log('interaction.options', interaction.options)
        const roleId = interaction.options.getString('role')

        try {
            await interaction.member.roles.add(roleId)
        } catch (err) {
            console.log(err)
            return await interaction.reply({ content: `Error: Unable to add role.`})
        }
        
        return await interaction.reply({ content: `You now have the role.`})
    }
}
