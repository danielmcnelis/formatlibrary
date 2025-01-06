
//UTILITY FUNCTIONS

//MODULE IMPORTS
const Canvas = require('canvas')
import { ActionRowBuilder, EmbedBuilder, AttachmentBuilder, StringSelectMenuBuilder } from 'discord.js'
import { Op } from 'sequelize'
import axios from 'axios'
import { Card, Membership, Player, Print, Role, Server, Set, Status, Tournament } from '@fl/models'
import { emojis, rarities } from '@fl/bot-emojis'
import { config } from '@fl/config'
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'

// GET NEXT DATE AT MIDNIGHT
export const getNextDateAtMidnight = (date) => {
    const nextDay = new Date(date)
    nextDay.setDate(date.getDate() + 1)
    nextDay.setHours(0, 0, 0, 0)
    return nextDay
}

// GET FIFTEENTH OF NEXT MONTH
export const getFifteenthOfNextMonth = (date = new Date()) => {
    const nextMonth = new Date(date)
      nextMonth.setMonth(date.getMonth() + 1)
      nextMonth.setDate(15)
      nextMonth.setHours(0, 0, 0, 0)
    return nextMonth
  }

// COUNT DAYS BETWEEN DATES
export const countDaysInBetweenDates = (d1, d2) => Math.abs(d2.getTime() - d1.getTime()) / (24 * 60 * 60 * 1000)

//DATE TO SIMPLE
export const dateToSimple = (date = 'N/A') => {
    const year = typeof date === 'string' ? date.slice(2, 4) : date.getFullYear().slice(2, 4)
    const month = typeof date === 'string' ? parseInt(date.slice(5, 7), 10) : date.getMonth() + 1
    const day = typeof date === 'string' ? parseInt(date.slice(8, 10), 10) : date.getDate()
    const simple = `${month}/${day}/${year}`
    return simple
}

//DATE TO VERBOSE
export const dateToVerbose = (date = 'N/A', long = true, ordinal = true, includeYear = true) => {
    const year = typeof date === 'string' ? date.slice(0, 4) : date.getFullYear()
    const longMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    const shortMonths = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."]
    const month = typeof date === 'string' ? parseInt(date.slice(5, 7), 10) - 1 : date.getMonth()
    const monthStr = long ? longMonths[month] : shortMonths[month]
    const day = typeof date === 'string' ? parseInt(date.slice(8, 10), 10) : date.getDate()
    const dayStr = ordinal ? ordinalize(day) : day
    const verbose = includeYear ? `${monthStr} ${dayStr}, ${year}` :  `${monthStr} ${dayStr}`
    return verbose
}

// ORDINALIZE
export const ordinalize = (int) => {
    const suffixes = ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"]
    switch (int % 100) {
    case 11:
    case 12:
    case 13:
        return int + "th"
    default:
        return int + suffixes[int % 10]
    }
}

//URLIZE
export const urlize = (str) => str.replace(/[\s]/g, '-').toLowerCase()

//FETCH CARD NAMES
export const fetchCardNames = async () => {
    const names = [...await Card.findAll()].map((card) => card.name)
    return names
}

//FETCH SKILL CARD NAMES
export const fetchSkillCardNames = async () => {
    const names = [...await Card.findAll({ where: { category: 'Skill' }})].map((card) => card.name)
    return names
}

//FIND CARD
export const findCard = async (query, fuzzyCards) => {
    const fuzzy_search = fuzzyCards.get(query, null, 0.36) || []
	fuzzy_search.sort((a, b) => b[0] - a[0])
	if (!fuzzy_search[0]) return false

	let partial_match
	if (query.length >= 10) {
		for (let i = 0; i < fuzzy_search.length; i++) {
			const result = fuzzy_search[i][1]
			if (result.replace(/[^\ws]/gi, "").toLowerCase().includes(query.toLowerCase())) {
				partial_match = result
				break
			}
		}
	}

	const card_name = partial_match ? partial_match :
		fuzzy_search[0][0] > 0.5 ? fuzzy_search[0][1] :
		null
		
    return card_name
}

// GET CARD
export const getCard = async (query, fuzzyCards, format) => {
	const card_name = await findCard(query, fuzzyCards)
	if (!card_name) return false

	const card = await Card.findOne({ 
		where: { 
			name: {
				[Op.iLike]: card_name
			}
		}
	})

    if (!card) return false

    const recentPrint = format?.date ? await Print.findOne({
        where: {
            cardId: card.id,
            description: {[Op.not]: null},
            '$set.releaseDate$': {[Op.lte]: format.date}
        },
        include: Set,
        order: [[Set, 'releaseDate', 'DESC']]
    }) : null

    const status = format ? await Status.findOne({ 
        where: { 
            banlist: format.banlist,
            category: format.category,
            cardName: {
                [Op.iLike]: card_name
            }
        }
    }) : null

    const print = format?.category === 'Speed' ? 
        await Print.findOne({
            where: {
                cardId: card.id,
                setName: {[Op.substring]: 'Speed Duel'}
            },
            include: Set,
            order: [[Set, 'releaseDate', 'ASC'], ['marketPrice', 'DESC']]
        }) : 
        await Print.findOne({
            where: {
                cardId: card.id
            },
            include: Set,
            order: [[Set, 'releaseDate', 'ASC'], ['marketPrice', 'DESC']]
        })

    const firstPrint = print ? `${rarities[print.rarity]} ${print.set.name}` : null 
    const dateType = format?.category?.toLowerCase() + 'Date'
    const legal = format && card[dateType] && (card[dateType] <= format.date || format.name === 'Traditional' || format.name === 'Current')
    const position = format?.name === 'Traditional' && legal && status && status.restriction === 'Forbidden' ? 'limited' :
        legal && status ? status.restriction :
        legal && !status ? 'unlimited' :
        'not legal'

    const indicator = position === 'limited' || position === 'limited-1' ? emojis.limited :
        position === 'semi-limited' || position === 'limited-2' ? emojis.semi :
        position === 'no longer on list' || position === 'unlimited' || position === 'limited-3' ? emojis.unlimited :
        position === 'forbidden' ? emojis.forbidden :
        ''

	const color = card.category === "Spell" ? "#42f578" :
		card.category === "Trap" ? "#e624ed" :
		card.category === "Monster" && card.isFusion ? "#a930ff" :
		card.category === "Monster" && card.isRitual ? "#3b7cf5" :
		card.category === "Monster" && card.isSynchro ? "#ebeef5" :
		card.category === "Monster" && card.isXyz ? "#6e6e6e" :
		card.category === "Monster" && card.isPendulum ? "#a5e096" :
		card.category === "Monster" && card.isLink ? "#468ef2" :
		card.category === "Monster" && card.isNormal ? "#faf18e" :
		card.category === "Monster" && card.isEffect ? "#f5b042" :
		null

	const classes = []
	if (card.isNormal) classes.push("Normal")
	if (card.isFusion) classes.push("Fusion")
	if (card.isRitual) classes.push("Ritual")
	if (card.isSynchro) classes.push("Synchro")
	if (card.isXyz) classes.push("Xyz")
	if (card.isPendulum) classes.push("Pendulum")
	if (card.isLink) classes.push("Link")
	if (card.isFlip) classes.push("Flip")
	if (card.isGemini) classes.push("Gemini")
	if (card.isSpirit) classes.push("Spirit")
	if (card.isToon) classes.push("Toon")
	if (card.isTuner) classes.push("Tuner")
	if (card.isUnion) classes.push("Union")
	if (card.isEffect) classes.push("Effect")

    const releaseDate = card[dateType] ? 
        dateToVerbose(card[dateType], true, false, true) : 
        card.tcgDate || 'OCG Only'

    let labels = [
		`\nRelease Date: ${releaseDate}`,
		`\nFirst Print: ${firstPrint || (format?.category === 'Speed' ? 'N/A' : 'OCG Only')}`,
        `${format && format?.name ? `\n${format?.name} ${format?.emoji} Status: ${capitalize(position, true)} ${indicator}` : ''}`
    ]

    if (card.category === 'Monster') {
        labels = [
            `Attribute: ${card.attribute} ${emojis[card.attribute]}`,
            `\n${card.isXyz ? `Rank: ${card.level} ${emojis.Rank}` : card.isLink ? `Link Rating: ${card.rating} ${emojis.Link}` : `Level: ${card.level} ${emojis.Star}`}`,
            ...labels,
            `\n**[** ${card.type} ${emojis[card.type.replace(/[^\ws]/gi, "")]} / ${classes.join(" / ")} **]**`
        ]
    } else {
        labels = [
            `Card: ${card.category} ${emojis[card.category]}`,
            `\nCategory: ${card.icon} ${emojis[card.icon.replace(/[^\ws]/gi, "")]}`,
            ...labels
        ]
    }

	const stats = card.category === "Monster" ? 
			`ATK: ${card.atk === null ? '?' : card.atk} ${emojis.ATK}` + 
			` ${!card.isLink ? `DEF: ${card.def === null ? '?' : card.def} ${emojis.DEF}` : ''}` :
			null
	
	const attachment = new AttachmentBuilder(`https://cdn.formatlibrary.com/images/cards/${card.artworkId}.jpg`, { name: `${card.artworkId}.jpg` })
	const thumbnail = attachment ? `attachment://${card.artworkId}.jpg` : `https://ygoprodeck.com/pics/${card.artworkId}.jpg`    
    
    const cardEmbed = new EmbedBuilder()
        .setColor(color)
	    .setTitle(card.name)
	    .setThumbnail(thumbnail)
	    .setDescription(
            `${labels.join('')}` + 
            `\n\n${recentPrint?.description ? recentPrint.description + `\n\n*-- ${recentPrint.setName}, ${dateToSimple(recentPrint.set.releaseDate)}*` : card.description}` +
            `${stats ? `\n\n${stats}` : ''}` +
            `\n\nhttps://formatlibrary.com/cards/${card.cleanName.replaceAll(' ', '-').toLowerCase()}`
        )
	return { cardEmbed, attachment }
}

// DRAW DECK
export const drawDeck = async (ydk) => {
    const mainArr = ydk.split('#main')[1].split('#extra')[0].split(/[\s]+/).filter((e) => e.length) || []
    const extraArr = ydk.split('#extra')[1].split('!side')[0].split(/[\s]+/).filter((e) => e.length) || []
    const sideArr = ydk.split('!side')[1].split(/[\s]+/).filter((e) => e.length) || []
    const main = []
    const side = []
    const extra = []

    for (let i = 0; i < mainArr.length; i++) {
        let konamiCode = mainArr[i]
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode
        const card = await Card.findOne({ where: { konamiCode: konamiCode }})
        if (!card) continue
        main.push(card)
    }

    for (let i = 0; i < sideArr.length; i++) {
        let konamiCode = sideArr[i]
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode
        const card = await Card.findOne({ where: { konamiCode: konamiCode }})
        if (!card) continue
        side.push(card)
    }

    for (let i = 0; i < extraArr.length; i++) {
        let konamiCode = extraArr[i]
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode
        const card = await Card.findOne({ where: { konamiCode: konamiCode }})
        if (!card) continue
        extra.push(card)
    }

    main.sort((a, b) => {
        if (a.sortPriority > b.sortPriority) {
            return 1
        } else if (b.sortPriority > a.sortPriority) {
            return -1
        } else if (a.name > b.name) {
            return 1
        } else if (b.name > a.name) {
            return -1
        } else {
            return false
        }
    })

    extra.sort((a, b) => {
        if (a.sortPriority > b.sortPriority) {
            return 1
        } else if (b.sortPriority > a.sortPriority) {
            return -1
        } else if (a.name > b.name) {
            return 1
        } else if (b.name > a.name) {
            return -1
        } else {
            return false
        }
    })

    side.sort((a, b) => {
        if (a.sortPriority > b.sortPriority) {
            return 1
        } else if (b.sortPriority > a.sortPriority) {
            return -1
        } else if (a.name > b.name) {
            return 1
        } else if (b.name > a.name) {
            return -1
        } else {
            return false
        }
    })

    const mainAttachment = main.length ? await makeCanvasAttachment(main, 57, 80, 10, 'main') : null
    const extraAttachment = extra.length ? await makeCanvasAttachment(extra, 38, 53, 15, 'extra'): null
    const sideAttachment = side.length ? await makeCanvasAttachment(side, 38, 53, 15, 'side'): null

    const attachments = [
        mainAttachment,
        extraAttachment,
        sideAttachment
    ].filter((e) => !!e)

    return attachments
}

// MAKE CANVAS ATTACHMENT
export const makeCanvasAttachment = async (cardsArr = [], width = 57, height = 80, cardsPerRow = 10, name = 'main') => {
    try {
        const rows = Math.ceil(cardsArr.length / cardsPerRow)
        const canvas = Canvas.createCanvas(width * cardsPerRow, height * rows)
        const context = canvas.getContext('2d')

        for (let i = 0; i < cardsArr.length; i++) {
            try {
                const card = cardsArr[i]
                const row = Math.floor(i / cardsPerRow)
                const col = i % cardsPerRow
                const image = await Canvas.loadImage(`https://cdn.formatlibrary.com/images/cards/${card.artworkId}.jpg`)
                context.drawImage(image, width * col, row * height, width, height)
            } catch (err) {
                console.log(err)
            }
        }

        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: `${name}Deck.png` })
        return attachment
    } catch (err) {
        console.log(err)
        return null
    }
}

//ASSIGN ROLES
export const assignRoles = async (guild, member) => {
    const membership = await Membership.findOne({ where: { '$player.discordId$': member.user.id, serverId: guild.id }, include: Player })
    if (!membership) return
    membership.isActive = true
    await membership.save()
    const roles = await Role.findAll({ where: { membershipId: membership.id } })
    roles.forEach(async (r) => { 
        try {
            await member.roles.add(r.roleId).catch((err) => console.log(err))
        } catch (err) {
            console.log(err)
        }
    })
}

//CAPITALIZE
export const capitalize = (str = '', eachWord = false) => {
    if (!str) return

    if (eachWord) {
      return str.split(' ')
        .map((s) => capitalize(s))
        .join(' ')
        .split('-')
        .map((s) => capitalize(s))
        .join('-')
    } else {
      const charZero = str.charAt(0) || ''
      return charZero.toUpperCase() + str.slice(1)
    }
}

// REMOVE LEADING ZEROS FROM WORDS
export const removeLeadingZerosFromWords = (str = '') => {
    return str.split(' ').map(word => word.replace(/^0+/, '')).join(' ')
}

//CONVERT ARRAY TO OBJECT
export const convertArrayToObject = (arr = []) => {
    const obj = {}
    arr.forEach(e => obj[e] ? obj[e]++ : obj[e] = 1)
    return obj
}

//CREATE PLAYER
export const createPlayer = async (member) => {
    if (member && !member.user.bot) {
        try {
            const id = await Player.generateId()
            await Player.create({
                id: id,
                name: `${member.user?.username}`,
                discordId: `${member.user?.id}`,
                discordName: `${member.user?.username}`
            })
        } catch (err) {
            console.log(err)
        }
    }
}

// CHECK IF DISCORD NAME IS TAKEN
export const checkIfDiscordNameIsTaken = async (discordName) => {
    const player = await Player.findOne({
        where: {
            discordName: discordName
        }
    })

    if (player) {
        const updatedPlayer = await getAndUpdateDiscordName(player)
        if (updatedPlayer.discordName === discordName) {
            return true
        } else {
            return false
        }
    } else {
        return false
    }
}

// GET AND UPDATE DISCORD NAME
export const getAndUpdateDiscordName = async (player) => {
    try {
        const {data: user } = await axios.get(`https://discord.com/api/v9/users/${player.discordId}`, {
            headers: {
                Authorization: `Bot ${config.services.bot.token}`
            }
        })
    
        await player.update({ discordName: user.username })
    } catch (err) {
        console.log(err)
    }

    return player
}

//CREATE MEMBERSHIP
export const createMembership = async (guild, member) => {
    try {
        const count = await Player.count({ where: { discordId: member.user.id }})
        if (!count) await createPlayer(member)
        const player = await Player.findOne({ where: { discordId: member.user.id }})
        const server = await Server.findOne({ where: { id: guild.id }})

        await Membership.create({
            communityName: server?.communityName,
            playerName: player.name,
            playerId: player.id,
            serverId: guild.id
        })
    } catch (err) {
        console.log(err)
    }
}

// GET ROUND NAME
export const getRoundName = (tournament, roundInt, count) => {
    let roundName
    if (tournament?.type === 'single elimination') {
        const totalRounds = Math.ceil(Math.log2(count))
        const roundsRemaining = totalRounds - roundInt
        roundName = roundsRemaining === 0 ? 'Finals' :
            roundsRemaining === 1 ? 'Semi Finals' :
            roundsRemaining === 2 ? 'Quarter Finals' :
            roundsRemaining === 3 ? 'Round of 16' :
            roundsRemaining === 4 ? 'Round of 32' :
            roundsRemaining === 5 ? 'Round of 64' :
            roundsRemaining === 6 ? 'Round of 128' :
            roundsRemaining === 7 ? 'Round of 256' :
            null
    } else if (tournament?.type === 'double elimination') {
        const totalWinnersRounds = Math.ceil(Math.log2(count)) + 1
        const fullBracketSize = Math.pow(2, Math.ceil(Math.log2(count)))
        const correction = (count - (fullBracketSize / 2)) <= (fullBracketSize / 4) ? -1 : 0
        const totalLosersRounds = (totalWinnersRounds - 2) * 2 + correction
        if (roundInt > 0) {
            const roundsRemaining = totalWinnersRounds - roundInt
            roundName = roundsRemaining <= 0 ? 'Grand Finals' :
                roundsRemaining === 1 ? `Winner's Finals` :
                roundsRemaining === 2 ? `Winner's Semis` :
                roundsRemaining === 3 ? `Winner's Quarters` :
                `Winner's Round of ${Math.pow(2, roundsRemaining)}`
        } else {
            const roundsRemaining = totalLosersRounds - Math.abs(roundInt)
            roundName = roundsRemaining === 0 ? `Loser's Finals` :
                roundsRemaining === 1 ? `Loser's Semis` :
                roundsRemaining === 2 ? `Loser's Thirds` :
                roundsRemaining === 3 ? `Loser's Fifths` :
                roundsRemaining === 3 ? `Loser's Sevenths` :
                `Loser's Round ${Math.abs(roundInt)}`
        }
    } else {
        roundName = `Round ${roundInt}`
    }

    return roundName
}

//GENERATE RANDOM STRING
export const generateRandomString = (length, chars) => {
    let result = '';
    for (let i = length; i > 0; --i) {
        result += chars[Math.floor(Math.random() * chars.length)]
    }
    return result
}

//GET MEDAL
export const getMedal = (stats, title = false) => {
    if (title) {
        return !stats ? `Gold ${emojis.gold}`
        : stats <= 320 ? `Tilted ${emojis.mad}`
        : (stats > 320 && stats <= 360) ?  `Chump ${emojis.sad}`
        : (stats > 360 && stats <= 400) ?  `Rock ${emojis.rock}`
        : (stats > 400 && stats <= 440) ?  `Bronze ${emojis.bronze}`
        : (stats > 440 && stats <= 480) ?  `Silver ${emojis.silver}`
        : (stats > 480 && stats <= 520) ?  `Gold ${emojis.gold}`
        : (stats > 520 && stats <= 560) ?  `Platinum ${emojis.platinum}`
        : (stats > 560 && stats <= 600) ?  `Diamond ${emojis.diamond}`
        : (stats > 600 && stats <= 640) ?  `Master ${emojis.master}`
        : (stats > 640 && stats <= 680) ?  `Legend ${emojis.legend}`
        : (stats > 680 && stats <= 720) ? `Deity ${emojis.god}`
        : `Ascended ${emojis.treeborn}`
    } else {
        return !stats ? emojis.gold
        : stats <= 320 ? emojis.mad
        : (stats > 320 && stats <= 360) ? emojis.sad
        : (stats > 360 && stats <= 400) ? emojis.rock
        : (stats > 400 && stats <= 440) ? emojis.bronze
        : (stats > 440 && stats <= 480) ? emojis.silver
        : (stats > 480 && stats <= 520) ? emojis.gold
        : (stats > 520 && stats <= 560) ? emojis.platinum
        : (stats > 560 && stats <= 600) ? emojis.diamond
        : (stats > 600 && stats <= 640) ? emojis.master
        : (stats > 640 && stats <= 680) ? emojis.legend
        : (stats > 680 && stats <= 720) ? emojis.god
        : emojis.treeborn
    }
}

//GET RANDOM ELEMENT
export const getRandomElement = (arr) => {
    const index = Math.floor((arr.length) * Math.random())
    return arr[index]
}

//GET RANDOM SUBSET
export const getRandomSubset = (arr, n) => {
    const shuffledArr = arr.slice(0)
    let i = arr.length
    let temp
    let index

    while (i--) {
        index = Math.floor((i + 1) * Math.random())
        temp = shuffledArr[index]
        shuffledArr[index] = shuffledArr[i]
        shuffledArr[i] = temp
    }

    return shuffledArr.slice(0, n)
}

//HAS PARTNER ACCESS?
export const hasPartnerAccess = (server) => server?.access === 'partner' || server?.access === 'full'

//IS PROGRAMMER?
export const isProgrammer = (member) => member?.user?.id === '194147938786738176'

//IS COMMUNITY PARTNER?
export const isCommunityPartner = (member) => member?._roles.includes('1120540792654671973')

//IS MOD?
export const isModerator = (server, member) => member?._roles.includes(server?.moderatorRoleId) || member?._roles.includes(server?.adminRoleId) || member?._roles.includes(server?.judgeRoleId) || member?.user?.id === '194147938786738176'

//IS SERVER MANAGER?
export const isServerManager = (member) => member.permissions?.has('MANAGE_SERVER')

//IS NEW MEMBER?
export const isNewMember = async (serverId, discordId) => !await Membership.count({ where: { serverId, '$player.discordId$': discordId }, include: Player })

//IS NEW USER?
export const isNewUser = async (discordId) => !await Player.count({ where: { discordId: discordId } })

//IS TOURNAMENT PLAYER?
export const isTourPlayer = (server, member) => member?._roles.includes(server?.tournamentRoleId)

// PAD ZEROS MID STRING
export const extractDigitsAndPadZeros = (str, len = 2) => {
    let digits =  str.replace(/[^\d]/g, '')

    if (digits.length < len) {
      const index = str?.search(/[1-9]/)
      return extractDigitsAndPadZeros(str.slice(0, index) + '0' + str.slice(index))
    } else {
      return digits
    }
}

// GET ALPHAS
export const getAlphas = (str) => str.replace(/[\d]/g, '')

// GET KNOWN ABBREVIATION
export const getKnownAbbreviation = (name = '') => {
    name = name.toLowerCase()
    const knownAbbreviation = name.includes('abyssgaios gigachads') ? 'AGGC' :
        name.includes('battle at the ravine') ? 'BATR' :
        name.includes('beastmode circuit series championship') ? 'BCSC' :
        name.includes('beastmode circuit series') ? 'BCS' :
        name.includes('blazing cheaters') ? 'BLCH' :
        name.includes('charleston cookoff') ? 'COOK' :
        name.includes('chaos cup') ? 'CHAOS' :
        name.includes('clash of champions') ? 'CLASH' :
        name.includes('clown showdown') ? 'CLSD' :
        name.includes('cyber goat showdown') ? 'CYGS' :
        name.includes('disk commander classic') ? 'DCC' :
        name.includes('duelist crown tournament') ? 'DCT' :
        name.includes('deck devastators') ? 'DDEV' :
        name.includes('digbick dig series') ? 'DDS' :
        name.includes('drama llama classic') ? 'DLC' :
        name.includes('digital link odyssey') ? 'DLO' :
        name.includes('dark side cup') ? 'DSC' :
        name.includes('edison grinders qualifier') ? 'EGQ' :
        name.includes('ellietincan cup') ? 'ETC' :
        name.includes('edison unchained') ? 'EDUC' :
        name.includes('edison world championship qualifier') ? 'EWCQ' :
        name.includes('exciton elimination') ? 'EXEL' :
        name.includes('format library championship') ? 'FLC' :
        name.includes('france championship international') ? 'FCI' :
        name.includes('fiber format monthly') ? 'FFM' :
        name.includes('food bowl') ? 'FOOD' :
        name.includes('2003 time capsule') ? 'TICA' :
        name.includes('follow the white rabbit') ? 'FTWR' :
        name.includes('genesis card gaming online') ? 'GCG' :
        name.includes('goat format european championship') ? 'GFCEU' :
        name.includes('team goat format championship') ? 'TGFC' :
        name.includes('goat format championship') ? 'GFC' :
        name.includes('goat format world championship') ? 'GFWC' :
        name.includes('goat grinders invitational') ? 'GGI' :
        name.includes('gigachad sneak peek') ? 'GSP' :
        name.includes('goat world war') ? 'GWW' :
        name.includes('hat championship') ? 'HWC' :
        name.includes('high five vegas') ? 'HFV' :
        name.includes('treasure hunt') ? 'HUNT' :
        name.includes('jinzo jackers') ? 'JACK' :
        name.includes('joey-pegasus') ? 'JOPE' :
        name.includes('ke$ha klash') ? 'KEKL' :
        name.includes('ke$ha grand prix') ? 'KGP' :
        name.includes('masters of mammals') ? 'MAMA' :               
        name.includes('monster mash') ? 'MASH' :
        name.includes('meadowlands melee') ? 'MLM' :
        name.includes('miami meltdown') ? 'MIME' :
        name.includes('moralltach monthly') ? 'MOMO' :
        name.includes('obelisk') ? 'OBEL' :
        name.includes('pleiades pay') ? 'PPAY' :
        name.includes('patreon world championship qualifier') ? 'PWCQ' :
        name.includes('patron battle royale') ? 'PBR' :
        name.includes('peak beak') ? 'BEAK' :
        name.includes('alphabet breakout cup') ? 'ABC' :
        name.includes('premium world championship qualifier') ? 'PWCQ' :
        name.includes('prophecy cup') ? 'PROC' :
        name.includes('pumpking of games') ? 'PKOG' :
        name.includes('reaper monthly') ? 'REAP' :
        name.includes('science sackers') ? 'SACK' :
        name.includes('electroshock therapy') ? 'SHOCK' :
        name.includes('senatvs popvlvsqve romanvs') ? 'SPQR' :
        name.includes('stardust dragon series') ? 'SDS' :
        name.includes('scuffle at the forum') ? 'SCUF' :
        name.includes('skill charge cup') ? 'SCC' :
        name.includes('tengu rumble') ? 'TERU' :
        name.includes('tengu tussle') ? 'TETU' :
        name.includes('tiger king takedown') ? 'TKT' :
        name.includes('tengumania') ? 'TMAN' :
        name.includes('tengu plant takeover') ? 'TPT' :
        name.includes('toronto summer championship') ? 'TSC' :
        name.includes('toronto time capsule summit') ? 'TTCS' :
        name.includes('toronto time capsule') ? 'TTC' :
        name.includes('vegas monthly') ? 'VEGAS' :
        name.includes('vegas online tournament') ? 'VOT' :
        name.includes('wizards of wind-up') ? 'WIZ' :
        name.includes('wolfbark open') ? 'WOLF' :
        name.includes('warriors of warrior') ? 'WOW' :
        name.includes('woawa world cup') ? 'WWC' :
        name.includes('ygofrom0 retro tournament') ? 'YFZ' :
        name.includes('yugi-kaibaland') ? 'YKL' :
        name.includes('yu-gi-oh! legacy tournament') ? 'YLT' :
        name.includes('yu-gi-oh! retro series') ? 'YRS' :
        name.includes('virtual world') ? 'VWOR' :
        null

    return knownAbbreviation
}

// GET SUGGESTED ABBREVIATION
export const getSuggestedAbbreviation = (str) => str.match(/\b([A-Z])/g).join('')

// SELECT MATCH
export const selectMatch = async (interaction, matches, replayExtension = '') => {
    if (matches.length === 0) return false
    if (matches.length === 1) return matches[0]

    const options = matches.map((match, index) => {
        const difference = Date.now() - match.createdAt
        const timeAgo = difference < 1000 * 60 * 60 ?  `${Math.round(difference / (1000 * 60))}m ago` :
            difference >= 1000 * 60 * 60 && difference < 1000 * 60 * 60 * 24 ? `${Math.round(difference / (1000 * 60 * 60))}h ago` :
            difference >= 1000 * 60 * 60 * 24 && difference < 1000 * 60 * 60 * 24 * 30 ? `${Math.round(difference / (1000 * 60 * 60 * 24))}d ago` :
            difference >= 1000 * 60 * 60 * 24 * 30 && difference < 1000 * 60 * 60 * 24 * 365 ? `${Math.round(difference / (1000 * 60 * 60 * 24 * 30))}mo ago` :
            `${Math.round(difference / (1000 * 60 * 60 * 24 * 365))}y ago`
                        
        return {
            label: `(${index + 1}) ${match.winnerName} > ${match.loserName} (${timeAgo})`,
            value: `${matches[index].id}`,
        }
    })

    const row = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`${interaction.member.id}:${replayExtension}`)
                .setPlaceholder('Nothing selected')
                .addOptions(...options),
        )

    await interaction.editReply({ content: `Please select a match:`, components: [row] })
}

// SET TIMERS
export const setTimers = async (client) => {
    const now = new Date()

    const tournaments = await Tournament.findAll({
        where: {
            deadline: {[Op.not]: null},
            state: 'underway'
        }
    })

    for (let i = 0; i < tournaments.length; i++) {
        try {
            const tournament = tournaments[i]
            const timeRemaining = tournament.deadline - now
            if (timeRemaining < 0) continue
            const guild = client.guilds.cache.get(tournament.serverId)
            const channel = guild.channels.cache.get(tournament.channelId)

            setTimeout(() => {
                return channel.send(`${emojis.high_alert} **Attention: ${tournament.name} Participants!** ${emojis.high_alert} Time is up in the round! ${emojis.vince}`)
            }, timeRemaining)
        } catch (err) {
            console.log(err)
        }
    }
}

//SHUFFLE ARRAY
export const shuffleArray = (arr) => {
    let i = arr.length
    let temp
    let index

    while (i--) {
        index = Math.floor((i + 1) * Math.random())
        temp = arr[index]
        arr[index] = arr[i]
        arr[i] = temp
    }

    return arr
}

//S3 FILE EXISTS
export const s3FileExists = async (filePath) => {
    const command = new HeadObjectCommand({
        Bucket: 'formatlibrary',
        Key: filePath,
    })

    const s3 = new S3Client({
        region: config.s3.region,
        credentials: {
            accessKeyId: config.s3.credentials.accessKeyId,
            secretAccessKey: config.s3.credentials.secretAccessKey
        },
    })

    try {
        await s3.send(command)
        console.log(`File exists: ${filePath}`)
        return true
    } catch (err) {
        console.log(`File DOES NOT exist: ${filePath}`)
        return false
    }
}

// CHECK DIFFERENCE BETWEEN DATES
export const checkTimeBetweenDates = (d1, d2, days) => Math.abs(d1.getTime() - d2.getTime()) < days * 24 * 60 * 60 * 1000