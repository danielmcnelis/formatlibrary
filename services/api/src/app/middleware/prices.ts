import { Card, Price, Print } from '@fl/models'
import { Op } from 'sequelize'

const convertTimestampToMonthDayYear = (timestamp) => {
    const date = new Date(timestamp);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
}

const smoothArray = (data, windowSize) => {
    const smoothedData = [];
    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - Math.floor(windowSize / 2)); j <= Math.min(data.length - 1, i + Math.floor(windowSize / 2)); j++) {
        sum += data[j];
        count++;
      }
      smoothedData.push(sum / count);
    }
    return smoothedData;
  }


// GET PRICES
export const getPrices = async (req, res, next) => {
    // const id = req.params.id.replaceAll('%2F', '/')
    //     .replaceAll('%3F', '?')
    //     .replaceAll('%23', '#')
    //     .replaceAll('%25', '%')
    //     .replaceAll('%26', '&')
    //     .replaceAll('-', ' ')
    //     .replaceAll('   ', ' - ')

    try {
        // const card = await Card.findOne({
        //     where: {
        //         [Op.or]: {
        //             name: {[Op.iLike]: id},
        //             cleanName: {[Op.iLike]: id}
        //         }
        //     },
        //     attributes: { exclude: ['konamiCode', 'isTcgLegal', 'isOcgLegal', 'createdAt', 'updatedAt'] }
        // })

        // console.log('req.params.id', req.params.id)
        // if (!req.params.id) return res.json({})
            console.log('req.params.id', req.params.id)
        const print = await Print.findOne({ where: { id: req.params.id }, attributes: ['id', 'rarity', 'cardCode', 'cardName', 'unlimitedPrice', 'firstEditionPrice', 'limitedPrice']})
        const daysAgo = new Date(Date.now() - (365 * 24 * 60 * 60 * 1000))
 
        // @ts-ignore
        const highestCurrentPrice = Math.max(...[print?.unlimitedPrice, print?.firstEditionPrice, print?.limitedPrice].filter((el) => el !== null))
        const editionToFind = print?.firstEditionPrice === highestCurrentPrice ? '1st Edition' :
            print?.limitedPrice === highestCurrentPrice ? 'Limited' :
            'Unlimited'

        const edition = editionToFind
        const rarity = print.rarity
        const mobileTitle = `${print.cardCode}`
        const desktopTitle = `${print.cardCode} - ${print.cardName}`

        const prices = print?.id ? [...await Price.findAll({
            where: {
                printId: print?.id,
                createdAt: {[Op.gte]: daysAgo},
                edition: editionToFind
            },
            attributes: ['usd', 'createdAt'],
            // include: Print,
            order: [['createdAt', 'ASC']]
        })].map((p) => [p.usd, p.createdAt]) : []

        const thirtyDayChange = prices[-1]?.[0] - prices[-30]?.[0]
        const ninetyDayChange = prices[-1]?.[0] - prices[-90]?.[0]
        const yearlyChange = prices[-1]?.[0] - prices[-365]?.[0]

        const data = {
            edition,
            rarity,
            desktopTitle,
            mobileTitle,
            print,
            thirtyDayChange,
            ninetyDayChange,
            yearlyChange,
            labelsArr: prices.map((p) => convertTimestampToMonthDayYear(p[1])),
            pricesArr: smoothArray(prices.map((p) => p[0]), 30)
        }

        return res.json(data)
    } catch (err) {
        next(err)
    }
}