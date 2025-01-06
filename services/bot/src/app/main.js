

// RETROBOT - A RANKINGS & TOURNAMENT MANAGEMENT DISCORD BOT

// MODULE IMPORTS
import { Collection, Events } from 'discord.js'
const FuzzySet = require('fuzzyset')
import { Op } from 'sequelize'
import { client } from './client'
import { readFileSync } from 'fs'
import * as express from 'express'
import * as compression from 'compression'
import * as morgan from 'morgan'
import * as chalk from 'chalk'
import * as http from 'http'
import * as https from 'https'
import { config } from '@fl/config'

// DATABASE IMPORTS 
import { Format, Match, Membership, Player, Server, Tournament } from '@fl/models'

// FUNCTION IMPORTS
import { createTopCut, editTieBreakers, getMidnightCountdown, 
    postStandings, checkTimer, closeTournament, createTournament, 
    dropFromTournament, getFilm, initiateEndTournament, joinTournament, openTournament, updateTournament,
    processNoShow, removeFromTournament, seed, sendDeck, setTimerForTournament, signupForTournament, 
    startChallongeBracket, startTournament, endSwissTournamentWithoutPlayoff, saveReplay, undoMatch, 
    assignRoles, createMembership, createPlayer, fetchCardNames, hasPartnerAccess, 
    isModerator, isNewMember, isNewUser, setTimers, handleTriviaConfirmation, handleRatedConfirmation, 
    editPointsSystem, runNightlyTasks, getTournament, extractDigitsAndPadZeros, getSuggestedAbbreviation, 
    getKnownAbbreviation, capitalize, getHourlyCountdown, runHourlyTasks
} from '@fl/bot-functions'

// STATIC IMPORTS
import { emojis } from '@fl/bot-emojis'
import commands from '@fl/bot-commands'
import { rated } from './routes'
client.commands = new Collection()
Object.values(commands.formatLibraryCommands).forEach((command) => client.commands.set(command.data.name, command))
Object.values(commands.globalCommands).forEach((command) => client.commands.set(command.data.name, command))

// GLOBAL VARIABLES
const fuzzyCards = FuzzySet([], false)
const app = express()
  
// rewrite
app.use('/bot', (req, _res, next) => {
    const from = req.url
    const to = from.replace(/\/bot\//g, '/')
    req.url = to
    next()
})

// logging
app.use(morgan('dev'))

// compression
app.use(compression())

// body parsing
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// routes
const routes = { rated }
Object.values(routes).forEach((route) => {
  route.stack.forEach((route) => {
    const path = route.route.path
    const methods = Object.entries(route.keys).reduce((reduced, [key, value]) => {
      if (value) {
        reduced.push(key.toUpperCase())
      }
      return reduced
    }, [])
    methods.forEach((method) => {
      console.log(`Route ${chalk.yellow(method)} ${chalk.green(path)}`)
    })
  })

  app.use(route)
})

const port = config.services.bot.port
const useHttps = config.services.bot.https === '1' || config.services.bot.https === 'true'
const privateKey = useHttps ? readFileSync('./certs/privkey.pem', 'utf8') || '' : ''
const certificate = useHttps ? readFileSync('./certs/fullchain.pem', 'utf8') || '' : ''
const credentials = { key: privateKey, cert: certificate }

const server = useHttps ? https.createServer(credentials, app).listen(port, () =>
    console.log(chalk.cyan(`Listening on https://${config.services.bot.host ? config.services.bot.host : '0.0.0.0'}:${port}`))
) : http.createServer(app).listen(port, () =>
    console.log(chalk.cyan(`Listening on http://${config.services.bot.host ? config.services.bot.host : '0.0.0.0'}:${port}`))
)

server.on('error', console.error)

// READY
client.on('ready', async() => {
    console.log('RetroBot is online!')
    try {
        await setTimers(client)
    } catch (err) {
        console.log(err)
    }

    try {
        // FETCH CARD NAMES
        const names = await fetchCardNames()
        names.forEach((card) => fuzzyCards.add(card))
    } catch (err) {
        console.log(err)
    }

    try {
        // RESTORE TOURNAMENT STATES
        const server = await Server.findOne({
            where: {
                id: '414551319031054346'
            }
        })

        const tournaments = await Tournament.findAll({ where: { state: 'processing' }})
        for (let i = 0; i < tournaments.length; i++) {
            const tournament = tournaments[i]
            const data = await getTournament(server, tournament.id)
            if (!data) continue
            await tournament.update({ state: data.tournament?.state })
        }
    } catch (err) {
        console.log(err)
    }

    try {
        // HOURLY TASKS
        setTimeout(() => runHourlyTasks(client), getHourlyCountdown())
    } catch (err) {
        console.log(err)
    }

    try {
        // NIGHTLY TASKS
        setTimeout(() => runNightlyTasks(client),  getMidnightCountdown())
    } catch (err) {
        console.log(err)
    }
})

// COMMANDS
client.on(Events.InteractionCreate, async interaction => {
    try {
        if (!interaction.isChatInputCommand()) return
    
        const command = interaction.client.commands.get(interaction.commandName)
        if (!command) return console.error(`No command matching ${interaction.commandName} was found.`)
    
        if (command.data.name === 'card') {
            return command.execute(interaction, fuzzyCards)
        } else {
            return command.execute(interaction)
        }
    } catch (err) {
        console.log(err)
    }
})

// AUTO COMPLETE
client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (!interaction.isAutocomplete()) return

        const command = interaction.client.commands.get(interaction.commandName)
        if (!command) return console.error(`No command matching ${interaction.commandName} was found.`)
    
        return command.autocomplete(interaction)
    } catch (err) {
        console.log(err)
    }
})

// BUTTON SUBMIT
client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (!interaction.isButton()) return

        if (interaction.message?.content?.includes('Do you still wish to play Trivia?')) {
            await interaction.update({ components: [] }).catch((err) => console.log(err))
            const customId = interaction.customId
            const isConfirmed = customId.charAt(0) === 'Y'
            const entryId = customId.slice(1)
            return handleTriviaConfirmation(interaction, entryId, isConfirmed)
        } else if (interaction.message?.content?.includes(`I've found a Rated`)) {
            await interaction.update({ components: [] }).catch((err) => console.log(err))
            const customId = interaction.customId
            const isConfirmed = customId.charAt(0) === 'Y'
            const ids = customId.slice(2).split('-')
            const yourPoolId = ids[0]
            const opponentsPoolId = ids[1]
            const serverId = ids[2]
            return handleRatedConfirmation(client, interaction, isConfirmed, yourPoolId, opponentsPoolId, serverId)
        } else if (interaction.message?.content?.includes('Should this tournament be seeded')) {
            await interaction.message.edit({ components: [] }).catch((err) => console.log(err))
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
            await interaction.message.edit({ components: [] }).catch((err) => console.log(err))
            const [answer, userId, tournamentId] = interaction.customId?.split('-') || []
            if (userId !== interaction.user.id) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
    
            if (answer === 'Y') {
                return await createTopCut(interaction, tournamentId)
            } else {
                // If user does not wish to create a top cut for their Swiss event, then end the tournament:
                return await endSwissTournamentWithoutPlayoff(interaction, tournamentId)
            }
        }
    } catch (err) {
        console.log(err)
    }
})

// MODAL SUBMIT
client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (!interaction.isModalSubmit()) return
        await interaction.deferReply()
    
        if (interaction.customId?.includes('create')) {
            // REMOVE ALL WEIRD SYMBOLS.
            // const name = removeLeadingZerosFromWords(
            //         interaction.fields.getTextInputValue('name')
            //     ?.replace(/[/|\\()[\]{}<>~^%&?@#,;"'`_*+=]/g, '')
            //     ?.replace(/\s+/g, ' ')
            // )
             
            const name = interaction.fields.getTextInputValue('name')

            const tournament_type = interaction.customId?.includes('SW') ? 'swiss' :
                interaction.customId?.includes('SE') ? 'single elimination' :
                interaction.customId?.includes('DE') ? 'double elimination' :
                'round robin'
                
            const knownAbbreviation = getKnownAbbreviation(name)
            const suggestedAbbreviation = getSuggestedAbbreviation(name)

            // REMOVE ALL NON ALPHA NUMERICS. CONFIRM ALPHAS PRECEDE NUMERICS. PUT EXACTLY ONE ZERO AT FRONT OF NUMBERS.
            const alphas = knownAbbreviation || suggestedAbbreviation
            const digits = extractDigitsAndPadZeros(name)
            const abbreviation = alphas ? alphas + digits : null
            
            const decipherRankedInput = (input = '') => !input.toLowerCase()?.includes('u')
            const decipherDurationInput = (input = '') => !input.toLowerCase()?.includes('m')
            const isRanked = interaction.fields.fields.get('ranked') ? decipherRankedInput(interaction.fields.getTextInputValue('ranked')) : true
            const isLive = interaction.fields.fields.get('duration') ? decipherDurationInput(interaction.fields.getTextInputValue('duration')) : true
            
            const formatName = interaction.fields.fields.get('formatName') ? interaction.fields.getTextInputValue('formatName') : null
            const channelName = interaction.fields.fields.get('channelName') ? interaction.fields.getTextInputValue('channelName') : null
        
            return createTournament(interaction, formatName, name, abbreviation, tournament_type, channelName, isRanked, isLive)
        } else if (interaction.customId?.includes('settings')) {
            const name = capitalize(interaction.fields.getTextInputValue('name'))

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
    
            const decipherRankedInput = (input = '') => !input.toLowerCase()?.includes('u')
            const decipherDurationInput = (input = '') => !input.toLowerCase()?.includes('m')
    
            let tournament_type, isRanked, isLive

            if (interaction.fields.fields.get('type')) {
                tournament_type = decipherTournamentTypeInput(interaction.fields.getTextInputValue('type'))
            }

            if (interaction.fields.fields.get('ranked')) {
                isRanked = decipherRankedInput(interaction.fields.getTextInputValue('ranked'))
            }

            if (interaction.fields.fields.get('duration')) {
                isLive = decipherDurationInput(interaction.fields.getTextInputValue('duration'))
            }

            const url = interaction.fields.getTextInputValue('url')
            const tournamentId = interaction.customId?.split('-')[1]
    
            return updateTournament(interaction, tournamentId, name, tournament_type, url, isRanked, isLive)
        } else if (interaction.customId?.includes('tiebreakers')) {
            const decipherTieBreakerInput = (input = '') => {
                input = input.toLowerCase()
                if (input.includes('mb') || input.includes('med')) {
                    return 'median buchholz'
                } else if (input.includes('wvt') || input.includes('wins vs')) {
                    return 'match wins vs tied'
                } else if (input.includes('pd') || input.includes('point')) {
                    return 'points difference'
                } else if (input.includes('oowp') || input.includes('s opp')) {
                    return `opponents opponents win percentage`
                } else if (input.includes('owp') || input.includes('opp')) {
                    return `opponents win percentage`
                } else {
                    return null
                }
            }
        
            let tieBreaker1 = 'median buchholz'
            let tieBreaker2 = 'match wins vs tied'
            let tieBreaker3 = null

            if (interaction.fields.fields.get('tb1')) {
                tieBreaker1 = decipherTieBreakerInput(interaction.fields.getTextInputValue('tb1'))
            }

            if (interaction.fields.fields.get('tb2')) {
                tieBreaker2 = decipherTieBreakerInput(interaction.fields.getTextInputValue('tb2'))
            }

            if (interaction.fields.fields.get('tb3')) {
                tieBreaker3 = decipherTieBreakerInput(interaction.fields.getTextInputValue('tb3'))
            }

            const tournamentId = interaction.customId?.split('-')[1]
    
            return editTieBreakers(interaction, tournamentId, tieBreaker1, tieBreaker2, tieBreaker3)
        } else if (interaction.customId.includes('points')) {    
            let pointsPerMatchWin = '1.0'
            let pointsPerMatchTie = '0.0'
            let pointsPerBye = '1.0'

            if (interaction.fields.fields.get('ppwin')) {
                pointsPerMatchWin = interaction.fields.getTextInputValue('ppwin')
            }

            if (interaction.fields.fields.get('pptie')) {
                pointsPerMatchTie = interaction.fields.getTextInputValue('pptie')
            }

            if (interaction.fields.fields.get('ppbye')) {
                pointsPerBye = interaction.fields.getTextInputValue('ppbye')
            }

            const tournamentId = interaction.customId?.split('-')[1]
    
            return editPointsSystem(interaction, tournamentId, pointsPerMatchWin, pointsPerMatchTie, pointsPerBye)
        }
    } catch (err) {
        console.log(err)
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
            if (!isModerator(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await closeTournament(interaction, tournamentId)
            return interaction.message?.edit({components: []}).catch((err) => console.log(err))
        } else if (command.data.name === 'deck') {
            if (!isModerator(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const id = interaction.values[0]
            await sendDeck(interaction, id)
            return interaction.message?.edit({components: []}).catch((err) => console.log(err))
        } else if (command.data.name === 'drop') {
            const userId = interaction.message.components[0].components[0].data.custom_id
            if (userId !== interaction.member.id) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await dropFromTournament(interaction, tournamentId)
            return interaction.message?.edit({ components: []}).catch((err) => console.log(err))
        }  else if (command.data.name === 'end') {
            if (!isModerator(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await initiateEndTournament(interaction, tournamentId)
            return interaction.message?.edit({components: []}).catch((err) => console.log(err))
        } else if (command.data.name === 'film') {
            const tournamentId = interaction.values[0]
            const userId = interaction.message.components[0].components[0].data.custom_id
            await getFilm(interaction, tournamentId, userId)
            return interaction.message?.edit({components: []}).catch((err) => console.log(err))
        } else if (command.data.name === 'join') {
            const userId = interaction.message.components[0].components[0].data.custom_id
            if (userId !== interaction.member.id) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await joinTournament(interaction, tournamentId)
            return interaction.message?.edit({components: []}).catch((err) => console.log(err))
        } else if (command.data.name === 'noshow') {
            if (!isModerator(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            const userId = interaction.message.components[0].components[0].data.custom_id
            await processNoShow(interaction, tournamentId, userId)
            return interaction.message.edit({ components: []}).catch((err) => console.log(err))
        } else if (command.data.name === 'open') {
            if (!isModerator(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await openTournament(interaction, tournamentId)
            return interaction.message?.edit({components: []}).catch((err) => console.log(err))
        } else if (command.data.name === 'remove') {
            if (!isModerator(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            const userId = interaction.message.components[0].components[0].data.custom_id
            await removeFromTournament(interaction, tournamentId, userId)
            return interaction.message?.edit({ components: []}).catch((err) => console.log(err))
        } else if (command.data.name === 'replay') {
            const [userId, replayExtension] = interaction.message.components[0].components[0].data.custom_id.split(':')
            if (userId !== interaction.member.id) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const match = await Match.findOne({ where: { id: interaction.values[0] }})
            const tournament = await Tournament.findOne({ where: { id: match.tournamentId }})
            const url = `https://www.duelingbook.com/replay?id=${replayExtension}`
            await saveReplay(server, interaction, match, tournament, url)
            return interaction.message?.edit({components: []}).catch((err) => console.log(err))
        } else if (command.data.name === 'settimer') {
            if (!isModerator(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            const [hours, minutes] = interaction.message.components[0].components[0].data.custom_id.split(':')
            await setTimerForTournament(interaction, tournamentId, hours, minutes)
            return interaction.message?.edit({components: []}).catch((err) => console.log(err))
        } else if (command.data.name === 'signup') {
            if (!isModerator(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const userId = interaction.message.components[0].components[0].data.custom_id
            const tournamentId = interaction.values[0]
            await signupForTournament(interaction, tournamentId, userId)
            return interaction.message?.edit({components: []}).catch((err) => console.log(err))
        } else if (command.data.name === 'standings') {
            const userId = interaction.message.components[0].components[0].data.custom_id
            if (userId !== interaction.member.id) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await postStandings(interaction, tournamentId)
            return interaction.message?.edit({components: []}).catch((err) => console.log(err))
        } else if (command.data.name === 'start') {
            if (!isModerator(server, interaction.member)) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await startTournament(interaction, tournamentId)
            return interaction.message?.edit({components: []}).catch((err) => console.log(err))
        } else if (command.data.name === 'timer') {
            const userId = interaction.message.components[0].components[0].data.custom_id
            if (userId !== interaction.member.id) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const tournamentId = interaction.values[0]
            await checkTimer(interaction, tournamentId)
            return interaction.message?.edit({components: []}).catch((err) => console.log(err))
        } else if (command.data.name === 'undo') {
            const authorIsMod = isModerator(server, interaction.member)
            if (!authorIsMod) return interaction.channel.send(`<@${interaction.member.id}>, You do not have permission to do that.`)
            const matchId = interaction.values[0]
            await undoMatch(interaction, server, matchId, authorIsMod)
            return interaction.message?.edit({components: []}).catch((err) => console.log(err))
        } else {
            return
        }
	} catch (error) {
		console.error(error)
		return interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true }).catch((err) => console.log(err))
	}
})

// WELCOME
client.on('guildMemberAdd', async (member) => {    
    try {
        const guild = member.guild
        const server = await Server.findOne({ 
            where: { id: guild.id }
        })
        
        if (!server || !hasPartnerAccess(server)) return
        const channel = guild.channels.cache.get(server.welcomeChannelId)
        if (await isNewUser(member.user.id)) await createPlayer(member) 
        if (await isNewMember(guild.id, member.user.id)) {
            await createMembership(guild, member)
            if (!channel) return
            const format = await Format.findOne({
                where: {
                    [Op.or]: {
                        name: server.formatName,
                        id: server.formatId
                    }
                },
                attributes: ['emoji']
            })

            return channel.send({ content: `${member}, Welcome to the ${guild.name} ${server.logo} Discord server. ${format?.emoji || emojis.legend}`})
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
        
        const membership = await Membership.findOne({ where: { '$player.discordId$': member.user.id, serverId: guild.id }, include: Player })
        membership.isActive = false

        const channel = guild.channels.cache.get(server.welcomeChannelId)
        if (channel) channel.send({ content: `Oh dear. ${member.user.username} has left the server. ${emojis.sad}`})
        await membership.save()
    } catch (err) {
        console.log(err)
    }
})

// SUBSCRIPTION
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    try {
        if (oldMember.guild.id !== '414551319031054346') return
        const oldRoles = oldMember.roles.cache
        const newRoles = newMember.roles.cache
    
        const wasSubscriber = oldRoles.has('1102002844850208810')
        const isSubscriber = newRoles.has('1102002844850208810')
        const wasTest = oldRoles.has('414576126107844609')
        const isTest = newRoles.has('414576126107844609')
    
        if ((wasSubscriber && !isSubscriber) || (wasTest && !isTest)) {
            const programmer = await client.users.fetch('194147938786738176')
                        
            const player = await Player.findOne({
                where: {
                    discordId: oldMember.id
                }
            })
    
            const subscriberTier = player.subscriberTier
            await player.update({ isSubscriber: false, subscriberTier: null })
            return await programmer.send({ content: `${oldMember.user?.username} is no longer a Subscriber (${subscriberTier}).` })
        } else if ((!wasSubscriber && isSubscriber) || (!wasTest && isTest)) {
            const programmer = await client.users.fetch('194147938786738176')
            
            const player = await Player.findOne({
                where: {
                    discordId: oldMember.id
                }
            })
    
            const isSupporter = newRoles.has('1102020060631011400')
            const isPremium = newRoles.has('1102002847056400464')
            const isDoublePremium = newRoles.has('1102796965592449044')
            
            if (isSupporter) {
                await player.update({ isSubscriber: true, subscriberTier: 'Supporter' })
                console.log(`Welcome ${oldMember.user?.username} to the Supporter Tier!`)
                return await programmer.send({ content: `Welcome ${oldMember.user?.username} to the Supporter Tier!` })
            } else if (isPremium) {
                await player.update({ isSubscriber: true, subscriberTier: 'Premium' })
                console.log(`Welcome ${oldMember.user?.username} to the Premium Tier!`)
                return await programmer.send({ content: `Welcome ${oldMember.user?.username} to the Premium Tier!` })
            } else if (isDoublePremium) {
                await player.update({ isSubscriber: true, subscriberTier: 'Double Premium' })
                console.log(`Welcome ${oldMember.user?.username} to the Double Premium Tier!`)
                return await programmer.send({ content: `Welcome ${oldMember.user?.username} to the Double Premium Tier!` })
            } else {
                await player.update({ isSubscriber: true, subscriberTier: 'Unknown' })
                console.log(`Welcome ${oldMember.user?.username} to the Subscribers(?)!`)
                return await programmer.send({ content: `Welcome ${oldMember.user?.username} to the Subscribers(?)!` })
            }
        }
    } catch (err) {
        console.log(err)
    }
});