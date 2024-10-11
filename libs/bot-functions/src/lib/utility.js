
//UTILITY FUNCTIONS

//MODULE IMPORTS
const Canvas = require('canvas')
import { ActionRowBuilder, EmbedBuilder, AttachmentBuilder, StringSelectMenuBuilder } from 'discord.js'
import { Op } from 'sequelize'
import axios from 'axios'
import { Card, OPCard, Membership, Player, Print, Role, Set, Status, Tournament } from '@fl/models'
import { emojis, rarities } from '@fl/bot-emojis'
import { config } from '@fl/config'

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

//FETCH OP CARD NAMES
export const fetchOPCardNames = async () => {
    const names = [...await OPCard.findAll()].map((card) => card.name)
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
            '$set.tcgDate$': {[Op.lte]: format.date}
        },
        include: Set,
        order: [[Set, 'tcgDate', 'DESC']]
    }) : null

    const status = format ? await Status.findOne({ 
        where: { 
            banlist: format.banlist,
            category: format.category,
            name: {
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
            order: [[Set, 'tcgDate', 'ASC'], ['marketPrice', 'DESC']]
        }) : 
        await Print.findOne({
            where: {
                cardId: card.id
            },
            include: Set,
            order: [[Set, 'tcgDate', 'ASC'], ['marketPrice', 'DESC']]
        })

    const firstPrint = print ? `${rarities[print.rarity]} ${print.set.setName}` : null 
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
		card.category === "Monster" && card.fusion ? "#a930ff" :
		card.category === "Monster" && card.ritual ? "#3b7cf5" :
		card.category === "Monster" && card.synchro ? "#ebeef5" :
		card.category === "Monster" && card.xyz ? "#6e6e6e" :
		card.category === "Monster" && card.pendulum ? "#a5e096" :
		card.category === "Monster" && card.link ? "#468ef2" :
		card.category === "Monster" && card.normal ? "#faf18e" :
		card.category === "Monster" && card.effect ? "#f5b042" :
		null

	const classes = []
	if (card.normal) classes.push("Normal")
	if (card.fusion) classes.push("Fusion")
	if (card.ritual) classes.push("Ritual")
	if (card.synchro) classes.push("Synchro")
	if (card.xyz) classes.push("Xyz")
	if (card.pendulum) classes.push("Pendulum")
	if (card.link) classes.push("Link")
	if (card.flip) classes.push("Flip")
	if (card.gemini) classes.push("Gemini")
	if (card.spirit) classes.push("Spirit")
	if (card.toon) classes.push("Toon")
	if (card.tuner) classes.push("Tuner")
	if (card.union) classes.push("Union")
	if (card.effect) classes.push("Effect")

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
            `\n${card.xyz ? `Rank: ${card.level} ${emojis.Rank}` : card.link ? `Link Rating: ${card.rating} ${emojis.Link}` : `Level: ${card.level} ${emojis.Star}`}`,
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
			` ${!card.link ? `DEF: ${card.def === null ? '?' : card.def} ${emojis.DEF}` : ''}` :
			null
	
	const attachment = new AttachmentBuilder(`https://cdn.formatlibrary.com/images/cards/${card.artworkId}.jpg`, { name: `${card.artworkId}.jpg` })
	const thumbnail = attachment ? `attachment://${card.artworkId}.jpg` : `https://ygoprodeck.com/pics/${card.artworkId}.jpg`    
    
    const cardEmbed = new EmbedBuilder()
        .setColor(color)
	    .setTitle(card.name)
	    .setThumbnail(thumbnail)
	    .setDescription(
            `${labels.join('')}` + 
            `\n\n${recentPrint?.description ? recentPrint.description + `\n\n*-- ${recentPrint.setName}, ${dateToSimple(recentPrint.set.tcgDate)}*` : card.description}` +
            `${stats ? `\n\n${stats}` : ''}` +
            `\n\nhttps://formatlibrary.com/cards/${card.cleanName.replaceAll(' ', '-').toLowerCase()}`
        )
	return { cardEmbed, attachment }
}

// GET OP CARD
export const getOPCard = async (query, fuzzyOPCards) => {
	const card_name = await findCard(query, fuzzyOPCards)

	const card = await OPCard.findOne({ 
		where: { 
            [Op.or]: {
                name: {[Op.iLike]: card_name || '' },
                cardCode: {[Op.iLike]: query }
            }
		},
        order: [["westernDate", "DESC"]]
	})

	if (!card) return false

	const color = card.color === "black" ? "#1c1c1c" :
        card.color === "blue" ? "#0170b7" :
		card.color === "blue-black" ? "#688db0" :
		card.color === "blue-purple" ? "#6280b2" :
		card.color === "blue-yellow" ? "#679b85" :
		card.color === "don" ? "#010101" :
		card.color === "green" ? "#188b66" :
		card.color === "green-black" ? "#1a624c" :
		card.color === "green-blue" ? "#66a6a6" :
		card.color === "green-yellow" ? "#b1c482" :
		card.color === "purple" ? "#8c1b7b" :
		card.color === "purple-black" ? "#615265" :
		card.color === "purple-yellow" ? "#bc9e9c" :
		card.color === "red" ? "#b8051a" :
		card.color === "red-black" ? "#855d5d" :
		card.color === "red-blue" ? "#a3929d" :
		card.color === "red-green" ? "#ab977b" :
		card.color === "yellow" ? "#e5d631" :
		null

    const releaseDate = card.westernDate ? dateToVerbose(card.westernDate, true, false, true) : 
        card.westernLegal ? 'Western Legal'
        : 'Eastern Only'
    
    let labels = 
        // `${card.color ? `\nColor: ${capitalize(card.color)}` : ''}` +
        `${card.cost ? `\nCost: ${card.cost} ${emojis.DON}` : ''}` +
        `${card.attribute ? `\nAttribute: ${card.attribute.toUpperCase()} ${emojis[card.attribute.toUpperCase()]}` : ''}` +
        `\nRelease Date: ${releaseDate}` +
        `\n**[** ${capitalize(card.category)} ${emojis[card.category]}${card.type ? ` - ${card.type}` : ''} **]**`

	let stats =  
        `${card.life ? `Life: ${card.life} ❤️ ` : ''}` +
        `${card.power ? `Power: ${card.power} 🥊 ` : ''}` +
        `${card.counter ? `Counter: +${card.counter} ⚡ ` : ''}`
	
	const attachment = new AttachmentBuilder(card.artwork, { name: `${card.cardCode}.jpg` })
	const thumbnail = attachment ? `attachment://${card.cardCode}.jpg` : null   
    
    const cardEmbed = new EmbedBuilder()
        .setColor(color)
	    .setTitle(`${card.cardCode}${card.category !== 'DON' ? ` - ${card.name}` : ''}`)
	    .setThumbnail(thumbnail)
	    .setDescription(
            labels + 
            `\n\n${card.effect}` +
            `${stats.length ? `\n\n${stats}` : ''}`
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

// DRAW OP DECK
export const drawOPDeck = async (opdk) => {
    const splt = opdk.trim().split(/[\s]+/)
    const leader = [splt[0].slice(2)]
    const main = []
    for (let i = 1; i < splt.length; i++) {
        let s = splt[i]
        let n = parseInt(s[0])
        while (n > 0) {
            main.push(s.slice(2))
            n--
        }
    }

    const leaderAttachment = await makeOPCanvasAttachment(leader, 114, 160, 1, 'leader')
    const mainAttachment = main.length ? await makeOPCanvasAttachment(main, 57, 80, 10, 'main') : null
 
    const attachments = [
        leaderAttachment,
        mainAttachment
    ].filter((e) => !!e)

    return attachments
}

// MAKE OP CANVAS ATTACHMENT
export const makeOPCanvasAttachment = async (cardsArr = [], width = 57, height = 80, cardsPerRow = 10, name = 'main') => {
    try {
        const rows = Math.ceil(cardsArr.length / cardsPerRow)
        const canvas = Canvas.createCanvas(width * cardsPerRow, height * rows)
        const context = canvas.getContext('2d')

        for (let i = 0; i < cardsArr.length; i++) {
            try {
                const cardCode = cardsArr[i]
                const opCard = await OPCard.findOne({ where: { cardCode }})
                const row = Math.floor(i / cardsPerRow)
                const col = i % cardsPerRow
                const image = await Canvas.loadImage(opCard.artwork)
                context.drawImage(image, width * col, row * height, width, height)
            } catch (err) {
                console.log(err)
            }
        }

        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: `${name}.png` })
        return attachment
    } catch (err) {
        console.log(err)
        return null
    }
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
    membership.active = true
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

//CONVERT ARRAY TO OBJECT
export const convertArrayToObject = (arr = []) => {
    const obj = {}
    arr.forEach(e => obj[e] ? obj[e]++ : obj[e] = 1)
    return obj
}

//CREATE PLAYER
export const createPlayer = async (member, data) => {
    if (member && !member.user.bot) {
        if (!data) {
            try {
                const res = await axios.get(`https://discord.com/api/v9/users/${member.user.id}`, {
                    headers: {
                      Authorization: `Bot ${config.services.bot.token}`
                    }
                })

                if (res) data = res.data
            } catch (err) {
                console.log(err)
            }
        }

        try {
            const id = await Player.generateId()
            await Player.create({
                id: id,
                name: data?.global_name || data?.display_name || `${member.user.username}`,
                discordId: `${member.user.id}`,
                discordName: `${member.user.username}`,
                globalName: data?.global_name,
                discriminator: `${member.user.discriminator}`
            })
        } catch (err) {
            console.log(err)
        }
    }
}

//CREATE MEMBERSHIP
export const createMembership = async (guild, member) => {
    try {
        const count = await Player.count({ where: { discordId: member.user.id }})
        if (!count) await createPlayer(member)
        const player = await Player.findOne({ where: { discordId: member.user.id }})

        await Membership.create({
            guildName: guild.name,
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
    if (tournament.type === 'single elimination') {
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
    } else if (tournament.type === 'double elimination') {
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
        : stats <= 230 ? `Tilted ${emojis.mad}`
        : (stats > 230 && stats <= 290) ?  `Chump ${emojis.sad}`
        : (stats > 290 && stats <= 350) ?  `Rock ${emojis.rock}`
        : (stats > 350 && stats <= 410) ?  `Bronze ${emojis.bronze}`
        : (stats > 410 && stats <= 470) ?  `Silver ${emojis.silver}`
        : (stats > 470 && stats <= 530) ?  `Gold ${emojis.gold}`
        : (stats > 530 && stats <= 590) ?  `Platinum ${emojis.platinum}`
        : (stats > 590 && stats <= 650) ?  `Diamond ${emojis.diamond}`
        : (stats > 650 && stats <= 710) ?  `Master ${emojis.master}`
        : (stats > 710 && stats <= 770) ?  `Legend ${emojis.legend}`
        : (stats > 770 && stats <= 830) ? `Deity ${emojis.god}`
        : `Ascended ${emojis.treeborn}`
    } else {
        return !stats ? emojis.gold
        : stats <= 230 ? emojis.mad
        : (stats > 230 && stats <= 290) ? emojis.sad
        : (stats > 290 && stats <= 350) ? emojis.rock
        : (stats > 350 && stats <= 410) ? emojis.bronze
        : (stats > 410 && stats <= 470) ? emojis.silver
        : (stats > 470 && stats <= 530) ? emojis.gold
        : (stats > 530 && stats <= 590) ? emojis.platinum
        : (stats > 590 && stats <= 650) ? emojis.diamond
        : (stats > 650 && stats <= 710) ? emojis.master
        : (stats > 710 && stats <= 770) ? emojis.legend
        : (stats > 770 && stats <= 830) ? emojis.god
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
export const isMod = (server, member) => member?._roles.includes(server?.modRole) || member?._roles.includes(server?.adminRole) || member?._roles.includes(server?.judgeRole) || member?.user?.id === '194147938786738176'

//IS SERVER MANAGER?
export const isServerManager = (member) => member.permissions?.has('MANAGE_SERVER')

//IS IRON PLAYER?
export const isIronPlayer = (member) => member?._roles.includes('948006324237643806')

//IS NEW MEMBER?
export const isNewMember = async (serverId, discordId) => !await Membership.count({ where: { serverId, '$player.discordId$': discordId }, include: Player })

//IS NEW USER?
export const isNewUser = async (discordId) => !await Player.count({ where: { discordId: discordId } })

//IS TOURNAMENT PLAYER?
export const isTourPlayer = (server, member) => member?._roles.includes(server?.tourRole)

// SELECT MATCH
export const selectMatch = async (interaction, matches, replayExtension = '') => {
    if (matches.length === 0) return false
    if (matches.length === 1) return matches[0]

    const now = Date.now()
    const options = matches.map((match, index) => {
        const difference = now - match.createdAt
        const timeAgo = difference < 1000 * 60 * 60 ?  `${Math.round(difference / (1000 * 60))}m ago` :
            difference >= 1000 * 60 * 60 && difference < 1000 * 60 * 60 * 24 ? `${Math.round(difference / (1000 * 60 * 60))}h ago` :
            difference >= 1000 * 60 * 60 * 24 && difference < 1000 * 60 * 60 * 24 * 30 ? `${Math.round(difference / (1000 * 60 * 60 * 24))}d ago` :
            difference >= 1000 * 60 * 60 * 24 * 30 && difference < 1000 * 60 * 60 * 24 * 365 ? `${Math.round(difference / (1000 * 60 * 60 * 24 * 30))}mo ago` :
            `${Math.round(difference / (1000 * 60 * 60 * 24 * 365))}y ago`
                        
        return {
            label: `(${index + 1}) ${match.winner} > ${match.loser} (${timeAgo})`,
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