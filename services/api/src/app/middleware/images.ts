
import axios from 'axios'
import { Upload } from '@aws-sdk/lib-storage';
import { S3 } from '@aws-sdk/client-s3';
import { config } from '@fl/config'
import {uploadCardImages} from '@fl/bot-functions'

// IMAGES UPDATE CARD
export const updateCardImage = async (req, res, next) => {
    try {
        const s3 = new S3({
            region: config.s3.region,
            credentials: {
                accessKeyId: config.s3.credentials.accessKeyId,
                secretAccessKey: config.s3.credentials.secretAccessKey
            }
        })

        const [fullSuccess, mediumSuccess, croppedSuccess] = uploadCardImages(s3, req.query.artworkId)

        if (fullSuccess && mediumSuccess && croppedSuccess) {
            res.json({success: true})
        } else {
            res.json({success: false})
        }
    } catch (err) {
        next(err)
    }
}

// IMAGES CREATE
export const createImage = async (req, res, next) => {
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
