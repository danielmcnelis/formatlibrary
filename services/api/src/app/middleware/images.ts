
import axios from 'axios'
import * as fs from 'fs'
import { S3 } from 'aws-sdk'
// import { config } from '@fl/config'

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

    // const s3 = new S3({
    //     region: 'us-east-2',
    //     credentials: {
    //         accessKeyId: config.s3AccessKeyId,
    //         secretAccessKey: config.s3SecretAccessKey
    //     }
    // })
    
    // const [file] = ctx.request.files
    // const { path, name } = file
    
    // const readStream = fs.createReadStream(path)
    
    // const { Location: uri} = await s3
    //     .upload({ Bucket: 'formatlibrary', Key: `images/${name}`, Body: readStream })
    //     .promise()
    
    // try {
    //     fs.unlinkSync(path)
    // } catch(err) {
    //     console.error(err)
    // }
    
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
