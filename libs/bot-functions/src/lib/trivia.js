
import { Player, TriviaEntry, TriviaQuestion, TriviaKnowledge } from '@fl/models'
const FuzzySet = require('fuzzyset')
import { emojis } from '@fl/bot-emojis'
const yescom = ['yes', 'ye', 'y', 'ya', 'yea', 'yeah', 'da', 'ja', 'si', 'ok', 'sure']
const triviaRole = '1085310457126060153'

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
            const confirming = await TriviaEntry.count({ where: { confirmed: 'confirming' }})
            if (!confirming) return

            const count = await TriviaEntry.count({ where: { confirmed: false }})

            if (!count) {
                for (let j = 0; j < entries.length; j++) {
                    const entry = entries[j]
                    entry.status = 'playing'
                    await entry.save()
                }

                assignTriviaRoles(entries)
                setTimeout(() => {
                    interaction.channel.send({ content: `<@&1085310457126060153>, look alive bookworms! Trivia starts in 10 seconds. ${emojis.skipper}\n\nP.S. Remember: answer questions **in your DMs**.`})
                }, 1000)

                return setTimeout(() => { return askQuestion(interaction, round, questions) }, 11000)
            }
        }, i * 5000)
    }
}

//GET TRIVIA CONFIRMATION
export const getTriviaConfirmation = async (interaction, entry) => {
    entry.status = 'confirming'
    await entry.save()
    const discordId = entry.player.discordId
    const member = interaction.guild.members.cache.get(discordId)
    if (!member || discordId !== member.user.id) return interaction.channel.send({ content: `${entry.playerName} cannot be sent DMs.` })
    const filter = m => m.author.id === discordId
    const message = await member.send({ content: `Do you still wish to play Trivia?`}).catch((err) => console.log(err))
    if (!message || !message.channel) return false

	await message.channel.awaitMessages({ 
        filter,
        max: 1,
		time: 60000
	}).then(async (collected) => {
        const response = collected.first().content.toLowerCase()
        const count = await TriviaEntry.count({ where: { status: 'confirming' }})
        if (!count) return member.send({ content: `Sorry, time expired.` })

        if (yescom.includes(response)) {
            entry.confirmed = true
            await entry.update({ confirmed: true })
            member.send({ content: `Thanks! Please wait to see if everyone confirms.`})
            return interaction.channel.send({ content: `${member.user.username} confirmed their participation in Trivia! 📚`})
        } else {
            member.send({ content: `Okay, sorry to see you go!`})
            return interaction.channel.send({ content: `Oof. ${member.user.username} ducked out of Trivia! 📚`})
        }
	}).catch((err) => {
		console.log(err)
        return member.send({ content: `Sorry, time's up.`})
	})
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
    entries.forEach((entry) => getAnswer(interaction, entry, question.content, round))

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
                const timedOut = entry.answer === 'no answer' ? true : false
                interaction.channel.send({ content: `${entry.playerName}${timedOut ? ` did not answer in time. That's a shame. ${emojis.orange}` : ` said: ${entry.answer}. ${score ? `Correct! ${emojis.cultured}` : `That ain't it! ${emojis.amongmfao}`}`}`})
            }, i * 2000)
        }
        
        if (!atLeastOneCorrect) setTimeout(() => interaction.channel.send({ content: `The correct answer is: **${answers[0]}**`}), updatedEntries.length * 2000)
        return setTimeout(() => postTriviaStandings(interaction, round, updatedEntries, questions), updatedEntries.length * 2000 + 3000)
    }, 24000)
}

//GET ANSWER
export const getAnswer = async (interaction, entry, content, round) => {
    const discordId = entry.player.discordId
    const member = interaction.guild.members.cache.get(discordId)
    if (!member || discordId !== member.user.id) return
    
    const filter = m => m.author.id === discordId
	const message = await member.send({ content: `${emojis.megaphone}  ------  Question #${round}  ------  ${emojis.dummy}\n${content}`}).catch((err) => console.log(err))
	if (!message || !message.channel) return false
    
    await message.channel.awaitMessages({ filter,
		max: 1,
		time: 20000
	}).then(async (collected) => {
        await entry.update({ answer: collected.first().content })
        return member.send({ content: `Thanks!`})
	}).catch(async (err) => {
		console.log(err)
        await entry.save({ answer: 'no answer'})
        return member.send({ content: `Time's up!`})
	})
}

//ASSIGN TRIVIA ROLES
export const assignTriviaRoles = (interaction, entries) => {    
    entries.forEach((entry) => {
        const member = interaction.guild.members.cache.get(entry.playerId)
        member.roles.add(triviaRole)
    })
}

//CHECK ANSWER
export const checkAnswer = async (answer, fuzzyAnswers, stringency) => {
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
    const title = `${emojis.no} --- Trivia ${round < 10 ? `Round ${round}` : 'Final'} Standings --- ${emojis.yes}`
    const standings = entries.map((entry, index) => {
        const score = entry.score
        let enthusiasm = ''
        for (let i = 0; i < score; i++) enthusiasm += `${emojis.gradcap} `
        const unit = score === 1 ? 'pt' : 'pts'
       return `${index + 1}. <@${entry.playerId}> - ${score}${unit} ${enthusiasm}`
    })

    interaction.channel.send({ content: `${title}\n${standings.join("\n")}`})
    round++

    return setTimeout(() => {
        if (round <= 10) return askQuestion(interaction, round, questions)
        else return endTrivia(interaction, entries)
    }, 10000)
}

//END TRIVIA
export const endTrivia = async (interaction, entries) => {
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const member = interaction.guild.members.cache.get(entry.player.discordId)
        member.roles.remove(triviaRole).catch((err) => console.log(err))
        await entry.destroy()
    }
}
