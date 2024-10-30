
import axios from 'axios'
import { Upload } from '@aws-sdk/lib-storage';
import { S3 } from '@aws-sdk/client-s3';
import { config } from '@fl/config'

// IMAGES UPDATE CARD
export const imagesUpdateCard = async (req, res, next) => {
    try {
        const {data: fullCardImage} = await axios({
            method: 'GET',
            url: `https://images.ygoprodeck.com/images/cards/${req.query.artworkId}.jpg`,
            responseType: 'stream'
        })

        const s3 = new S3({
            region: config.s3.region,
            credentials: {
                accessKeyId: config.s3.credentials.accessKeyId,
                secretAccessKey: config.s3.credentials.secretAccessKey
            }
        })
    
        const { Location: fullCardImageUri} = await new Upload({
            client: s3,

            params: { 
                Bucket: 'formatlibrary', 
                Key: `images/cards/${req.query.artworkId}.jpg`, 
                Body: fullCardImage, 
                ContentType: `image/jpg`
            }
        }).done()

        console.log('fullCardImageUri', fullCardImageUri)

        const {data: croppedCardImage} = await axios({
            method: 'GET',
            url: `https://images.ygoprodeck.com/images/cards_cropped/${req.query.artworkId}.jpg`,
            responseType: 'stream'
        })

        const { Location: croppedCardImageUri} = await new Upload({
            client: s3,

            params: { 
                Bucket: 'formatlibrary', 
                Key: `images/cards/${req.query.artworkId}.jpg`, 
                Body: croppedCardImage, 
                ContentType: `image/jpg`
            }
        }).done()

        console.log('croppedCardImageUri', croppedCardImageUri)
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
    const [, mimeType] = image.split(';')[0].split(':')

    const s3 = new S3({
        region: config.s3.region,
        credentials: {
            accessKeyId: config.s3.credentials.accessKeyId,
            secretAccessKey: config.s3.credentials.secretAccessKey
        }
    })

    const { Location: uri} = await new Upload({
        client: s3,

        params: { 
            Bucket: 'formatlibrary', 
            Key: `images/${req.body.folder}/${req.body.fileName}`, 
            Body: buffer,
            ContentType: mimeType
        }
    }).done()

    console.log('uri', uri)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}
