
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
            include: Player,
            order: [['createdAt', 'ASC']]
        }) || []

        await sendRatedJoinNotifications(client, player, format, deck, isResubmission)

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
            const tenMinutesAgo = new Date(Date.now() - (10 * 60 * 1000))

            const yourRecentOpponents = [...await Match.findAll({
                where: {
                    [Op.or]: {
                        winnerId: player.id,
                        loserId: player.id
                    },
                    formatName: format.name,
                    createdAt: {[Op.gte]: tenMinutesAgo }
                }
            })].map((m) => {
                if (player.id === m.winnerId) {
                    return m.loserId
                } else {
                    return m.winnerId
                }
            }) || []

            if (yourRecentOpponents.includes(ppid)) {
                continue
            } else if (potentialPair.updatedAt < twoMinutesAgo) {
                await getRatedConfirmation(client, opponent, player, format)
                continue
            } else {
                await sendRatedPairingNotifications(client, player, opponent, format)

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
                    await rPTD.update({ status: 'inactive' })
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