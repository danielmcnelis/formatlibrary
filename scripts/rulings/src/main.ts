import { Card, Ruling } from '@fl/models'
import { Op } from 'sequelize'
const rulings = require('../../../rulings.json')

;(async () => {
    for (let i = 0; i < rulings.length; i++) {
        const ruling: any = rulings[i]
        
        const card = await Card.findOne({ where: { name: {[Op.iLike]: ruling.CardName }}})
        if (!card) continue

        const baseRulings = ruling.Rulings_Base?.split("\\n") || []
        for (let i = 0; i < baseRulings.length; i++) {
            const content = baseRulings[i].slice(baseRulings[i].indexOf('. ') + 1).replaceAll('●', '').trim()
            if (!content.length) continue
            if (await Ruling.count({ where: { content: {[Op.iLike]: content}, cardId: card.id }})) {
                continue
            } else {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: content
                })
            }
        }

        const goatRulings = ruling.Rulings_Goat?.split("\n●") || []
        for (let i = 0; i < goatRulings.length; i++) {
            const content = goatRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (!await Ruling.count({ 
                where: { 
                    content: {[Op.iLike]: content}, 
                    cardId: card.id, 
                    formatId: 8 
                }
            })) {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: content,
                    formatName: 'Goat',
                    formatId: 8,
                })
            }
        }

        const edisonRulings = ruling.Rulings_Edison?.split("\n●") || []
        for (let i = 0; i < edisonRulings?.length; i++) {
            const content = edisonRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (!await Ruling.count({ 
                where: { 
                    content: {[Op.iLike]: content}, 
                    cardId: card.id,
                    formatId: 20
                }
            })) {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: content,
                    formatName: 'Edison',
                    formatId: 20,
                })
            }
        }

        const tenguRulings = ruling.Rulings_Tengu?.split("\n●") || []
        for (let i = 0; i < tenguRulings.length; i++) {
            const content = tenguRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (!await Ruling.count({ 
                where: { 
                    content: {[Op.iLike]: content}, 
                    cardId: card.id,
                    formatId: 24
                }
            })) {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: content,
                    formatName: 'Tengu Plant',
                    formatId: 24,
                })
            }
        }

        const hatRulings = ruling.Rulings_HAT?.split("\n●") || []
        for (let i = 0; i < hatRulings.length; i++) {
            const content = hatRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (!await Ruling.count({ 
                where: { 
                    content: {[Op.iLike]: content}, 
                    cardId: card.id,
                    formatId: 32
                }
            })) {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: content,
                    formatName: 'HAT',
                    formatId: 32,
                })
            }
        }

        const vegasRulings = ruling.Rulings_Vegas?.split("\n●") || []
        for (let i = 0; i < vegasRulings.length; i++) {
            const content = vegasRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (!await Ruling.count({ 
                where: { 
                    content: {[Op.iLike]: content}, 
                    cardId: card.id,
                    formatId: 64
                }
            })) {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: content,
                    formatName: 'Vegas',
                    formatId: 64,
                })
            }
        }

        const meadowlandsRulings = ruling.Rulings_Meadowlands?.split("\n●") || []
        for (let i = 0; i < meadowlandsRulings.length; i++) {
            const content = meadowlandsRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (!await Ruling.count({ 
                where: { 
                    content: {[Op.iLike]: content}, 
                    cardId: card.id,
                    formatId: 28
                }
            })) {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: content,
                    formatName: 'Meadowlands',
                    formatId: 28,
                })
            }
        }

        const fwRulings = ruling.Rulings_FireWater?.split("\n●") || []
        for (let i = 0; i < fwRulings.length; i++) {
            const content = fwRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (!await Ruling.count({ 
                where: { 
                    content: {[Op.iLike]: content}, 
                    cardId: card.id,
                    formatId: 31
                }
            })) {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: content,
                    formatName: 'Fire-Water',
                    formatId: 31,
                })
            }
        }

        const catRulings = ruling.Rulings_Cat?.split("\n●") || []
        for (let i = 0; i < catRulings.length; i++) {
            const content = catRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (!await Ruling.count({ 
                where: { 
                    content: {[Op.iLike]: content}, 
                    cardId: card.id,
                    formatId: 18
                }
            })) {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: content,
                    formatName: 'Cat',
                    formatId: 18,
                })
            }
        }

        const teledadRulings = ruling.Rulings_TeleDAD?.split("\n●") || []
        for (let i = 0; i < teledadRulings.length; i++) {
            const content = teledadRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (!await Ruling.count({ 
                where: { 
                    content: {[Op.iLike]: content}, 
                    cardId: card.id,
                    formatId: 17
                }
            })) {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: content,
                    formatName: 'TeleDAD',
                    formatId: 17,
                })
            }
        }

        const gladRulings = ruling.Rulings_Gladiator?.split("\n●") || []
        for (let i = 0; i < gladRulings.length; i++) {
            const content = gladRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (!await Ruling.count({ 
                where: { 
                    content: {[Op.iLike]: content}, 
                    cardId: card.id,
                    formatId: 16
                }
            })) {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: content,
                    formatName: 'Gladiator',
                    formatId: 16,
                })
            }
        }

        const dadretRulings = ruling.Rulings_ReturnDAD?.split("\n●") || []
        for (let i = 0; i < dadretRulings.length; i++) {
            const content = dadretRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (!await Ruling.count({ 
                where: { 
                    content: {[Op.iLike]: content}, 
                    cardId: card.id,
                    formatId: 15
                }
            })) {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: content,
                    formatName: 'DAD Return',
                    formatId: 15,
                })
            }
        }

        const trooperRulings = ruling.Rulings_Trooper?.split("\n●") || []
        for (let i = 0; i < trooperRulings.length; i++) {
            const content = trooperRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (!await Ruling.count({ 
                where: { 
                    content: {[Op.iLike]: content}, 
                    cardId: card.id,
                    formatId: 13
                }
            })) {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: content,
                    formatName: 'Trooper',
                    formatId: 13,
                })
            }
        }

        const pcRulings = ruling.Rulings_Circle?.split("\n●") || []
        for (let i = 0; i < pcRulings.length; i++) {
            const content = pcRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (!await Ruling.count({ 
                where: { 
                    content: {[Op.iLike]: content}, 
                    cardId: card.id,
                    formatId: 14
                }
            })) {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: content,
                    formatName: 'Perfect Circle',
                    formatId: 14,
                })
            }
        }

        const steinRulings = ruling.Rulings_Stein?.split("\n●") || []
        for (let i = 0; i < steinRulings.length; i++) {
            const content = steinRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (!await Ruling.count({ 
                where: { 
                    content: {[Op.iLike]: content}, 
                    cardId: card.id,
                    formatId: 12
                }
            })) {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: content,
                    formatName: 'Stein',
                    formatId: 12,
                })
            }
        }
    }
})()
