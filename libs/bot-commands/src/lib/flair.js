
import { SlashCommandBuilder } from 'discord.js'    
import { emojis } from '@fl/bot-emojis'

export default {
    data: new SlashCommandBuilder()
        .setName('flair')
        .setDescription(`Select your Subscriber Flair. 👒`)
        .addStringOption(option =>
            option
                .setName('emoji')
                .setDescription('Select an emoji.')
                .setRequired(true)
                .addChoices(
					{ name: 'Blackwing - Kalut the Moonshadow', value: '1105202857566802010' },	
					{ name: 'Breaker the Magical Warrior', value: '1103204327927074847' },
					{ name: 'Brionac, Dragon of the Ice Barrier', value: '1105196485630501008' },
					{ name: 'Colossal Fighter', value: '1105198759769538570' },
					{ name: 'Cyber Dragon', value: '1103204393760870490' },
					{ name: 'Dupe Frog', value: '1103204047571390494' },
                    { name: 'Elemental HERO Bubbleman', value: '1105203007647387748' },
                    { name: 'Genex Ally Birdman', value: '1105201167358754827' },
                    { name: 'Goblin Zombie', value: '1105202727597916160' },
					{ name: 'Gorz the Emissary of Darkness', value: '1105203194927263766' },
					{ name: 'Jurrac Aeolo', value: '1105202857566802010' },
                    { name: 'Magician of Faith', value: '1105200857236111430' },
                    { name: 'Master of Oz', value: '1105199417419636816' },
                    { name: 'Mobius the Frost Monarch', value: '1105208392391348294' },
                    { name: 'Morphing Jar', value: '1105203304377622590' },
					{ name: 'Ojama Green', value: '1105200866018984036' },
					{ name: 'Quickdraw Synchron', value: '1105199258442940506' },
					{ name: 'Ronintoadin', value: '1105200687270342836' },
					{ name: 'Snowman Eater', value: '1105199189597634591' },
					{ name: 'Swap Frog', value: '1105199330136162385' },
					{ name: 'Test Tiger', value: '1105198978129215628' },
                    { name: 'Time Wizard', value: '1105203831542911027' },
                    { name: 'Traptrix Myrmeleo', value: '1105200619570090097' },
                    { name: 'X-Saber Airbellum', value: '1105203082909986866' },
                    { name: 'XX-Saber Darksoul', value: '1105206904352952450' }
				)
        ),
    async execute(interaction) {
        const roleId = interaction.options.getString('role')
        const currentRoles = [...(await interaction.member.roles.cache.filter((r) => r.name.includes('(Sub)'))).values()]
        const privilegedUserIds = ['194147938786738176', '626843317010694176']

        if (!interaction.member._roles?.includes('1102002844850208810') && !privilegedUserIds.includes(interaction.member.id)) {
            return await interaction.reply({ content: `Sorry, Subscriber Flair is only available with a Format Library ${emojis.FL} subscription.`})
        }

        // REMOVE CURRENT SUBSCRIBER ROLES
        for (let i = 0; i < currentRoles.length; i++) {
            const role = currentRoles[i]
            try {
                await interaction.member.roles.remove(role.id)
            } catch (err) {
                console.log(err)
            }
        }

        // ADD SELECTED SUBSCRIBER ROLE
        try {
            await interaction.member.roles.add(roleId)
            return await interaction.reply({ content: `Enjoy your new flair! ${emojis.mlady}`})
        } catch (err) {
            console.log(err)
            return await interaction.reply({ content: `Error: Unable to add flair.`})
        }
        
    }
}
