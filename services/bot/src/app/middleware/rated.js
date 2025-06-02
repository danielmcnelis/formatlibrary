
import { Deck, Format, Match, Pairing, Player, Pool } from '@fl/models'
import { Op } from 'sequelize'
import { getRatedConfirmation, sendRatedJoinNotifications, sendRatedPairingAnnouncement, sendRatedPairingNotifications } from '@fl/bot-functions'
import { client } from '../client'

// JOIN RATED POOL
export const joinRatedPool = async (req, res, next) => {
    try {
        const player = await Player.findById(req.body.playerId)
        const format = await Format.findById(req.query.formatId)
        const deck = await Deck.findById(req.query.deckId)
        const guild = client.guilds.cache.get('414551319031054346')

        const isResubmission = await Pool.count({
            where: {
                formatId: format.id,
                playerId: player.id
            }
        })

        const pool = isResubmission ? await Pool.findOne({
            where: {
                formatId: req.query.formatId,
                playerId: req.body.playerId
            }
        }) : await Pool.create({
            playerName: player.name,
            formatName: format.name,
            formatId: format.id,
            status: 'pending',
            playerId: player.id,
            deckFile: deck.ydk || deck.opdk
        })

        const potentialPairs = await Pool.findAll({ 
            where: { 
                playerId: {[Op.not]: player.id },
                status: 'pending',
                formatId: format.id
            },
            include: [Player, Format],
            order: [['createdAt', 'ASC']]
        }) || []

        if (!isResubmission) await sendRatedJoinNotifications(client, player, format, deck, isResubmission)

        if (!potentialPairs.length) {
            if (!isResubmission) {
                return res.json({pool: { ...pool.dataValues, player, format }})
            } else {
                return res.status(304)
            }
        }

        for (let i = 0; i < potentialPairs.length; i++) {
            const potentialPair = potentialPairs[i]
            const opponent = potentialPair.player
            const ppid = potentialPair.playerId

            const twoMinutesAgo = new Date(Date.now() - (2 * 60 * 1000))
            const cutoff = new Date(new Date() - (15 * 60 * 1000))

            const mostRecentMatch = await Match.findOne({
                where: {
                    [Op.or]: [
                        { winnerId: player.id, loserId: potentialPair.playerId },
                        { loserId: player.id, winnerId: potentialPair.playerId },
                    ],
                    formatId: format.id
                },
                order: [['createdAt', 'DESC']]
            })            
    
            if (mostRecentMatch && cutoff < mostRecentMatch?.createdAt) { 
                console.log(`<!> ${player.name} and ${potentialPair.playerName} are RECENT opponents. Match reported at ${mostRecentMatch?.createdAt}, cutoff is ${cutoff}. Look for another opponent <!>`)
                continue
            } else if (potentialPair.updatedAt < twoMinutesAgo) {
                console.log(`<!> ${player.name} and ${potentialPair.playerName} are NOT recent opponents. Match reported at ${mostRecentMatch?.createdAt}, cutoff is ${cutoff}. Getting confirmation from ${potentialPair.playerName} <!>`)
                await getRatedConfirmation(opponent, player, format, guild)
                continue
            } else {
                console.log(`<!> ${player.name} and ${potentialPair.playerName} are NOT recent opponents. Match reported at ${mostRecentMatch?.createdAt}, cutoff is ${cutoff}. Creating New Pairing <!>`)
                await sendRatedPairingNotifications(client, player, opponent, format)

                const count1 = Pairing.count({
                    where: {
                        status: 'active',
                        [Op.or]: {
                            playerAId: player.id,
                            playerBId: player.id,
                        },
                        createdAt: {[Op.gte]: twoMinutesAgo}
                    }
                })
    
                const count2 = Pairing.count({
                    where: {
                        status: 'active',
                        [Op.or]: {
                            playerAId: opponent.id,
                            playerBId: opponent.id,
                        },
                        createdAt: {[Op.gte]: twoMinutesAgo}
                    }
                })
    
                if (count1 || count2) {
                    console.log(`RATED API <!> DO NOT PAIR <!>`)
                    return
                }

                const pairing = await Pairing.create({
                    formatId: format.id,
                    formatName: format.name,
                    playerAName: pool.playerName,
                    playerAId: pool.playerId,
                    deckFileA: pool.deckFile,
                    playerBName: potentialPair.playerName,
                    playerBId: potentialPair.playerId,
                    deckFileB: potentialPair.deckFile
                })
                
                await pool.destroy()
                await potentialPair.destroy()

                const poolsToDeactivate = await Pool.findAll({
                    where: {
                        playerId: {[Op.or]: [player.id, ppid]}
                    }
                }) || []

                for (let d = 0; d < poolsToDeactivate.length; d++) {
                    const rPTD = poolsToDeactivate[d]
                    await rPTD.update({ status: 'inactive', wasInactive: true })
                }
    
                await sendRatedPairingAnnouncement(client, player, opponent, format)  
                return res.json({pairing: { ...pairing.dataValues, playerA: player, playerB: opponent, format }})
            }
        }

        return res.json({pool: { ...pool.dataValues, player, format }})
    } catch (err) {
        next(err)
    }
}