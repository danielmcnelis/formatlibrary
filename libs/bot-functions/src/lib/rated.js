
//RATED FUNCTIONS

//MODULE IMPORTS
import axios from 'axios'
import { Op } from 'sequelize'
import { Deck, Format, Player, Pool, Stats, Server } from '@fl/models'
import { emojis } from '@fl/bot-emojis'
import { getIssues } from './deck'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'

// GET RATED CONFIRMATION
export const getRatedConfirmation = async (client, format, yourPool, opponentsPool, commonGuildId) => {
    const guild = client.guilds.cache.get(commonGuildId)
    const member = await guild.members.fetch(yourPool.player.discordId)
    if (!member) return
    await yourPool.update({ status: 'confirming' })
 
    const row = new ActionRowBuilder()
    .addComponents(new ButtonBuilder()
        .setCustomId(`Y-${yourPool.id}-${opponentsPool.id}-${commonGuildId}`)
        .setLabel('Yes')
        .setStyle(ButtonStyle.Primary)
    )

    .addComponents(new ButtonBuilder()
        .setCustomId(`N-${yourPool.id}-${opponentsPool.id}-${commonGuildId}`)
        .setLabel('No')
        .setStyle(ButtonStyle.Primary)
    )

    const message = await member.user.send({ content: `I've found a Rated ${format.name} Format ${format.emoji} opponent for you. Do you still wish to play?`, components: [row] })

    setTimeout(async () => {
        const unconfirmed = await Pool.count({
            where: {
                id: yourPool.id,
                status: 'confirming'
            }
        })

        if (unconfirmed) {
            await message.edit({ components: [] }).catch((err) => console.log(err))
            await message.channel.send({ content: `Sorry, time's up! I've removed you from the ${format.name} Format ${format.emoji} rated pool.`})
        }
    }, 5 * 60 * 1000)

}

export const handleRatedConfirmation = async (client, interaction, confirmed, yourPoolId, opponentsPoolId, serverId) => {
    const yourPool = await Pool.findOne({ where: { id: yourPoolId }, include: [Format, Player] })
    const format = yourPool.format
    const opponentsPool = await Pool.findOne({ where: { id: opponentsPoolId }, include: Player })

    if (confirmed) {
        if (!opponentsPool) {
            await yourPool.update({ status: 'pending' })
            return interaction.user.send(`Sorry, your potential opponent found a match while waiting for you to confirm. I'll put you back in the Rated ${format.name} Format ${format.emoji} Pool.`)
        }

        const commonServer = await Server.findOne({ where: { id: serverId }})
        const channelId = commonServer.ratedChannel || format.channel
        const guild = client.guilds.cache.get(serverId)
        const channel = guild.channels.cache.get(channelId)
        const player = yourPool.player
        const opponent = opponentsPool.player
        const opposingMember = await guild.members.fetch(opponent.discordId)

        opposingMember.user.send(
            `New pairing for Rated ${format.name} Format ${format.emoji}!` +
            `\nServer: ${commonServer.name} ${commonServer.logo}` +
            `\nChannel: <#${channelId}>` +
            `\nDiscord: ${player.discordName}#${player.discriminator}` +
            `\nDuelingBook: ${player.duelingBook}`
        ).catch((err) => console.log(err))
        
        interaction.user.send(
            `New pairing for Rated ${format.name} Format ${format.emoji}!` +
            `\nServer: ${commonServer.name} ${commonServer.logo}` +
            `\nChannel: <#${channelId}>` +
            `\nDiscord: ${opponent.discordName}#${opponent.discriminator}` +
            `\nDuelingBook: ${opponent.duelingBook}`
        ).catch((err) => console.log(err))
        
        await yourPool.destroy()
        await opponentsPool.destroy()

        const poolsToDeactivate = await Pool.findAll({
            where: {
                playerId: {[Op.or]: [player.id, opponent.id]}
            }
        }) || []

        for (let d = 0; d < poolsToDeactivate.length; d++) {
            const rPTD = poolsToDeactivate[d]
            await rPTD.update({ status: 'inactive' })
        }

        const allStats = await Stats.findAll({ 
            where: {
                format: { [Op.iLike]: format.name }, 
                games: { [Op.gte]: 3 },
                serverId: '414551319031054346',
                '$player.hidden$': false
            },
            include: [Player],
            order: [['elo', 'DESC']] 
        }) || []

        const p1Index = allStats.findIndex((s) => s.playerId === player.id)
        const p1Rank = p1Index >= 0 ? `#${p1Index + 1} ` : ''
        const p2Index = allStats.findIndex((s) => s.playerId === opponent.id)
        const p2Rank = p2Index >= 0 ? `#${p2Index + 1} ` : ''

        return channel.send({ content: `New Rated ${format.name} Format ${format.emoji} Match: ${p2Rank}<@${opponent.discordId}> (DB: ${opponent.duelingBook}) vs. ${p1Rank}<@${player.discordId}> (DB: ${player.duelingBook}). Good luck to both duelists.`})
    } else {
        await yourPool.destroy()
        return interaction.user.send(`Not a problem. I've removed you from the Rated ${format.name} Format ${format.emoji} player pool.`)
    }
}


// GET DROP FORMATS
export const getDropFormats = async (interaction, pools) => {
    if (pools.length === 1) return pools
    const filter = m => m.author.id === interaction.user.id
    const message = await interaction.user.send({ content: `Which Rated Pool(s) do you want to leave?\n(1) - All\n${pools.map((p, index) => `(${index+2}) - ${p}`).join('\n')}`})
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 30000
    }).then(async (collected) => {
        const response = collected.first().content.toLowerCase()
        const index = !isNaN(parseInt(response)) ? parseInt(response) - 1 : null
        const poolsToLeave = response.includes('all') || index === 0 ? pools : 
            index !== null ? [pools[index - 1]] :
            false

        return poolsToLeave
    }).catch((err) => {
        console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
    })
}

// GET RATED FORMAT
export const getRatedFormat = async (interaction) => {
    const filter = m => m.author.id === interaction.user.id
    const message = await interaction.user.send({ content: `What format do you want to play?`})
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 15000
    }).then(async (collected) => {
        const response = collected.first().content.toLowerCase()
        const format = await Format.findOne({
            where: {
                [Op.or]: [
                    { name: {[Op.iLike]: response } },
                    { abbreviation: {[Op.iLike]: response } }
                ]
            }
        }) || await Format.findOne({
            where: {
                cleanName: {[Op.substring]: response },
            }
        })

        return format
    }).catch((err) => {
        console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
    })
}

//GET PREVIOUS RATED DECK
export const getPreviousRatedDeck = async (user, yourRatedDecks, format) => {   
    if (!yourRatedDecks || !yourRatedDecks.length) return false
    const options = yourRatedDecks.map((yRD, index) => `(${index + 1}) - ${yRD.name} - <${yRD.url}>`)
    options.push(`(${options.length + 1}) - Submit a New Deck`)

    const filter = m => m.author.id === user.id
    const message = await user.send({ content: `Which of your ${format.name} Format ${format.emoji} Rated deck(s) would you like to use?\n${options.join('\n')}`}).catch((err) => console.log(err))
    if (!message || !message.channel) return false
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 20000
    }).then(async (collected) => {
        const response = collected.first().content
        const index = !isNaN(parseInt(response)) ? parseInt(response) - 1 : null
        const previousRatedDeck = response.includes('new') || index === options.length ? false : 
            index >= 0 ? yourRatedDecks[index] :
            false

        return previousRatedDeck
    }).catch((err) => {
        console.log(err)
        user.send({ content: `Sorry, time's up. Please try again.`}).catch((err) => console.log(err))
        return false
    })
}

//GET RATED DECK
export const getNewRatedDeck = async (user, player, format) => {   
    const filter = m => m.author.id === user.id
    const message = await user.send({ content: `Please provide a duelingbook.com/deck link for your Rated Deck.`}).catch((err) => console.log(err))
    if (!message || !message.channel) return false
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 180000
    }).then(async (collected) => {
        const url = collected.first().content
        if (url.includes('duelingbook.com/deck?id=')) {		
            user.send({ content: 'Thanks. Please wait while I download the .YDK file.'})
            const id = url.slice(url.indexOf('?id=') + 4)
            const {data} = await axios.get(`https://www.duelingbook.com/php-scripts/load-deck.php/deck?id=${id}`)
            if (!data) return false
            const main = data.main.map((e) => e.serial_number)
            const side = data.side.map((e) => e.serial_number)
            const extra = data.extra.map((e) => e.serial_number)
            const ydk = ['created by...', '#main', ...main, '#extra', ...extra, '!side', ...side, ''].join('\n')
            const deckArr = [...main, ...extra, ...side,]
            const issues = await getIssues(deckArr, format)
            if (!issues) return false

            const { illegalCards, forbiddenCards, limitedCards, semiLimitedCards, unrecognizedCards } = issues
            if (!illegalCards || !forbiddenCards || !limitedCards || !semiLimitedCards || !unrecognizedCards) return false
                
            if (illegalCards.length || forbiddenCards.length || limitedCards.length || semiLimitedCards.length) {
                let response = [`I'm sorry, ${user.username}, your deck is not legal. ${emojis.mad}`]
                if (illegalCards.length) response = [...response, `\nThe following cards are not included in this format:`, ...illegalCards]
                if (forbiddenCards.length) response = [...response, `\nThe following cards are forbidden:`, ...forbiddenCards]
                if (limitedCards.length) response = [...response, `\nThe following cards are limited:`, ...limitedCards]
                if (semiLimitedCards.length) response = [...response, `\nThe following cards are semi-limited:`, ...semiLimitedCards]
            
                for (let i = 0; i < response.length; i += 50) {
                    if (response[i+50] && response[i+50].startsWith("\n")) {
                        user.send({ content: response.slice(i, i+51).join('\n').toString()}).catch((err) => console.log(err))
                        i++
                    } else {
                        user.send({ content: response.slice(i, i+50).join('\n').toString()}).catch((err) => console.log(err))
                    }
                }
            
                return false
            } else if (unrecognizedCards.length) {
                let response = `I'm sorry, ${user.username}, the following card IDs were not found in our database:\n${unrecognizedCards.join('\n')}`
                response += `\n\nThese cards are either alternate artwork, new to the TCG, OCG only, or incorrect in our database. Please contact a Moderator or an Admin if you can't resolve this.`
                
                user.send({ content: response.toString() }).catch((err) => console.log(err))
                return false
             } else {
                user.send({ content: `Thanks, ${user.username}, your deck is perfectly legal. ${emojis.legend}`}).catch((err) => console.log(err))
                const deckName = await askForDeckName(user, player) || 'Unnamed Deck'
                const newRatedDeck = await Deck.create({
                    builder: player.name,
                    formatName: format.name,
                    formatId: format.id,
                    name: deckName,
                    url: `https://duelingbook.com/deck?id=${id}`,
                    ydk: ydk,
                    origin: 'user',
                    playerId: player.id
                })

                return newRatedDeck
            }
        } else {
            user.send({ content: "Sorry, I only accept duelingbook.com/deck links."}).catch((err) => console.log(err))    
            return false  
        }
    }).catch((err) => {
        console.log(err)
        user.send({ content: `Sorry, time's up. Please try again.`}).catch((err) => console.log(err))
        return false
    })
}

//ASK FOR DECK NAME
export const askForDeckName = async (member, player, override = false) => {
    const filter = m => m.author.id === member.id || member.user.id
    const pronoun = override ? `${player.name}'s` : 'your'
    const message = await member.send({ content: `Please provide a nickname for ${pronoun} deck.` }).catch((err) => console.log(err))
    if (!message || !message.channel) return false
    return await message.channel.awaitMessages({
        filter,
		max: 1,
        time: 15000
    }).then(async (collected) => {
        const response = collected.first().content
        return response
    }).catch((err) => {
        console.log(err)
        member.send({ content: `Okay, I'll save this as an "Unnamed Deck". You can always change it later.`}).catch((err) => console.log(err))
        return 'Unnamed Deck'
    })
}