
import { SlashCommandBuilder } from 'discord.js'    

export default {
    data: new SlashCommandBuilder()
        .setName('flair')
        .setDescription(`Add or remove a subscriber flair. 👒`)
        .addRoleOption(option =>
            option
                .setName('role')
                .setDescription('Subscriber Role.')
                .setRequired(true))
        ,
    async execute(interaction) {
        const role = interaction.options.getUser('role')
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
