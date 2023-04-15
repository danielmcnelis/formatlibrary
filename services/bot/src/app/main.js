

// RETROBOT - A RANKINGS & TOURNAMENT MANAGEMENT DISCORD BOT

// MODULE IMPORTS
import { Collection, Events } from 'discord.js'
const FuzzySet = require('fuzzyset')
import { client } from './client'

// DATABASE IMPORTS 
import { Membership, Player, Server } from '@fl/models'

// FUNCTION IMPORTS
import { assignTourRoles, conductCensus, downloadNewCards, getMidnightCountdown, markInactives, purgeEntries, 
    purgeRatedDecks, purgeTourRoles, updateAvatars, updateDeckTypes, updateMarketPrices ,updateSets, updateServers, fixDeckFolder,
    calculateStandings, checkTimer, closeTournament, createTournament, dropFromTournament, initiateStartTournament, 
    joinTournament, openTournament, processNoShow, removeFromTournament, seed, sendDeck, setTimerForTournament, 
    signupForTournament, startTournament, undoMatch, assignRoles, createMembership, createPlayer, fetchCardNames, 
    hasAffiliateAccess, hasPartnerAccess, isMod, isNewMember, isNewUser, setTimers, handleTriviaConfirmation
} from '@fl/bot-functions'

// STATIC IMPORTS
import { emojis } from '@fl/bot-emojis'
import commands from '@fl/bot-commands'
client.commands = new Collection()
Object.values(commands.formatLibraryCommands).forEach((command) => client.commands.set(command.data.name, command))
Object.values(commands.globalCommands).forEach((command) => client.commands.set(command.data.name, command))

// GLOBAL VARIABLES
const fuzzyCards = FuzzySet([], false)

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

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
});

// COMMANDS
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return

	const command = interaction.client.commands.get(interaction.commandName)

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`)
		return
	}

    if (command.data.name === 'card') {
        return command.execute(interaction, fuzzyCards)
    } else {
        return command.execute(interaction)
    }
})

// BUTTON SUBMIT
client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isButton()) return

    if (interaction.message?.content?.includes('Do you still wish to play Trivia?')) {
        // await interaction.reply({ components: [] }).catch((err) => console.log(err))
        const customId = interaction.customId
        const confirmed = customId.charAt(0) === 'Y'
        const entryId = customId.slice(1)

        console.log(`${interaction.user?.username} pressed the confirmation button for Trivia`)    
        return handleTriviaConfirmation(interaction, entryId, confirmed)
    } else {
        await interaction.message.edit({ components: [] })
        const customId = interaction.customId
        const toBeSeeded = customId.charAt(0) !== 'N'
        const toBeShuffled = customId.charAt(0) === 'S'
        const tournamentId = customId.slice(1)
        
        console.log(`${interaction?.member?.user?.username} pressed the seed button for tournament ${tournamentId}`)
    
        if (toBeSeeded) {
            await seed(interaction, tournamentId, toBeShuffled)
        } else {
            interaction.channel.send(`Okay, your seeds 🌱 will not been changed. 👍`)
        }
    
        return startTournament(interaction, tournamentId)

    }

})

// MODAL SUBMIT
client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isModalSubmit()) return

	const name = interaction.fields.getTextInputValue('name')
	let tournament_type = interaction.fields.getTextInputValue('tournament_type')
    if (tournament_type.toLowerCase().includes('de') || tournament_type.toLowerCase().includes('double')) tournament_type = 'double elimination'
    if (tournament_type.toLowerCase().includes('se') || tournament_type.toLowerCase().includes('single')) tournament_type = 'single elimination'
    if (tournament_type.toLowerCase().includes('sw') || tournament_type.toLowerCase().includes('swiss')) tournament_type = 'swiss'
    if (tournament_type.toLowerCase().includes('rr') || tournament_type.toLowerCase().includes('rob')) tournament_type = 'round robin'

    const abbreviation = interaction.fields.getTextInputValue('abbreviation')
	const formatName = interaction.fields.fields.get('formatName') ? interaction.fields.getTextInputValue('formatName') : null
	const channelName = interaction.fields.fields.get('channelName') ? interaction.fields.getTextInputValue('channelName') : null
    
    return createTournament(interaction, formatName, name, abbreviation, tournament_type, channelName)
})

// SELECT MENUS
client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isStringSelectMenu()) return

    const commandName = interaction.commandName || interaction.message.interaction.commandName
	const command = interaction.client.commands.get(commandName)

    const server = await Server.findOne({
        where: {
            id: interaction.guildId
        }
    })

	try {
        if (command.data.name === 'undo') {
            if (!isMod(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const matchId = interaction.values[0]
            await undoMatch(server, interaction.channel, matchId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'deck') {
            if (!isMod(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const entryId = interaction.values[0]
            await sendDeck(interaction, entryId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'close') {
            if (!isMod(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await closeTournament(interaction, tournamentId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'open') {
            if (!isMod(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await openTournament(interaction, tournamentId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'join') {
            const userId = interaction.message.components[0].components[0].data.custom_id
            if (userId !== interaction.member.id) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await joinTournament(interaction, tournamentId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'signup') {
            if (!isMod(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const userId = interaction.message.components[0].components[0].data.custom_id
            const tournamentId = interaction.values[0]
            await signupForTournament(interaction, tournamentId, userId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'start') {
            if (!isMod(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await initiateStartTournament(interaction, tournamentId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'drop') {
            const userId = interaction.message.components[0].components[0].data.custom_id
            if (userId !== interaction.member.id) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await dropFromTournament(interaction, tournamentId)
            return interaction.message.edit({ components: []})
        } else if (command.data.name === 'remove') {
            if (!isMod(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            const userId = interaction.message.components[0].components[0].data.custom_id
            await removeFromTournament(interaction, tournamentId, userId)
            return interaction.message.edit({ components: []})
        } else if (command.data.name === 'noshow') {
            if (!isMod(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            const userId = interaction.message.components[0].components[0].data.custom_id
            await processNoShow(interaction, tournamentId, userId)
            return interaction.message.edit({ components: []})
        } else if (command.data.name === 'standings') {
            const userId = interaction.message.components[0].components[0].data.custom_id
            if (userId !== interaction.member.id) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await calculateStandings(interaction, tournamentId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'timer') {
            const userId = interaction.message.components[0].components[0].data.custom_id
            if (userId !== interaction.member.id) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await checkTimer(interaction, tournamentId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'settimer') {
            if (!isMod(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            const hours = interaction.options.getNumber('hours')
            const minutes = interaction.options.getNumber('minutes')
            await setTimerForTournament(interaction, tournamentId, hours, minutes)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'fix') {
            if (!isMod(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await fixDeckFolder(interaction, tournamentId)
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