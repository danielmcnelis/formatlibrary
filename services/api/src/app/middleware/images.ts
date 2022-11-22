
import axios from 'axios'
import { S3 } from 'aws-sdk'
import { config } from '@fl/config'

// IMAGES UPDATE CARD
export const imagesUpdateCard = async (req, res, next) => {
    try {
        const {data} = await axios({
            method: 'GET',
            url: `https://images.ygoprodeck.com/images/cards/${req.query.ypdId}.jpg`,
            responseType: 'stream'
        })

        const s3 = new S3({
            region: config.s3.region,
            credentials: {
                accessKeyId: config.s3.credentials.accessKeyId,
                secretAccessKey: config.s3.credentials.secretAccessKey
            }
        })
    
        const { Location: uri} = await s3.upload({ 
            Bucket: 'formatlibrary', 
            Key: `images/cards/${req.query.ypdId}`, 
            Body: data, 
            ContentType: `image/jpg`,
            ACL: 'public-read' 
        }).promise()
        console.log('uri', uri)
        res.json({success: true})
    } catch (err) {
        next(err)
    }
}

// IMAGES CREATE
export const imagesCreate = async (req, res, next) => {
  try {
    const image = req.body.image
    const buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    const type = image.split(';')[0].split('/')[1]

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
        ContentType: `image/${type}`,
        ACL: 'public-read' 
    }).promise()

    console.log('uri', uri)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}
