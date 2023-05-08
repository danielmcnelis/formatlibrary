
import { SlashCommandBuilder } from 'discord.js'    
import { emojis } from '@fl/bot-emojis'

export default {
    data: new SlashCommandBuilder()
        .setName('flair')
        .setDescription(`Select your subscriber flair. 👒`)
        .addStringOption(option =>
            option
                .setName('role')
                .setDescription('Subscriber Flair.')
                .setRequired(true)
                .addChoices(
					{ name: 'Airbellum', value: '1105203082909986866' },
					{ name: 'Alius', value: '1105201244722712697' },
					{ name: 'Breaker', value: '1103204327927074847' },
					{ name: 'Birdman', value: '1105201167358754827' },
					{ name: 'Brio', value: '1105196485630501008' },
					{ name: 'Bubbleman', value: '1105203007647387748' },
					{ name: 'Bulb', value: '1105199605358018570' },
					{ name: 'Cherries', value: '1105201253505576980' },
					{ name: 'Colossal', value: '1105198759769538570' },
					{ name: 'Cydra', value: '1103204393760870490' },
					{ name: 'Darksoul', value: '1105206904352952450' },
					{ name: 'Diva', value: '1105197358645530704' },
					{ name: 'Drill', value: '1105203435839701162' },
					{ name: 'Dupe', value: '1103204047571390494' },
					{ name: 'Earth', value: '936772523708792942' },
					{ name: 'Faith', value: '1105200857236111430' },
					{ name: 'Goblin', value: '1105202727597916160' },
					{ name: 'Gorz', value: '1105203194927263766' },
					{ name: 'Hornet', value: '1105210022893473793' },
					{ name: 'Jurrac', value: '1105202857566802010' },
					{ name: 'Kalut', value: '1105202857566802010' },
					{ name: 'Leviair', value: '1105202514380472413' },
					{ name: 'Marshalleaf', value: '1105203736676151457' },
					{ name: 'Marshmallon', value: '1105201097511022612' },
					{ name: 'Mezuki', value: '1105202800503300206' },
					// { name: 'MJar', value: '1105203304377622590' },
					// { name: 'Mobius', value: '1105208392391348294' },
					// { name: 'Mole', value: '1105199517420240966' },
					// { name: 'Myrm', value: '1105200619570090097' },
					// { name: 'Ojama', value: '1105200866018984036' },
					// { name: 'Oz', value: '1105199417419636816' },
					// { name: 'Quickdraw', value: '1105199258442940506' },
					// { name: 'Raiza', value: '1105203602152239247' },
					// { name: 'Ronin', value: '1105200687270342836' },
					// { name: 'Snowman', value: '1105199189597634591' },
					// { name: 'Swap', value: '1105199330136162385' },
					// { name: 'Test Tiger', value: '1105198978129215628' },
					// { name: 'Time Wizard', value: '1105203831542911027' },
					// { name: 'Veiler', value: '1105202646073225227' },
					// { name: 'Winda', value: '1105209839967293490' }
				)
        ),
    async execute(interaction) {
        const roleId = interaction.options.getString('role')
        const currentRoles = interaction.member.roles.filter((r) => r.name.includes('Subscriber'))
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
