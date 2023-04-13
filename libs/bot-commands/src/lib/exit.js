
import { SlashCommandBuilder } from 'discord.js'
import { Player, Pool } from '@fl/models'
import { getDropFormats } from '@fl/bot-functions'

const getExitInformation = async (interaction, player) => {
    const oldPools = await Pool.findAll({ where: {  playerId: player.id } }) || []
    if (!oldPools.length) return await interaction.user.send(`You are not in any Rated Pools.`)

    const pools = oldPools.map((p) => p.formatName)

    const drops = await getDropFormats(interaction, pools)
    if (!drops || !drops.length) return await interaction.user.send(`Please specify a valid number.`)

    const results = []
    for (let i = 0; i < drops.length; i++) {
        try {
            const formatName = drops[i]
            const oldPool = await Pool.findOne({ where: { formatName: formatName, playerId: player.id } })
            await oldPool.destroy()
            results.push(formatName)
        } catch (err) {
            console.log(err)
        }
    }

    return await interaction.user.send({ content: `You left the Rated Pool for the following format(s):\n${results.join('\n').toString()}.`}).catch((err) => console.log(err))
}

export default {
    data: new SlashCommandBuilder()
        .setName('exit')
        .setDescription('Exit the rated pool. 👋'),
    async execute(interaction) {
        if (interaction.guildId) return await interaction.reply(`Try using **/exit** by DM'ing it to me.`)
        const player = await Player.findOne({ where: { discordId: interaction.user.id } })
        if (!player) return await interaction.reply(`You are not in the database. Please join the Format Library Discord server to register.`)
        interaction.reply('🤔')
        return getExitInformation(interaction, player)
    }
}