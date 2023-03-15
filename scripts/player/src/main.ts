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
                    content: {[Op.iLike]: content}
                })
            }
        }

        const goatRulings = ruling.Rulings_Goat?.split("\n●") || []
        for (let i = 0; i < goatRulings.length; i++) {
            const content = goatRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (await Ruling.count({ where: { content: {[Op.iLike]: content}, cardId: card.id }})) {
                const ruling = await Ruling.findOne({ where: { content: {[Op.iLike]: content}, cardId: card.id }})
                if (ruling.effectiveDate && ruling.effectiveDate < '2005-04-01') await ruling.update({ effectiveDate: '2005-04-01' })
                if (!ruling.expirationDate || ruling.expirationDate > '2005-10-01') await ruling.update({ expirationDate: '2005-10-01' })
            } else {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: {[Op.iLike]: content},
                    effectiveDate: '2005-04-01',
                    expirationDate: '2005-10-01'
                })
            }
        }

        const edisonRulings = ruling.Rulings_Edison?.split("\n●") || []
        for (let i = 0; i < edisonRulings?.length; i++) {
            const content = edisonRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (await Ruling.count({ where: { content: {[Op.iLike]: content}, cardId: card.id }})) {
                const ruling = await Ruling.findOne({ where: { content: {[Op.iLike]: content}, cardId: card.id }})
                if (ruling.effectiveDate && ruling.effectiveDate < '2010-03-01') await ruling.update({ effectiveDate: '2010-03-01' })
                if (!ruling.expirationDate || ruling.expirationDate > '2010-09-01') await ruling.update({ expirationDate: '2010-09-01' })
            } else {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: {[Op.iLike]: content},
                    effectiveDate: '2010-03-01',
                    expirationDate: '2010-09-01'
                })
            }
        }

        const tenguRulings = ruling.Rulings_Tengu?.split("\n●") || []
        for (let i = 0; i < tenguRulings.length; i++) {
            const content = tenguRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (await Ruling.count({ where: { content: {[Op.iLike]: content}, cardId: card.id }})) {
                const ruling = await Ruling.findOne({ where: { content: {[Op.iLike]: content}, cardId: card.id }})
                if (ruling.effectiveDate && ruling.effectiveDate < '2011-09-01') await ruling.update({ effectiveDate: '2011-09-01' })
                if (!ruling.expirationDate || ruling.expirationDate > '2012-03-01') await ruling.update({ expirationDate: '2012-03-01' })
            } else {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: {[Op.iLike]: content},
                    effectiveDate: '2011-09-01',
                    expirationDate: '2012-03-01'
                })
            }
        }

        const hatRulings = ruling.Rulings_HAT?.split("\n●") || []
        for (let i = 0; i < hatRulings.length; i++) {
            const content = hatRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (await Ruling.count({ where: { content: {[Op.iLike]: content}, cardId: card.id }})) {
                const ruling = await Ruling.findOne({ where: { content: {[Op.iLike]: content}, cardId: card.id }})
                if (ruling.effectiveDate && ruling.effectiveDate < '2014-05-01') await ruling.update({ effectiveDate: '2014-05-01' })
                if (!ruling.expirationDate || ruling.expirationDate > '2014-07-01') await ruling.update({ expirationDate: '2014-07-01' })
            } else {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: {[Op.iLike]: content},
                    effectiveDate: '2014-05-01',
                    expirationDate: '2014-07-01'
                })
            }
        }

        const vegasRulings = ruling.Rulings_Vegas?.split("\n●") || []
        for (let i = 0; i < vegasRulings.length; i++) {
            const content = vegasRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (await Ruling.count({ where: { content: {[Op.iLike]: content}, cardId: card.id }})) {
                const ruling = await Ruling.findOne({ where: { content: {[Op.iLike]: content}, cardId: card.id }})
                if (ruling.effectiveDate && ruling.effectiveDate < '2014-04-01') await ruling.update({ effectiveDate: '2014-04-01' })
                if (!ruling.expirationDate || ruling.expirationDate > '2014-05-01') await ruling.update({ expirationDate: '2014-05-01' })
            } else {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: {[Op.iLike]: content},
                    effectiveDate: '2014-04-01',
                    expirationDate: '2014-05-01'
                })
            }
        }

        const meadowlandsRulings = ruling.Rulings_Meadowlands?.split("\n●") || []
        for (let i = 0; i < meadowlandsRulings.length; i++) {
            const content = meadowlandsRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (await Ruling.count({ where: { content: {[Op.iLike]: content}, cardId: card.id }})) {
                const ruling = await Ruling.findOne({ where: { content: {[Op.iLike]: content}, cardId: card.id }})
                if (ruling.effectiveDate && ruling.effectiveDate < '2013-03-01') await ruling.update({ effectiveDate: '2013-03-01' })
                if (!ruling.expirationDate || ruling.expirationDate > '2013-09-01') await ruling.update({ expirationDate: '2013-09-01' })
            } else {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: {[Op.iLike]: content},
                    effectiveDate: '2013-03-01',
                    expirationDate: '2013-09-01'
                })
            }
        }

        const fwRulings = ruling.Rulings_FireWater?.split("\n●") || []
        for (let i = 0; i < fwRulings.length; i++) {
            const content = fwRulings[i].slice(fwRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (await Ruling.count({ where: { content: {[Op.iLike]: content}, cardId: card.id }})) {
                const ruling = await Ruling.findOne({ where: { content: {[Op.iLike]: content}, cardId: card.id }})
                if (ruling.effectiveDate && ruling.effectiveDate < '2014-01-01') await ruling.update({ effectiveDate: '2014-01-01' })
                if (!ruling.expirationDate || ruling.expirationDate > '2014-04-01') await ruling.update({ expirationDate: '2014-04-01' })
            } else {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: {[Op.iLike]: content},
                    effectiveDate: '2014-01-01',
                    expirationDate: '2014-04-01'
                })
            }
        }

        const catRulings = ruling.Rulings_Cat?.split("\n●") || []
        for (let i = 0; i < catRulings.length; i++) {
            const content = catRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (await Ruling.count({ where: { content: {[Op.iLike]: content}, cardId: card.id }})) {
                const ruling = await Ruling.findOne({ where: { content: {[Op.iLike]: content}, cardId: card.id }})
                if (ruling.effectiveDate && ruling.effectiveDate < '2009-03-01') await ruling.update({ effectiveDate: '2009-03-01' })
                if (!ruling.expirationDate || ruling.expirationDate > '2009-09-01') await ruling.update({ expirationDate: '2009-09-01' })
            } else {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: {[Op.iLike]: content},
                    effectiveDate: '2009-03-01',
                    expirationDate: '2009-09-01'
                })
            }
        }

        const teledadRulings = ruling.Rulings_TeleDAD?.split("\n●") || []
        for (let i = 0; i < teledadRulings.length; i++) {
            const content = teledadRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (await Ruling.count({ where: { content: {[Op.iLike]: content}, cardId: card.id }})) {
                const ruling = await Ruling.findOne({ where: { content: {[Op.iLike]: content}, cardId: card.id }})
                if (ruling.effectiveDate && ruling.effectiveDate < '2008-09-01') await ruling.update({ effectiveDate: '2008-09-01' })
                if (!ruling.expirationDate || ruling.expirationDate > '2009-03-01') await ruling.update({ expirationDate: '2009-03-01' })
            } else {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: {[Op.iLike]: content},
                    effectiveDate: '2008-09-01',
                    expirationDate: '2009-03-01'
                })
            }
        }

        const gladRulings = ruling.Rulings_Gladiator?.split("\n●") || []
        for (let i = 0; i < gladRulings.length; i++) {
            const content = gladRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (await Ruling.count({ where: { content: {[Op.iLike]: content}, cardId: card.id }})) {
                const ruling = await Ruling.findOne({ where: { content: {[Op.iLike]: content}, cardId: card.id }})
                if (ruling.effectiveDate && ruling.effectiveDate < '2008-05-01') await ruling.update({ effectiveDate: '2008-05-01' })
                if (!ruling.expirationDate || ruling.expirationDate > '2008-09-01') await ruling.update({ expirationDate: '2008-09-01' })
            } else {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: {[Op.iLike]: content},
                    effectiveDate: '2008-05-01',
                    expirationDate: '2008-09-01'
                })
            }
        }

        const dadretRulings = ruling.Rulings_ReturnDAD?.split("\n●") || []
        for (let i = 0; i < dadretRulings.length; i++) {
            const content = dadretRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (await Ruling.count({ where: { content: {[Op.iLike]: content}, cardId: card.id }})) {
                const ruling = await Ruling.findOne({ where: { content: {[Op.iLike]: content}, cardId: card.id }})
                if (ruling.effectiveDate && ruling.effectiveDate < '2008-03-01') await ruling.update({ effectiveDate: '2008-03-01' })
                if (!ruling.expirationDate || ruling.expirationDate > '2008-05-01') await ruling.update({ expirationDate: '2008-05-01' })
            } else {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: {[Op.iLike]: content},
                    effectiveDate: '2008-03-01',
                    expirationDate: '2008-05-01'
                })
            }
        }

        const trooperRulings = ruling.Rulings_Trooper?.split("\n●") || []
        for (let i = 0; i < trooperRulings.length; i++) {
            const content = trooperRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (await Ruling.count({ where: { content: {[Op.iLike]: content}, cardId: card.id }})) {
                const ruling = await Ruling.findOne({ where: { content: {[Op.iLike]: content}, cardId: card.id }})
                if (ruling.effectiveDate && ruling.effectiveDate < '2007-03-01') await ruling.update({ effectiveDate: '2007-03-01' })
                if (!ruling.expirationDate || ruling.expirationDate > '2007-09-01') await ruling.update({ expirationDate: '2007-09-01' })
            } else {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: {[Op.iLike]: content},
                    effectiveDate: '2007-03-01',
                    expirationDate: '2007-09-01'
                })
            }
        }

        const pcRulings = ruling.Rulings_Circle?.split("\n●") || []
        for (let i = 0; i < pcRulings.length; i++) {
            const content = pcRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (await Ruling.count({ where: { content: {[Op.iLike]: content}, cardId: card.id }})) {
                const ruling = await Ruling.findOne({ where: { content: {[Op.iLike]: content}, cardId: card.id }})
                if (ruling.effectiveDate && ruling.effectiveDate < '2007-09-01') await ruling.update({ effectiveDate: '2007-09-01' })
                if (!ruling.expirationDate || ruling.expirationDate > '2008-03-01') await ruling.update({ expirationDate: '2008-03-01' })
            } else {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: {[Op.iLike]: content},
                    effectiveDate: '2007-09-01',
                    expirationDate: '2008-03-01'
                })
            }
        }

        const steinRulings = ruling.Rulings_Stein?.split("\n●") || []
        for (let i = 0; i < steinRulings.length; i++) {
            const content = steinRulings[i].replaceAll('●', '').trim()
            if (!content.length) continue
            if (await Ruling.count({ where: { content: {[Op.iLike]: content}, cardId: card.id }})) {
                const ruling = await Ruling.findOne({ where: { content: {[Op.iLike]: content}, cardId: card.id }})
                if (ruling.effectiveDate && ruling.effectiveDate < '2006-09-01') await ruling.update({ effectiveDate: '2006-09-01' })
                if (!ruling.expirationDate || ruling.expirationDate > '2007-03-01') await ruling.update({ expirationDate: '2007-03-01' })
            } else {
                await Ruling.create({
                    cardName: card.name,
                    cardId: card.id,
                    content: {[Op.iLike]: content},
                    effectiveDate: '2006-09-01',
                    expirationDate: '2007-03-01'
                })
            }
        }
    }
})()
