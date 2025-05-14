
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'

import { purgeDuplicatePrices, updateMinMedMaxRarities, assignSeasonalLadderRoles, downloadOriginalArtworks, purgeBetaCards, downloadMissingCardImages, recalculateStats, downloadNewCards, lookForAllPotentialPairs, cleanUpPools, manageSubscriptions, updateGlobalNames, updateMarketPrices, conductCensus, calculateStandings, updateAvatars, updateDeckThumbs, updateDeckType, updateDecks, updateBlogPosts, isProgrammer, runMonthlyTasks, runNightlyTasks, updateServers, runFrequentTasks } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { client } from '../client'
import { s3FileExists } from '@fl/bot-functions'
import { Match, Tournament, Server, TriviaQuestion } from '@fl/models'
import axios from 'axios'
import { assignTournamentRoles, recalculateAllStats } from '../../../bot-functions/src'
import { Stats } from '../../../models/src'
// import { config } from '@fl/config'

export default {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Admin Only - Performs a test. 🧪')
        .setDMPermission(false),
    async execute(interaction) {
        try {
            await interaction.deferReply()
            if (!isProgrammer(interaction.member)) return await interaction.editReply('🧪')
                // await interaction.editReply(emojis.yellow)
                // const guild = await client.guilds.fetch('414551319031054346')
                // const membersMap = await guild.members.fetch()
                // const member = membersMap.get('730180640531546275')
                // const member = await guild.members.fetch('730180640531546275')
                // console.log('member', member)
                // await runNightlyTasks(client)
                // await recalculateAllStats()
                // await updateAvatars(client)
                // await updateMarketPrices()
                // await purgeDuplicatePrices()
                // return await conductCensus(client)
                // await updateDeckType()
                // await updateDecks()
                // await downloadNewCards(client)
                // await updateMatchups()
                // await purgeBetaCards(client)
                // await downloadMissingCardImages()
                // await updateMinMedMaxRarities()
                // await s3FileExists('images/pfps/UeyvnNBD6CD53gsqRQsxCY.png')
                // return await downloadOriginalArtworks(client)
                // return downloadMissingCardImages()
                // return lookForAllPotentialPairs(client)
                // return runMonthlyTasks(client)
                // await manageSubscriptions(client)
                // await assignTournamentRoles(client)
                // return assignSeasonalLadderRoles(client)
                
                const row = new ActionRowBuilder()
                    .addComponents(new ButtonBuilder()
                        .setCustomId(`Yes`)
                        .setLabel('Yes')
                        .setStyle(ButtonStyle.Primary)
                    )

                    .addComponents(new ButtonBuilder()
                        .setCustomId(`No`)
                        .setLabel('No')
                        .setStyle(ButtonStyle.Primary)
                    )

                await interaction.editReply({ content: `Do you wish to change it?`, components: [row] })

                try {
                    const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 10000 })
                    console.log('confirmation', confirmation)
                    await confirmation.update({ content: 'Button pressed!', components: [] })
                } catch (e) {
                    await interaction.editReply({ content: 'No button pressed within 10 seconds, cancelling.', components: [] });
                }
        } catch (err) {
            console.log(err)
        }
    }
}