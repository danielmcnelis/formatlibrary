

// RETROBOT - A RANKINGS & TOURNAMENT MANAGEMENT DISCORD BOT

// MODULE IMPORTS
import { Collection, Events, TeamMember } from 'discord.js'
const FuzzySet = require('fuzzyset')
import { client } from './client'

// DATABASE IMPORTS 
import { Match, Membership, Player, Server, Tournament } from '@fl/models'

// FUNCTION IMPORTS
import { assignTourRoles, conductCensus, createTopCut, downloadNewCards, getMidnightCountdown, markInactives, 
    purgeEntries, purgeRatedDecks, purgeTourRoles, updateAvatars, updateDeckTypes, updateMarketPrices,
    updateSets, updateServers, fixDeckFolder, postStandings, checkTimer, closeTournament, createTournament, 
    dropFromTournament, getFilm, initiateEndTournament, joinTournament, openTournament, updateTournament,
    processNoShow, removeFromTournament, seed, sendDeck, setTimerForTournament, signupForTournament, 
    startChallongeBracket, startTournament, endTournament, saveReplay, undoMatch, assignRoles, createMembership,
    createPlayer, fetchCardNames, fetchOPCardNames, hasAffiliateAccess, hasPartnerAccess, isMod, isNewMember, 
    isNewUser, setTimers, handleTriviaConfirmation, handleRatedConfirmation, editPointsSystem
} from '@fl/bot-functions'

// STATIC IMPORTS
import { emojis } from '@fl/bot-emojis'
import commands from '@fl/bot-commands'
import { editTieBreakers } from '../../../../libs/bot-functions/src'
client.commands = new Collection()
Object.values(commands.formatLibraryCommands).forEach((command) => client.commands.set(command.data.name, command))
Object.values(commands.globalCommands).forEach((command) => client.commands.set(command.data.name, command))

// GLOBAL VARIABLES
const fuzzyCards = FuzzySet([], false)
const fuzzyOPCards = FuzzySet([], false)

// READY
client.on('ready', async() => {
    console.log('RetroBot is online!')
    try {
        await setTimers(client)
    } catch (err) {
        console.log(err)
    }

    try {
        const names = await fetchCardNames()
        names.forEach((card) => fuzzyCards.add(card))
    } catch (err) {
        console.log(err)
    }

    try {
        const names = await fetchOPCardNames()
        names.forEach((card) => fuzzyOPCards.add(card))
    } catch (err) {
        console.log(err)
    }

    // NIGHTLY TASKS
    const midnightCountdown = getMidnightCountdown()
    setTimeout(() => purgeEntries(), midnightCountdown)
    setTimeout(() => purgeTourRoles(client), midnightCountdown + (0.2 * 60 * 1000))
    setTimeout(() => assignTourRoles(client), midnightCountdown + (0.4 * 60 * 1000))
    setTimeout(() => markInactives(), midnightCountdown + (0.6 * 60 * 1000))
    setTimeout(() => updateServers(client), midnightCountdown + (0.8 * 60 * 1000))
    setTimeout(() => updateSets(), midnightCountdown + (1 * 60 * 1000))
    setTimeout(() => downloadNewCards(), midnightCountdown + (2 * 60 * 1000))
    setTimeout(() => updateMarketPrices(), midnightCountdown + (3 * 60 * 1000))
    setTimeout(() => conductCensus(client), midnightCountdown + (4 * 60 * 1000))
    setTimeout(() => updateAvatars(client), midnightCountdown + (11 * 60 * 1000))
    setTimeout(() => purgeRatedDecks(), midnightCountdown + (13 * 60 * 1000))
    setTimeout(() => updateDeckTypes(client), midnightCountdown + (13.2 * 60 * 1000))
})

// COMMANDS
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return

	const command = interaction.client.commands.get(interaction.commandName)
	if (!command) return console.error(`No command matching ${interaction.commandName} was found.`)

    if (command.data.name === 'card') {
        return command.execute(interaction, fuzzyCards, fuzzyOPCards)
    } else {
        return command.execute(interaction)
    }
})

// AUTO COMPLETE
client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isAutocomplete()) return

    const command = interaction.client.commands.get(interaction.commandName)
	if (!command) return console.error(`No command matching ${interaction.commandName} was found.`)

    return command.autocomplete(interaction)
})

// BUTTON SUBMIT
client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isButton()) return

    if (interaction.message?.content?.includes('Do you still wish to play Trivia?')) {
        await interaction.update({ components: [] }).catch((err) => console.log(err))
        const customId = interaction.customId
        const confirmed = customId.charAt(0) === 'Y'
        const entryId = customId.slice(1)
        return handleTriviaConfirmation(interaction, entryId, confirmed)
    } else if (interaction.message?.content?.includes(`I've found a Rated`)) {
        await interaction.update({ components: [] }).catch((err) => console.log(err))
        const customId = interaction.customId
        const confirmed = customId.charAt(0) === 'Y'
        const ids = customId.slice(2).split('-')
        const yourPoolId = ids[0]
        const opponentsPoolId = ids[1]
        const serverId = ids[2]
        return handleRatedConfirmation(client, interaction, confirmed, yourPoolId, opponentsPoolId, serverId)
    } else if (interaction.message?.content?.includes('Should this tournament be seeded')) {
        await interaction.message.edit({ components: [] })
        const [answer, userId, tournamentId] = interaction.customId?.split('-') || []
        const toBeSeeded = answer !== 'N'
        const toBeShuffled = answer === 'S'
        if (userId !== interaction.user.id) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)

        if (toBeSeeded) {
            await seed(interaction, tournamentId, toBeShuffled)
        } else {
            interaction.channel.send(`Okay, your seeds 🌱 will not been changed. 👍`)
        }
    
        return startChallongeBracket(interaction, tournamentId)
    } else if (interaction.message?.content?.includes('Do you wish to create a top cut')) {
        await interaction.message.edit({ components: [] })
        const [answer, userId, tournamentId] = interaction.customId?.split('-') || []
        if (userId !== interaction.user.id) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)

        if (answer === 'Y') {
            return await createTopCut(interaction, tournamentId)
        } else {
            return await endTournament(interaction, tournamentId)
        }
    }
})

// MODAL SUBMIT
client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isModalSubmit()) return
    await interaction.deferReply()

    if (interaction.customId?.includes('create')) {
        const name = interaction.fields.getTextInputValue('name')

        const tournament_type = interaction.customId?.includes('SW') ? 'swiss' :
            interaction.customId?.includes('SE') ? 'single elimination' :
            interaction.customId?.includes('DE') ? 'double elimination' :
            'round robin'
    
        const abbreviation = interaction.fields.getTextInputValue('abbreviation')
        const formatName = interaction.fields.fields.get('formatName') ? interaction.fields.getTextInputValue('formatName') : null
        const channelName = interaction.fields.fields.get('channelName') ? interaction.fields.getTextInputValue('channelName') : null
    
        const decipherTieBreakerInput = (input) => {
            if (input.includes('mb') || input.includes('med')) {
                return 'median buchholz'
            } else if (input.includes('wvt') || input.includes('wins vs')) {
                return 'match wins vs tied'
            } else if (input.includes('pd') || input.includes('point')) {
                return 'points difference'
            } else if (input.includes('oowp') || input.includes('s opp')) {
                return `opponents opponent win percentage`
            } else if (input.includes('owp') || input.includes('opp')) {
                return `opponents win percentage`
            } else {
                return null
            }
        }
    
        const tieBreaker1 = interaction.fields.fields.get('tb1') ? decipherTieBreakerInput(interaction.fields.getTextInputValue('tb1')?.toLowerCase()) || 'median buchholz' : 'median buchholz'
        const tieBreaker2 = interaction.fields.fields.get('tb2') ? decipherTieBreakerInput(interaction.fields.getTextInputValue('tb2')?.toLowerCase()) || 'match wins vs tied' : 'match wins vs tied'
    
        return createTournament(interaction, formatName, name, abbreviation, tournament_type, channelName, tieBreaker1, tieBreaker2)
    } else if (interaction.customId?.includes('edit')) {
        const name = interaction.fields.getTextInputValue('name')

        const decipherTournamentTypeInput = (input = '') => {
            input = input.toLowerCase()
            if (input.includes('sw')) {
                return 'swiss'
            } else if (input.includes('de') || input.includes('double')) {
                return 'double elimination'
            } else if (input.includes('se') || input.includes('single')) {
                return 'single elimination'
            } else if (input.includes('rr') || input.includes('rob')) {
                return `round robin`
            } else {
                return null
            }
        }

        const tournament_type = interaction.fields.fields.get('type') ? decipherTournamentTypeInput(interaction.fields.getTextInputValue('type')) : null
        const abbreviation = interaction.fields.fields.get('abbreviation') ? interaction.fields.getTextInputValue('abbreviation') : null
        const url = interaction.fields.fields.get('url') ? interaction.fields.getTextInputValue('url') : null
        const tournamentId = interaction.customId?.split('-')[1]

        return updateTournament(interaction, tournamentId, name, abbreviation, tournament_type, url)
    } else if (interaction.customId?.includes('tiebreakers')) {
        const decipherTieBreakerInput = (input) => {
            if (input.includes('mb') || input.includes('med')) {
                return 'median buchholz'
            } else if (input.includes('wvt') || input.includes('wins vs')) {
                return 'match wins vs tied'
            } else if (input.includes('pd') || input.includes('point')) {
                return 'points difference'
            } else if (input.includes('oowp') || input.includes('s opp')) {
                return `opponents opponent win percentage`
            } else if (input.includes('owp') || input.includes('opp')) {
                return `opponents win percentage`
            } else {
                return null
            }
        }
    
        const tieBreaker1 = interaction.fields.fields.get('tb1') ? decipherTieBreakerInput(interaction.fields.getTextInputValue('tb1')?.toLowerCase()) || 'median buchholz' : 'median buchholz'
        const tieBreaker2 = interaction.fields.fields.get('tb2') ? decipherTieBreakerInput(interaction.fields.getTextInputValue('tb2')?.toLowerCase()) || 'match wins vs tied' : 'match wins vs tied'
        const tieBreaker3 = interaction.fields.fields.get('tb3') ? decipherTieBreakerInput(interaction.fields.getTextInputValue('tb3')?.toLowerCase()) || null : null
        const tournamentId = interaction.customId?.split('-')[1]

        return editTieBreakers(interaction, tournamentId, tieBreaker1, tieBreaker2, tieBreaker3)
    } else if (interaction.customId.includes('points')) {    
        const pointsPerMatchWin = interaction.fields.fields.get('ppwin') ? interaction.fields.getTextInputValue('ppwin') : '1.0'
        const pointsPerMatchTie = interaction.fields.fields.get('pptie') ? interaction.fields.getTextInputValue('pptie') : '0.0'
        const pointsPerBye = interaction.fields.fields.get('ppbye') ? interaction.fields.getTextInputValue('ppbye') : '1.0'
        const tournamentId = interaction.customId?.split('-')[1]

        return editPointsSystem(interaction, tournamentId, pointsPerMatchWin, pointsPerMatchTie, pointsPerBye)
    }
})

// SELECT MENUS
client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isStringSelectMenu()) return
    await interaction.deferReply()

    const commandName = interaction.commandName || interaction.message.interaction.commandName
	const command = interaction.client.commands.get(commandName)

    const server = await Server.findOne({
        where: {
            id: interaction.guildId
        }
    })

	try {
        if (command.data.name === 'close') {
            if (!isMod(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await closeTournament(interaction, tournamentId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'deck') {
            if (!isMod(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const id = interaction.values[0]
            await sendDeck(interaction, id)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'drop') {
            const userId = interaction.message.components[0].components[0].data.custom_id
            if (userId !== interaction.member.id) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await dropFromTournament(interaction, tournamentId)
            return interaction.message.edit({ components: []})
        }  else if (command.data.name === 'end') {
            if (!isMod(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await initiateEndTournament(interaction, tournamentId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'film') {
            const tournamentId = interaction.values[0]
            const userId = interaction.message.components[0].components[0].data.custom_id
            await getFilm(interaction, tournamentId, userId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'fix') {
            if (!isMod(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await fixDeckFolder(interaction, tournamentId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'join') {
            const userId = interaction.message.components[0].components[0].data.custom_id
            if (userId !== interaction.member.id) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await joinTournament(interaction, tournamentId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'noshow') {
            if (!isMod(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            const userId = interaction.message.components[0].components[0].data.custom_id
            await processNoShow(interaction, tournamentId, userId)
            return interaction.message.edit({ components: []})
        } else if (command.data.name === 'open') {
            if (!isMod(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await openTournament(interaction, tournamentId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'remove') {
            if (!isMod(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            const userId = interaction.message.components[0].components[0].data.custom_id
            await removeFromTournament(interaction, tournamentId, userId)
            return interaction.message.edit({ components: []})
        } else if (command.data.name === 'replay') {
            const [userId, replayExtension] = interaction.message.components[0].components[0].data.custom_id.split(':')
            if (userId !== interaction.member.id) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const match = await Match.findOne({ where: { id: interaction.values[0] }})
            const tournament = await Tournament.findOne({ where: { id: match.tournamentId }})
            const url = `https://www.duelingbook.com/replay?id=${replayExtension}`
            await saveReplay(server, interaction, match, tournament, url)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'settimer') {
            if (!isMod(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            const [hours, minutes] = interaction.message.components[0].components[0].data.custom_id.split(':')
            await setTimerForTournament(interaction, tournamentId, hours, minutes)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'signup') {
            if (!isMod(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const userId = interaction.message.components[0].components[0].data.custom_id
            const tournamentId = interaction.values[0]
            await signupForTournament(interaction, tournamentId, userId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'standings') {
            const userId = interaction.message.components[0].components[0].data.custom_id
            if (userId !== interaction.member.id) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await postStandings(interaction, tournamentId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'start') {
            if (!isMod(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await startTournament(interaction, tournamentId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'timer') {
            const userId = interaction.message.components[0].components[0].data.custom_id
            if (userId !== interaction.member.id) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await checkTimer(interaction, tournamentId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'undo') {
            if (!isMod(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const matchId = interaction.values[0]
            await undoMatch(server, interaction.channel, matchId)
            return interaction.message.edit({components: []})
        } else {
            return
        }
	} catch (error) {
		console.error(error)
		return interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
	}
})

// WELCOME
client.on('guildMemberAdd', async (member) => {    
    try {
        const guild = member.guild
        const server = await Server.findOne({ where: { id: guild.id }})
        if (!server || !hasAffiliateAccess(server)) return
        const channel = guild.channels.cache.get(server.welcomeChannel)
        if (await isNewUser(member.user.id)) await createPlayer(member) 
        if (await isNewMember(guild.id, member.user.id)) {
            await createMembership(guild, member)
            if (!channel) return
            return channel.send({ content: `${member}, Welcome to the ${guild.name} ${server.logo} Discord server. ${server.emoji|| emojis.legend}`})
        } else {
            await assignRoles(guild, member)
            if (!channel) return
            return channel.send({ content: `${member}, Welcome back to the ${guild.name} ${server.logo} Discord server! We missed you. ${emojis.soldier}`})
        }
    } catch (err) {
        console.log(err)
    }
})
    
// GOODBYE
client.on('guildMemberRemove', async (member) => {
    try {
        const guild = member.guild
        const server = await Server.findOne({ where: { id: guild.id }})
        if (!server || !hasPartnerAccess(server)) return
        const channel = guild.channels.cache.get(server.welcomeChannel)
        channel.send({ content: `Oh dear. ${member.user.username} has left the server. ${emojis.sad}`})
        const membership = await Membership.findOne({ where: { '$player.discordId$': member.user.id, serverId: guild.id }, include: Player })
        membership.active = false
        await membership.save()
    } catch (err) {
        console.log(err)
    }
})

// SUBSCRIPTION
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (oldMember.guild.id !== '414551319031054346') return
    const oldRoles = oldMember.roles.cache
    const newRoles = newMember.roles.cache

    const wasSubscriber = oldRoles.has('1102002844850208810')
    const isSubscriber = newRoles.has('1102002844850208810')

    if (wasSubscriber && !isSubscriber) {
        const player = await Player.findOne({
            where: {
                discordId: oldMember.id
            }
        })

        await player.update({ subscriber: false, subTier: null })
    } else if (!wasSubscriber && isSubscriber) {
        const player = await Player.findOne({
            where: {
                discordId: oldMember.id
            }
        })

        const isSupporter = newRoles.has('1102020060631011400')
        const isPremium = newRoles.has('1102002847056400464')
        const isDoublePremium = newRoles.has('1102796965592449044')
        
        if (isSupporter) {
            await player.update({ subscriber: true, subTier: 'Supporter' })
            console.log(`Welcome ${oldMember.user?.username} to the Supporter Tier!`)
        } else if (isPremium) {
            await player.update({ subscriber: true, subTier: 'Premium' })
            console.log(`Welcome ${oldMember.user?.username} to the Premium Tier!`)
        } else if (isDoublePremium) {
            await player.update({ subscriber: true, subTier: 'Double Premium' })
            console.log(`Welcome ${oldMember.user?.username} to the Double Premium Tier!`)
        } else {
            await player.update({ subscriber: true })
            console.log(`Welcome ${oldMember.user?.username} to the Subscribers!`)
        }
    }
});