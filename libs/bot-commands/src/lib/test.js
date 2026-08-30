
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { updateDeckTypeSummaries, purgeOldPrices, recalculateFormatStats, removeObsoleteArtworks, updateBlogPosts, purgeDuplicatePrices, updateMinMedMaxRarities, assignSeasonalLadderRoles, downloadOriginalArtworks, purgeBetaCards, downloadMissingCardImages, recalculateStats, downloadNewCards, lookForAllPotentialPairs, cleanUpPools, manageSubscriptions, updateGlobalNames, updateMarketPrices, conductCensus, calculateStandings, updateAvatars, updateDeckThumbs, updateDeckType, updateDecks, updateBlogPosts, isProgrammer, runMonthlyTasks, runNightlyTasks, updateServers, runFrequentTasks, updateCardLegality } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { client } from '../client'
import { s3FileExists } from '@fl/bot-functions'
import { Card, Deck, Match, Tournament, Player, Server, Subscription, TriviaQuestion, Format } from '@fl/models'
import axios from 'axios'
import { assignTournamentRoles, recalculateAllStats } from '../../../bot-functions/src'
import { Artwork, DeckTypeSummary, Format, Stats } from '../../../models/src'
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
                // runNightlyTasks(client)

                // const format = await Format.findOne({ where: { name: 'Forged in Chaos' }})
                // downloadNewCards(client)
                // await manageSubscriptions(client)
                // updateBlogPosts()
                // await runNightlyTasks(client)
                // updateCardLegality()
                // await removeObsoleteArtworks()
                // updateDeckTypeSummaries()

                // const server = await Server.findOne({ where: { id: interaction.guildId }})
                // const guild = client.guilds.cache.get(server.id)
                // const membersMap = await guild.members.fetch()
                // const members = [...membersMap.values()]

                // for (let i = 0; i < members.length; i++) {
                //     const member = members[i]
                //     if (member.user.bot ) continue
                //     if (
                //         member.roles.cache.has('1335316985097093290') ||
                //         member.roles.cache.has('1335317256921682053') ||
                //         member.roles.cache.has('1336745321186988084')
                //     ) {
                //         member.roles.remove('1335316985097093290')
                //         member.roles.remove('1335317256921682053')
                //         member.roles.remove('1336745321186988084')
                //         console.log('removed roles from', member.user.username)

                //         if (!member.roles.cache.has('1102002847056400464') && !member.roles.cache.has('1102020060631011400')) {
                //             console.log('DID NOT ADD BACK TO', member.user.username)
                //         }
                //     }
                // }

                // const subscriptions = await Subscription.findAll({ where: { status: 'active' }, include: Player })
                // for (let i = 0; i < subscriptions.length; i++) {
                //     const subscriber = subscriptions[i]
                //     const player = subscriber.player
                //     if (!player) {
                //         console.log(`no player found:`, subscriber.customerName)
                //         continue
                //     }
                //     const tier = subscriber.tier
                //     const member = members.find((m) => m.id === player.discordId)
                //     if (!member) {
                //         console.log(`no member found:`, player.name)
                //         continue
                //     }
                //     if (tier === 'Premium') {
                //         await member.roles.add('1335316985097093290').catch((err) => console.log(err))
                //         await member.roles.add('1336745321186988084').catch((err) => console.log(err))
                //         console.log('added premium/stripe roles back to', member.user.username)
                //     } else if (tier === 'Supporter') {
                //         await member.roles.add('1335317256921682053').catch((err) => console.log(err))
                //         await member.roles.add('1336745321186988084').catch((err) => console.log(err))
                //         console.log('added supporter/stripe roles back to', member.user.username)
                //     }
                // }

                // const players = await Player.findAll()
                // for (let i = 0; i < players.length; i++) {
                //     const player = players[i]
                //     const tops = await Deck.count({
                //         where: {
                //             origin: 'event',
                //             builderId: player.id,
                //             display: true
                //         }
                //     })

                //     await player.update({ tops: tops })
                //     console.log(`updated tops for ${player.name}`)
                // }

                // const originalArtworks = await Artwork.findAll({
                //     where: {
                //         isOriginal: true
                //     },
                //     order: [['cardName', 'ASC']],
                //     include: Card
                // })

                // for (let i = 0; i < originalArtworks.length; i++) {
                //     const artwork = originalArtworks[i]
                //     if (artwork.artworkId !== artwork.card?.konamiCode?.replace(/^0+/, '')) {
                //         console.log(`original artworkId for ${artwork.cardName} (${artwork.artworkId}) does not match card konamiCode (${artwork.card?.konamiCode})`)
                //     }
                // }

                // console.log(`----------------------------`)
                // console.log(`----------------------------`)
                // console.log(`----------------------------`)
                // console.log(`----------------------------`)
                // console.log(`----------------------------`)
                // console.log(`----------------------------`)
                // console.log(`----------------------------`)
                // console.log(`----------------------------`)
                // console.log(`----------------------------`)
                // console.log(`----------------------------`)

                // const cards = await Card.findAll({ order: [['name', 'ASC']]})

                // for (let i = 0; i < cards.length; i++) {
                //     const card = cards[i]
                //     const count = await Artwork.count({
                //         where: {
                //             cardId: card.id,
                //             isOriginal: true
                //         }
                //     })

                //     if (count === 0) {
                //         console.log(`no original artwork found for ${card.name}`)
                //     } else if (count >= 2) {
                //         const artworks = await Artwork.findAll({
                //             where: {
                //                 cardId: card.id,
                //                 isOriginal: true
                //             }
                //         })

                //         for (let j = 0; j < artworks.length; j++) {
                //             const artwork = artworks[j]
                //             if (artwork.artworkId?.length >= 9) {
                //                 await artwork.destroy()
                //             }
                //         }

                //         const count2 = await Artwork.count({
                //             where: {
                //                 cardId: card.id,
                //                 isOriginal: true
                //             }
                //         })

                //         if (count2 >= 2) {
                //             console.log(`multiple original artworks found for ${card.name}`)
                //         }
                //     }
                // }

                // updateGlobalNames()
                // recalculateAllStats()
                // purgeOldPrices()
                updateAvatars(client)
                // updateMarketPrices()
                // purgeDuplicatePrices()
                // conductCensus(client)
                // updateDeckType()
                // updateDecks()
                // updateMatchups()
                // purgeBetaCards(client)
                // downloadMissingCardImages()
                // updateMinMedMaxRarities()
                // s3FileExists('images/pfps/UeyvnNBD6CD53gsqRQsxCY.png')
                // downloadOriginalArtworks(client)
                // downloadMissingCardImages()
                // lookForAllPotentialPairs(client)
                // runMonthlyTasks(client)
                // assignTournamentRoles(client)
                // assignSeasonalLadderRoles(client)
                return await interaction.editReply('🧪')
                
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