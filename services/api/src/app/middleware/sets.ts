import { Card, Print, Set } from '@fl/models'
import e = require('express')

//GET RANDOM SUBSET
const getRandomSubset = (arr, n) => {
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

//GET RANDOM ELEMENT
const getRandomElement = (arr) => {
    const index = Math.floor((arr.length) * Math.random())
    return arr[index]
}


export const setsBoosters = async (req, res, next) => {
  try {
    const sets = await Set.findAll({
      where: {
        booster: true
      },
      attributes: ['id', 'setName', 'setCode', 'tcgDate'],
      order: [['tcgDate', 'ASC']]
    })

    res.json(sets)
  } catch (err) {
    next(err)
  }
}

// GENERATE PACK
export const generatePack = async (req, res, next) => {
    try {
        const setCode = req.query.set_code
        const set = await Set.findOne({ where: { setCode: setCode }})
        const prints = await Print.findAll({ where: { setId: set.id }, include: Card })
        const commons = prints.filter((p) => p.rarity === 'Common' || p.rarity === 'Short Print')
        const rares = prints.filter((p) => p.rarity === 'Rare')
        const supers = prints.filter((p) => p.rarity === 'Super Rare')
        const ultras = prints.filter((p) => p.rarity === 'Ultra Rare')
        const secrets = prints.filter((p) => p.rarity === 'Secret Rare')
        const coreV1 = ['LOB', 'MRD', 'MRL', 'PSV', 'LON', 'LOD', 'PGD', 'MFC', 'DCR', 'IOC', 'AST']
        const coreV2 = ['SOD', 'RDS', 'FET', 'TLM', 'CRV', 'EEN', 'SOI', 'EOJ', 'POTD', 'CDIP']
        const coreV3 = ['STON', 'FOTB']
        const coreV4 = ['TAEV', 'GLAS', 'PTDN', 'LODT', 'TGDS', 'CSOC', 'CRMS', 'RGBT', 'ANPR', 'SOVR', 'ABPF']
        const coreV5 = ['TSHD', 'DREV', 'STBL', 'STOR', 'EXVR', 'GENF', 'PHSW', 'ORCS', 'GAOV', 'REDU', 'ABYR', 'CBLZ', 'LTGY', 'JOTL', 'SHSP', 'LVAL', 'PRIO', 'DUEA', 'NECH', 'SECE', 'CROS', 'CORE', 'DOCS']
        const coreV6 = ['BOSH', 'SHVI', 'TDIL', 'INOV', 'RATE', 'MACR', 'COTD', 'CIBR', 'EXFO', 'FLOD', 'CYHO', 'SOFU', 'SAST', 'DANE', 'RIRA', 'CHIM', 'IGAS', 'ETCO', 'ROTD', 'PHRA', 'BLVO', 'LIOV', 'DAMA', 'BODE', 'BACH', 'DIFO', 'POTE', 'DABL', 'PHHY', 'CYAC', 'DUNE', 'AGOV', 'PHNI']
        const reprintV1 = ['DB1', 'DB2', 'DR1', 'DR2', 'DR3']
        let pack

        if (coreV1.includes(set.setCode)) {
            const odds = []
            for (let i = 0; i < 1; i++) odds.push(secrets)
            for (let i = 0; i < 3; i++) odds.push(ultras)
            for (let i = 0; i < 6; i++) odds.push(supers)
            for (let i = 0; i < 26; i++) odds.push(rares)

            pack = [...getRandomSubset(commons, 8), getRandomElement(getRandomElement(odds))].sort((a, b) => b.setCode - a.setCode)
        } else if (coreV2.includes(set.setCode)) {
            const odds = []
            for (let i = 0; i < 1; i++) odds.push(ultras)
            for (let i = 0; i < 4; i++) odds.push(supers)
            for (let i = 0; i < 19; i++) odds.push(rares)

            pack = [...getRandomSubset(commons, 8), getRandomElement(getRandomElement(odds))].sort((a, b) => b.setCode - a.setCode)
        } else if (coreV3.includes(set.setCode)) {
            const odds = []
            for (let i = 0; i < 24; i++) odds.push(secrets)
            for (let i = 0; i < 31; i++) odds.push(ultras)
            for (let i = 0; i < 186; i++) odds.push(supers)
            for (let i = 0; i < 503; i++) odds.push(rares)
        
            pack = [...getRandomSubset(commons, 8), getRandomElement(getRandomElement(odds))].sort((a, b) => b.setCode - a.setCode)
        } else if (coreV4.includes(set.setCode)) {
            const odds = []
            for (let i = 0; i < 60; i++) odds.push(secrets)
            for (let i = 0; i < 155; i++) odds.push(ultras)
            for (let i = 0; i < 372; i++) odds.push(supers)
            for (let i = 0; i < 1273; i++) odds.push(rares)

            pack = [...getRandomSubset(commons, 8), getRandomElement(getRandomElement(odds))].sort((a, b) => b.setCode - a.setCode)
        } else if (coreV5.includes(set.setCode)) {
            const odds = []
            for (let i = 0; i < 60; i++) odds.push(secrets)
            for (let i = 0; i < 115; i++) odds.push(ultras)
            for (let i = 0; i < 276; i++) odds.push(supers)
            for (let i = 0; i < 929; i++) odds.push(rares)

            pack = [...getRandomSubset(commons, 8), getRandomElement(getRandomElement(odds))].sort((a, b) => b.setCode - a.setCode)
        } else if (coreV6.includes(set.setCode)) {
            const odds = []
            for (let i = 0; i < 1; i++) odds.push(secrets)
            for (let i = 0; i < 2; i++) odds.push(ultras)
            for (let i = 0; i < 9; i++) odds.push(supers)

            pack = [...getRandomSubset(commons, 7), getRandomElement(rares), getRandomElement(getRandomElement(odds))].sort((a, b) => b.setCode - a.setCode)
        } else if (reprintV1.includes(set.setCode)) {
            const monsterCommons = commons.filter((p) => p.card?.category === 'Monster')
            const spellCommons = commons.filter((p) => p.card?.category === 'Spell')
            const trapCommons = commons.filter((p) => p.card?.category === 'Trap')
            const monsterRares = rares.filter((p) => p.card?.category === 'Monster')
            const spellRares = rares.filter((p) => p.card?.category === 'Spell')
            const trapRares = rares.filter((p) => p.card?.category === 'Trap')

            const odds = []
            for (let i = 0; i < 1; i++) odds.push(ultras)
            for (let i = 0; i < 2; i++) odds.push(supers)
            for (let i = 0; i < 9; i++) odds.push(rares)
            const foil = getRandomElement(getRandomElement(odds))

            if (foil.rarity === 'Super Rare') {
                let additionalRare 
                if (foil.card.category === 'Monster') {
                    additionalRare = getRandomElement([...spellRares, ...trapRares])
                } else if (foil.card.category === 'Spell') {
                    additionalRare = getRandomElement([...monsterRares, ...trapRares])
                } else {
                    additionalRare = getRandomElement([...monsterRares, ...spellRares])
                }

                if (foil.card.category !== 'Monster' && additionalRare.card.category !== 'Monster') {
                    pack = [...getRandomSubset(monsterCommons, 6), ...getRandomSubset(spellCommons, 2), ...getRandomSubset(trapCommons, 2), additionalRare, foil]
                } else if (foil.card.category !== 'Spell' && additionalRare.card.category !== 'Spell') {
                    pack = [...getRandomSubset(monsterCommons, 5), ...getRandomSubset(spellCommons, 3), ...getRandomSubset(trapCommons, 2), additionalRare, foil]
                } else {
                    pack = [...getRandomSubset(monsterCommons, 5), ...getRandomSubset(spellCommons, 2), ...getRandomSubset(trapCommons, 3), additionalRare, foil]
                }
            } else {
                if (foil.card.category === 'Monster') {
                    pack = [...getRandomSubset(monsterCommons, 5), ...getRandomSubset(spellCommons, 3), ...getRandomSubset(trapCommons, 3), foil]
                } else if (foil.card.category === 'Spell') {
                    pack = [...getRandomSubset(monsterCommons, 6), ...getRandomSubset(spellCommons, 2), ...getRandomSubset(trapCommons, 3), foil]
                } else {
                    pack = [...getRandomSubset(monsterCommons, 6), ...getRandomSubset(spellCommons, 3), ...getRandomSubset(trapCommons, 2), foil]
                }
            }
        }

        res.json(pack)
    } catch (err) {
        next(err)
    }
}

// GENERATE BOX
export const generateBox = async (req, res, next) => {
    try {
        const setCode = req.query.set_code
        const set = await Set.findOne({ where: { setCode: setCode }})
        const prints = await Print.findAll({ where: { setId: set.id }, include: Card })
        const commons = prints.filter((p) => p.rarity === 'Common' || p.rarity === 'Short Print')
        const rares = prints.filter((p) => p.rarity === 'Rare')
        const supers = prints.filter((p) => p.rarity === 'Super Rare')
        const ultras = prints.filter((p) => p.rarity === 'Ultra Rare')
        const secrets = prints.filter((p) => p.rarity === 'Secret Rare')
        const coreV1 = ['LOB', 'MRD', 'MRL', 'PSV', 'LON', 'LOD', 'PGD', 'MFC', 'DCR', 'IOC', 'AST']
        const coreV2 = ['SOD', 'RDS', 'FET', 'TLM', 'CRV', 'EEN', 'SOI', 'EOJ', 'POTD', 'CDIP']
        const coreV3 = ['STON', 'FOTB']
        const coreV4 = ['TAEV', 'GLAS', 'PTDN', 'LODT', 'TGDS', 'CSOC', 'CRMS', 'RGBT', 'ANPR', 'SOVR', 'ABPF']
        const coreV5 = ['TSHD', 'DREV', 'STBL', 'STOR', 'EXVR', 'GENF', 'PHSW', 'ORCS', 'GAOV', 'REDU', 'ABYR', 'CBLZ', 'LTGY', 'JOTL', 'SHSP', 'LVAL', 'PRIO', 'DUEA', 'NECH', 'SECE', 'CROS', 'CORE', 'DOCS']
        const coreV6 = ['BOSH', 'SHVI', 'TDIL', 'INOV', 'RATE', 'MACR', 'COTD', 'CIBR', 'EXFO', 'FLOD', 'CYHO', 'SOFU', 'SAST', 'DANE', 'RIRA', 'CHIM', 'IGAS', 'ETCO', 'ROTD', 'PHRA', 'BLVO', 'LIOV', 'DAMA', 'BODE', 'BACH', 'DIFO', 'POTE', 'DABL', 'PHHY', 'CYAC', 'DUNE', 'AGOV', 'PHNI']
        const reprintV1 = ['DB1', 'DB2', 'DR1', 'DR2', 'DR3']
        const box = []

        if (coreV1.includes(set.setCode)) {
            for (let i = 0; i < 26; i++) box.push([...getRandomSubset(commons, 8), getRandomElement(rares)].sort((a, b) => b.setCode - a.setCode))
            for (let i = 0; i < 6; i++) box.push([...getRandomSubset(commons, 8), getRandomElement(supers)].sort((a, b) => b.setCode - a.setCode))
            for (let i = 0; i < 3; i++) box.push([...getRandomSubset(commons, 8), getRandomElement(ultras)].sort((a, b) => b.setCode - a.setCode))
            for (let i = 0; i < 1; i++) box.push([...getRandomSubset(commons, 8), getRandomElement(secrets)].sort((a, b) => b.setCode - a.setCode))
        } else if (coreV2.includes(set.setCode)) {
            for (let i = 0; i < 19; i++) box.push([...getRandomSubset(commons, 8), getRandomElement(rares)].sort((a, b) => b.setCode - a.setCode))
            for (let i = 0; i < 4; i++) box.push([...getRandomSubset(commons, 8), getRandomElement(supers)].sort((a, b) => b.setCode - a.setCode))
            for (let i = 0; i < 1; i++) box.push([...getRandomSubset(commons, 8), getRandomElement(ultras)].sort((a, b) => b.setCode - a.setCode))
        } else if (coreV3.includes(set.setCode)) {
            for (let i = 0; i < 19; i++) box.push([...getRandomSubset(commons, 8), getRandomElement(rares)].sort((a, b) => b.setCode - a.setCode))
            for (let i = 0; i < 4; i++) box.push([...getRandomSubset(commons, 8), getRandomElement(supers)].sort((a, b) => b.setCode - a.setCode))
            for (let i = 0; i < 1; i++) box.push([...getRandomSubset(commons, 8), getRandomElement(ultras)].sort((a, b) => b.setCode - a.setCode))
        } else if (coreV4.includes(set.setCode)) {
            const odds = []
            for (let i = 0; i < 60; i++) odds.push(secrets)
            for (let i = 0; i < 155; i++) odds.push(ultras)
            for (let i = 0; i < 372; i++) odds.push(supers)
            for (let i = 0; i < 1273; i++) odds.push(rares)
            for (let i = 0; i < 24; i++) box.push([...getRandomSubset(commons, 8), getRandomElement(getRandomElement(odds))].sort((a, b) => b.setCode - a.setCode))
        } else if (coreV5.includes(set.setCode)) {
            const odds = []
            for (let i = 0; i < 60; i++) odds.push(secrets)
            for (let i = 0; i < 115; i++) odds.push(ultras)
            for (let i = 0; i < 276; i++) odds.push(supers)
            for (let i = 0; i < 929; i++) odds.push(rares)
            for (let i = 0; i < 24; i++) box.push([...getRandomSubset(commons, 8), getRandomElement(getRandomElement(odds))].sort((a, b) => b.setCode - a.setCode))
        } else if (coreV6.includes(set.setCode)) {
            const odds = []
            for (let i = 0; i < 1; i++) odds.push(secrets)
            for (let i = 0; i < 2; i++) odds.push(ultras)
            for (let i = 0; i < 9; i++) odds.push(supers)
            for (let i = 0; i < 24; i++) box.push([...getRandomSubset(commons, 7), getRandomElement(rares), getRandomElement(getRandomElement(odds))].sort((a, b) => b.setCode - a.setCode))
        } else if (reprintV1.includes(set.setCode)) {
            const monsterCommons = commons.filter((p) => p.card?.category === 'Monster')
            const spellCommons = commons.filter((p) => p.card?.category === 'Spell')
            const trapCommons = commons.filter((p) => p.card?.category === 'Trap')
            const monsterRares = rares.filter((p) => p.card?.category === 'Monster')
            const spellRares = rares.filter((p) => p.card?.category === 'Spell')
            const trapRares = rares.filter((p) => p.card?.category === 'Trap')

            for (let i = 0; i < 2; i++) {
                const foil = getRandomElement(ultras)
                if (foil.card.category === 'Monster') {
                    box.push([...getRandomSubset(monsterCommons, 5), ...getRandomSubset(spellCommons, 3), ...getRandomSubset(trapCommons, 3), foil])
                } else if (foil.card.category === 'Spell') {
                    box.push([...getRandomSubset(monsterCommons, 6), ...getRandomSubset(spellCommons, 2), ...getRandomSubset(trapCommons, 3), foil])
                } else {
                    box.push([...getRandomSubset(monsterCommons, 6), ...getRandomSubset(spellCommons, 3), ...getRandomSubset(trapCommons, 2), foil])
                }
            }
            
            for (let i = 0; i < 4; i++) {
                const foil = getRandomElement(supers)
                let additionalRare 
                if (foil.card.category === 'Monster') {
                    additionalRare = getRandomElement([...spellRares, ...trapRares])
                } else if (foil.card.category === 'Spell') {
                    additionalRare = getRandomElement([...monsterRares, ...trapRares])
                } else {
                    additionalRare = getRandomElement([...monsterRares, ...spellRares])
                }

                if (foil.card.category !== 'Monster' && additionalRare.card.category !== 'Monster') {
                    box.push([...getRandomSubset(monsterCommons, 6), ...getRandomSubset(spellCommons, 2), ...getRandomSubset(trapCommons, 2), additionalRare, foil])
                } else if (foil.card.category !== 'Spell' && additionalRare.card.category !== 'Spell') {
                    box.push([...getRandomSubset(monsterCommons, 5), ...getRandomSubset(spellCommons, 3), ...getRandomSubset(trapCommons, 2), additionalRare, foil])
                } else {
                    box.push([...getRandomSubset(monsterCommons, 5), ...getRandomSubset(spellCommons, 2), ...getRandomSubset(trapCommons, 3), additionalRare, foil])
                }
            }

            for (let i = 0; i < 18; i++) {
                const rare = getRandomElement(rares)
                if (rare.card.category === 'Monster') {
                    box.push([...getRandomSubset(monsterCommons, 5), ...getRandomSubset(spellCommons, 3), ...getRandomSubset(trapCommons, 3), rare])
                } else if (rare.card.category === 'Spell') {
                    box.push([...getRandomSubset(monsterCommons, 6), ...getRandomSubset(spellCommons, 2), ...getRandomSubset(trapCommons, 3), rare])
                } else {
                    box.push([...getRandomSubset(monsterCommons, 6), ...getRandomSubset(spellCommons, 3), ...getRandomSubset(trapCommons, 2), rare])
                }
            }
        }

        res.json(box)
    } catch (err) {
        next(err)
    }
}