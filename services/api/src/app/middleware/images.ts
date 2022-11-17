
import axios from 'axios'
import { S3 } from 'aws-sdk'
import { config } from '@fl/config'

// IMAGES UPDATE CARD
export const imagesUpdateCard = async (req, res, next) => {
    try {
        const {data} = await axios({
            method: 'GET',
            url: `https://storage.googleapis.com/ygoprodeck.com/pics/${req.query.ypdId}.jpg`,
            responseType: 'stream'
        })

        const s3 = new S3({
            region: config.s3.region,
            credentials: {
                accessKeyId: config.s3.credentials.accessKeyId,
                secretAccessKey: config.s3.credentials.secretAccessKey
            }
        })
    
        const { Location: uri} = await s3.upload({ Bucket: 'formatlibrary', Key: `images/cards/${req.query.ypdId}`, Body: data, ACL: 'public-read' }).promise()
        console.log('uri', uri)
        res.json({success: true})
    } catch (err) {
        next(err)
    }
}

// IMAGES CREATE
export const imagesCreate = async (req, res, next) => {
  try {
    const buffer = req.body.image
    //   .replace(/^data:image\/jpg;base64,/, '')
    //   .replace(/^data:image\/jpeg;base64,/, '')
    //   .replace(/^data:image\/png;base64,/, '')

    const s3 = new S3({
        region: config.s3.region,
        credentials: {
            accessKeyId: config.s3.credentials.accessKeyId,
            secretAccessKey: config.s3.credentials.secretAccessKey
        }
    })

    const { Location: uri} = await s3.upload({ 
        Bucket: 'formatlibrary', 
        Key: `images/${req.body.folder}/${req.body.fileName}`, 
        Body: buffer,
        ContentEncoding: 'base64', 
        ACL: 'public-read' 
    }).promise()

    console.log('uri', uri)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}
