
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'

import { recalculateFormatStats, updateBlogPosts, purgeDuplicatePrices, updateMinMedMaxRarities, assignSeasonalLadderRoles, downloadOriginalArtworks, purgeBetaCards, downloadMissingCardImages, recalculateStats, downloadNewCards, lookForAllPotentialPairs, cleanUpPools, manageSubscriptions, updateGlobalNames, updateMarketPrices, conductCensus, calculateStandings, updateAvatars, updateDeckThumbs, updateDeckType, updateDecks, updateBlogPosts, isProgrammer, runMonthlyTasks, runNightlyTasks, updateServers, runFrequentTasks } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { client } from '../client'
import { s3FileExists } from '@fl/bot-functions'
import { Match, Tournament, Player, Server, Subscription, TriviaQuestion, Format } from '@fl/models'
import axios from 'axios'
import { assignTournamentRoles, recalculateAllStats } from '../../../bot-functions/src'
import { Format, Stats } from '../../../models/src'
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
                // const format = await Format.findOne({ where: { name: 'Forged in Chaos' }})
                // await downloadNewCards(client)
                // await manageSubscriptions(client)
                // await updateGlobalNames()
                // await updateBlogPosts()
                // await runNightlyTasks(client)

                const server = await Server.findOne({ where: { id: interaction.guildId }})
                const guild = client.guilds.cache.get(server.id)
                const membersMap = await guild.members.fetch()
                const members = [...membersMap.values()]

                for (let i = 0; i < members.length; i++) {
                    const member = members[i]
                    if (member.user.bot ) continue
                    if (
                        member.roles.has('1335316985097093290') ||
                        member.roles.has('1335317256921682053') ||
                        member.roles.has('1336745321186988084') ||
                        member.roles.has('1102002844850208810')
                    ) {
                        member.roles.remove('1335316985097093290')
                        member.roles.remove('1335317256921682053')
                        member.roles.remove('1336745321186988084')
                        member.roles.remove('1102002844850208810')
                        console.log('removed roles from', member.user.username)

                        if (member.roles.has('1102002847056400464') || member.roles.has('1102020060631011400')) {
                            member.roles.add('1102002844850208810')
                            console.log('added discord subscriber role back')
                        } else {
                            console.log('DID NOT ADD BACK TO', member.user.username)
                        }
                    }
                }

                const subscriptions = await Subscription.findAll({ where: { status: 'active' }, include: Player })
                for (let i = 0; i < subscriptions.length; i++) {
                    const subscriber = subscriptions[i]
                    const player = subscriber.player
                    const tier = subscriber.tier
                    const member = members.find((m) => m.id === player.discordId)
                    if (tier = 'Premium') {
                        member.roles.add('1335316985097093290')
                        member.roles.add('1336745321186988084')
                        console.log('added premium/stripe roles back to', member.user.username)
                    } else if (tier === 'Supporter') {
                        member.roles.add('1335317256921682053')
                        member.roles.add('1336745321186988084')
                        console.log('added supporter/stripe roles back to', member.user.username)
                    }
                }

                return await interaction.editReply('🧪')
                // await recalculateAllStats()
                // await updateAvatars(client)
                // await updateMarketPrices()
                // await purgeDuplicatePrices()
                // return await conductCensus(client)
                // await updateDeckType()
                // await updateDecks()
                // await updateMatchups()
                // await purgeBetaCards(client)
                // await downloadMissingCardImages()
                // await updateMinMedMaxRarities()
                // await s3FileExists('images/pfps/UeyvnNBD6CD53gsqRQsxCY.png')
                // return await downloadOriginalArtworks(client)
                // return downloadMissingCardImages()
                // return lookForAllPotentialPairs(client)
                // return runMonthlyTasks(client)
                // await assignTournamentRoles(client)
                // return assignSeasonalLadderRoles(client)
                
                // const row = new ActionRowBuilder()
                //     .addComponents(new ButtonBuilder()
                //         .setCustomId(`Test-Yes`)
                //         .setLabel('Yes')
                //         .setStyle(ButtonStyle.Primary)
                //     )

                //     .addComponents(new ButtonBuilder()
                //         .setCustomId(`Test-No`)
                //         .setLabel('No')
                //         .setStyle(ButtonStyle.Primary)
                //     )

                // await interaction.reply({ content: `Do you wish to change it?`, components: [row] })

                // const filter = i => i.customId.startsWith('Test-') && i.user.id === interaction.user.id;

                // try {
                //     const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 10000 })
                //     console.log('confirmation', confirmation)
                //     if (confirmation.customId.includes('Yes')) {
                //         await confirmation.update({ content: 'Pressed Yes!', components: [] })
                //     } else {
                //         await confirmation.update({ content: 'Pressed No!', components: [] })
                //         await confirmation.channel.send({ content: `Do you wish to change it?`, components: [row] })
                //     }
                // } catch (e) {
                //     await interaction.editReply({ content: 'No button pressed within 10 seconds, cancelling.', components: [] });
                // }
        } catch (err) {
            console.log(err)
        }
    }
}