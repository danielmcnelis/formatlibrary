
import { getDeckType } from './deck'
import { Deck, DeckType, Entry, Server, Stats, Tournament } from '@fl/models'
import { Op } from 'sequelize'
import axios from 'axios'
import { shuffleArray } from './utility'

export const testGetDeckType = async (eventId = '') => {
    const decks = await Deck.findAll({
        where: {
            // eventId: eventId,
            deckTypeName: {[Op.or]: ['Other', null]}
        },
        order: [['formatId', 'ASC'], ['id', 'ASC']]
    })

    for (let i = 0; i < decks.length; i++) {
        try {
            const deck = decks[i]
            const ydk = deck.ydk
            const formatName = deck.formatName
            const deckType = await getDeckType(ydk, formatName)

            if (deckType) {
                await deck.update({
                    deckTypeName: deckType.name,
                    deckTypeId: deckType.id
                })

                console.log(`Labeling ${deck.builderName}'s deck ${deck.id} as: ${deckType.name}`)
            } else {
                console.log(`<!> Could not determine type for ${deck.builderName}'s deck ${deck.id} <!>`)
                continue
            }
    
        } catch (err) {
            console.log(err)
        }
    }
}

//SEED
export const testSeed = async (tournamentId = '12464468', shuffle = false) => {
    const tournament = await Tournament.findOne({ where: { id: tournamentId }})
    const server = await Server.findOne({ where: { name: 'GoatFormat.com' }})
 
    if (shuffle) {
        try {
            await axios({
                method: 'post',
                url: `https://api.challonge.com/v1/tournaments/${tournament.id}/participants/randomize.json?api_key=${server.challongeApiKey}`
            })
            
            console.log(`Success! Your seeds 🌱 have been shuffled! 🎲`)
        } catch (err) {
            console.log(`Error: Your seeds 🥀 have not been shuffled. 😢`)
        }
    } else {
        console.log(`Seeding 🌱 in progress, please wait. 🙏`)

        const entries = await Entry.findAll({ where: { isActive: true, tournamentId: tournament.id } })  
        const serverId = '414551319031054346'  
        const expEntries = []
        const newbieEntries = []
    
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i]
            const playerId = entry.playerId
            const stats = await Stats.findOne({ where: { formatId: tournament.formatId, playerId, serverId }})
            
            if (stats) {
                expEntries.push([entry.participantId, entry.playerName, stats.elo])
            } else {
                newbieEntries.push([entry.participantId, entry.playerName, null])
            }
        }
    
        const seeds = [...expEntries.sort((a, b) => b[2] - a[2]), ...shuffleArray(newbieEntries)]  
        let count = 0
        const results = []
        let e = 0
    
        for (let i = 0; i < seeds.length; i++) {
            const participantId = seeds[i][0]
            const name = seeds[i][1]
    
            try {
                await axios({
                    method: 'put',
                    url: `https://api.challonge.com/v1/tournaments/${tournament.id}/participants/${participantId}.json?api_key=${server.challongeApiKey}`,
                    data: {
                        participant: {
                            seed: i+1
                        }
                    }
                })
                
                results.push(`${name} is now the ${i+1} seed.`)
                count++
            } catch (err) {
                e++
                if (e >= (seeds.length * 10)) {
                    results.push(`Error: Failed to set ${name} (participantId: ${participantId}) as the ${i+1} seed.`)
                } else {
                    console.log(`Error: Failed to set ${name} (participantId: ${participantId}) as the ${i+1} seed.`)
                    i--
                }
            }
        }
    
        for (let i = 0; i < results.length; i += 30) console.log(results.slice(i, i + 30).join('\n').toString())
        if (count !== seeds.length) console.log(`Error seeding 🥀 tournament. Please fix seeds manually if desired. 🤠`)
        return
    }
}

// testSeed()
// testGetDeckType()