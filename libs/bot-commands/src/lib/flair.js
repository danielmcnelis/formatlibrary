
import { SlashCommandBuilder } from 'discord.js'    

export default {
    data: new SlashCommandBuilder()
        .setName('flair')
        .setDescription(`Add or remove a Subscriber Role. 👒`)
        .addRoleOption(option =>
            option
                .setName('role')
                .setDescription('Subscriber Role.')
                .setRequired(true))
        ,
    async execute(interaction) {
        console.log('interaction.options', interaction.options)
        const role = interaction.options.getRole('role')
        console.log('role', role)

        try {
            await interaction.member.roles.add(role.id)
        } catch (err) {
            console.log(err)
            return await interaction.reply({ content: `Error: Unable to add ${role.name} role.`})
        }
        
        return await interaction.reply({ content: `You now have the ${role.name} role.`})
    }
}
