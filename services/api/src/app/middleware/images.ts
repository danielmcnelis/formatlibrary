
import axios from 'axios'
import * as fs from 'fs'

export const imagesUpdateCard = async (req, res, next) => {
    try {
        const {data} = await axios({
            method: 'GET',
            url: `https://storage.googleapis.com/ygoprodeck.com/pics/${req.query.ypdId}.jpg`,
            responseType: 'stream'
        })

        data.pipe(fs.createWriteStream(`./public/images/cards/${req.query.ypdId}.jpg`))
        res.json({success: true})
    } catch (err) {
        next(err)
    }
}

export const imagesCreate = async (req, res, next) => {
  try {
    const buffer = req.body.image
      .replace(/^data:image\/jpg;base64,/, '')
      .replace(/^data:image\/jpeg;base64,/, '')
      .replace(/^data:image\/png;base64,/, '')
    fs.writeFileSync(`https://cdn.formatlibrary.com/images/${req.body.folder}/${req.body.fileName}`, buffer, 'base64')
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}
