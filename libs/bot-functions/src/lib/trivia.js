
import { Player, TriviaEntry, TriviaQuestion, TriviaKnowledge } from '@fl/models'
const FuzzySet = require('fuzzyset')
import { emojis } from '@fl/bot-emojis'
const triviaRole = '1085310457126060153'
import { client } from '../client'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import e from 'express'

//INITIATE TRIVIA
export const initiateTrivia = async (interaction) => {
    interaction.channel.send({ content: `Trivia players, please check your DMs!`})
    const entries = await TriviaEntry.findAll({ include: Player })
    for (let i = 0; i < entries.length; i++) getTriviaConfirmation(interaction, entries[i])
    let round = 1

    let questions = await TriviaQuestion.findAll({
        where: { askedRecently: false },
        order: [["order", "ASC"]],
        limit: 10
    })

    if (questions.length < 10) {
        questions = [...questions, ...await TriviaQuestion.findAll({
            where: { askedRecently: true },
            order: [["order", "ASC"]],
            limit: 10 - questions.length
        })]
    }

    for (let i = 1; i < 12; i ++) {
        setTimeout(async () => {
            const playing = await TriviaEntry.count({ where: { status: 'playing' }})
            if (playing) return
            const unconfirmed = await TriviaEntry.count({ where: { confirmed: false }})

            if (!unconfirmed) {
                for (let j = 0; j < entries.length; j++) {
                    const entry = entries[j]
                    await entry.update({ status: 'playing' })
                }

                assignTriviaRoles(entries)
                setTimeout(() => {
                    interaction.channel.send({ content: `<@&${triviaRole}>, look alive bookworms! Trivia starts in 10 seconds. ${emojis.skipper}\n\nP.S. Remember: answer questions **in your DMs**.`})
                }, 1000)

                return setTimeout(() => { return askQuestion(interaction, round, questions) }, 11000)
            }
        }, i * 5000)
    }

    return setTimeout(async () => {
        const playing = await TriviaEntry.count({ where: { status: 'playing' }})
        if (playing) return

        const missingEntries = await TriviaEntry.findAll({ where: { confirmed: false }})
        const missingNames = missingEntries.map((entry) => entry.playerName)

        for (let i = 0; i < missingEntries.length; i++) {
            const entry = missingEntries[i]
            await entry?.destroy()
        }

        const remainingEntries = await TriviaEntry.findAll({ where: { confirmed: true }})

        if (remainingEntries.length < 4) {    
            for (let i = 0; i < remainingEntries.length; i++) {
                const entry = remainingEntries[i]
                await entry?.update({ status: 'pending', confirmed: false })
            }

            return interaction.channel.send({ content: `Unfortunately, Trivia cannot begin without at least 4 players. 📚 🐛\n\nThe following players have been removed from the queue:\n${missingNames.sort().join("\n")}`})
        } else {
            for (let i = 0; i < remainingEntries.length; i++) {
                const entry = entries[i]
                await entry?.update({ status: 'playing' })
            }

            assignTriviaRoles(entries)
            setTimeout(() => {
                interaction.channel.send({ content: `<@&${triviaRole}>, look alive bookworms! Trivia starts in 10 seconds. ${emojis.skipper}`})
            }, 1000)

            return setTimeout(() => { return askQuestion(interaction, round, questions) }, 11000)
        }
    }, 61000)
}

//GET TRIVIA CONFIRMATION
export const getTriviaConfirmation = async (interaction, entry) => {
    entry.status = 'confirming'
    await entry.save()
    const discordId = entry.player.discordId
    const guild = client.guilds.cache.get('414551319031054346')
    const member = await guild.members.fetch(discordId)
    if (!member) return interaction.channel.send({ content: `${entry.playerName} cannot be sent DMs.` })
    
    const row = new ActionRowBuilder()
    .addComponents(new ButtonBuilder()
        .setCustomId(`Y${entry.id}`)
        .setLabel('Yes')
        .setStyle(ButtonStyle.Primary)
    )

    .addComponents(new ButtonBuilder()
        .setCustomId(`N${entry.id}`)
        .setLabel('No')
        .setStyle(ButtonStyle.Primary)
    )

    await member.user.send({ content: `Do you still wish to play Trivia? 📚 🐛`, components: [row] })
}

//HANDLE TRIVIA CONFIRMATION
export const handleTriviaConfirmation = async (interaction, entryId, confirmed) => {
    const entry = await TriviaEntry.findOne({ where: { id: entryId }})
    const count = await TriviaEntry.count({ where: { status: 'confirming' }})
    if (!count) return interaction.user?.send({ content: `Sorry, time expired.` })
    const guild = client.guilds.cache.get('414551319031054346')
    const triviaChannel = guild.channels.cache.get('1085316454053838981')

    if (confirmed) {
        await entry.update({ confirmed: true })
        await interaction.user?.send({ content: `Thanks! Please wait to see if enough players confirm. ${emojis.cultured}`})
        return triviaChannel?.send({ content: `${entry.playerName} confirmed their participation in Trivia! 📚 🐛`})
    } else {
        await interaction.user?.send({ content: `Okay, sorry to see you go!`})
        return triviaChannel?.send({ content: `Oof. ${entry.playerName} ducked out of Trivia! 🦆`})
    }
}

//ASK QUESTION
export const askQuestion = async (interaction, round, questions) => {
    const question = questions[round - 1]  
    await question.update({ askedRecently: true })

    const answers = JSON.parse(question.answers)
	let fuzzyAnswers = FuzzySet([], false)
    answers.forEach((a) => fuzzyAnswers.add(a))
    interaction.channel.send({ content: `${emojis.megaphone}  ------  Question #${round}  ------  ${emojis.dummy}\n${question.content}\n\n`})
    
    const entries = await TriviaEntry.findAll({ include: Player })
    entries.forEach((entry) => getAnswer(entry, question.content, round))

    setTimeout(async() => {
        const updatedEntries = await TriviaEntry.findAll({ include: Player })
        let atLeastOneCorrect = false

        for (let i = 0; i < updatedEntries.length; i++) {
            const entry = updatedEntries[i]
            const score = await checkAnswer(entry.answer, fuzzyAnswers, question.stringency)
            if (score === true) { 
                atLeastOneCorrect = true
                entry.score++
                await checkKnowledge(entry.playerId, question.id)
            }

            await entry.save()

            setTimeout(() => {
                interaction.channel.send({ content: `${entry.playerName}${entry.answer === null ? ` did not answer in time. That's a shame. ${emojis.orange}` : ` said: ${entry.answer}. ${score ? `Correct! ${emojis.cultured}` : `That ain't it! ${emojis.amongmfao}`}`}`})
            }, i * 2000)
        }
        
        if (!atLeastOneCorrect) setTimeout(() => interaction.channel.send({ content: `The correct answer is: **${answers[0]}**`}), updatedEntries.length * 2000)
        return setTimeout(() => postTriviaStandings(interaction, round, updatedEntries, questions), updatedEntries.length * 2000 + 3000)
    }, 24000)
}

//GET ANSWER
export const getAnswer = async (entry, content, round) => {
    const discordId = entry.player.discordId
    const guild = client.guilds.cache.get('414551319031054346')
    const member = await guild.members.fetch(discordId)
    
    if (!member || discordId !== member.user.id) return
    
    const filter = m => m.author.id === discordId
	const message = await member.user.send({ content: `${emojis.megaphone}  ------  Question #${round}  ------  ${emojis.dummy}\n${content}`}).catch((err) => console.log(err))
	if (!message || !message.channel) return false
    
    await message.channel.awaitMessages({ filter,
		max: 1,
		time: 20000
	}).then(async (collected) => {
        await entry.update({ answer: collected.first().content })
        return member.user.send({ content: `Thanks!`})
	}).catch(async (err) => {
		console.log(err)
        await entry.save({ answer: 'no answer'})
        return member.user.send({ content: `Time's up!`})
	})
}

//ASSIGN TRIVIA ROLES
export const assignTriviaRoles = (entries) => {  
    const guild = client.guilds.cache.get('414551319031054346')
    entries.forEach(async (entry) => {
        const member = await guild.members.fetch(entry.player.discordId)
        member.roles.add(triviaRole)
    })
}

//CHECK ANSWER
export const checkAnswer = async (answer = '', fuzzyAnswers, stringency) => {
    if (typeof answer !== 'string') return false
    const matching = fuzzyAnswers.get(answer, null, stringency) || []
	matching.sort((a, b) => b[0] - a[0])

    if (!matching[0]) {
        return false
    } else {
        return true
    }
}

//CHECK KNOWLEDGE
export const checkKnowledge = async (playerId, triviaQuestionId) => {
    const count = await TriviaKnowledge.count({ where: { triviaQuestionId: triviaQuestionId, playerId: playerId } })
    if (!count) {
        await TriviaKnowledge.create({
            triviaQuestionId: triviaQuestionId, 
            playerId: playerId
        })
    }
}

//POST TRIVIA STANDINGS
export const postTriviaStandings = async (interaction, round, entries, questions) => {
    entries.sort((a, b) => b.score - a.score)
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        await entry.update({ answer: null })
    }

    const title = `${emojis.no} --- Trivia ${round < 10 ? `Round ${round}` : 'Final'} Standings --- ${emojis.yes}`
    const standings = entries.map((entry, index) => {
        const score = entry.score
        let enthusiasm = ''
        for (let i = 0; i < score; i++) enthusiasm += `${emojis.gradcap} `
        const unit = score === 1 ? 'pt' : 'pts'
        return `${index + 1}. <@${entry.player.discordId}> - ${score}${unit} ${enthusiasm}`
    })

    for (let i = 0; i < entries.length; i += 5) {
        if (i === 0) {
            interaction.channel.send({ content: `${title}\n${standings.slice(i, i + 5).join("\n")}`})
        } else {
            interaction.channel.send({ content: `${standings.slice(i, i + 5).join("\n")}`})
        }
    }

    if (round < 10) {
        round++
        return setTimeout(() => askQuestion(interaction, round, questions), 10000)
    } else {
        return endTrivia(entries)
    }
}

//END TRIVIA
export const endTrivia = async (entries) => {
    for (let i = 0; i < entries.length; i++) {
        try {
            const entry = entries[i]
            const player = entry.player
            if (i === 0 || entries[0].score === entry.score) {
                await player.update({ triviaWins: (player.triviaWins || 0) + 1})
            }
        } catch (err) {
            console.log(err)
        }
    }

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const discordId = entry.player.discordId
        await entry.destroy().catch((err) => console.log(err))

        const guild = client.guilds.cache.get('414551319031054346')
        const member = await guild.members.fetch(discordId)
        member.roles.remove(triviaRole).catch((err) => console.log(err))
    }
}
