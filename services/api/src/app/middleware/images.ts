
import axios from 'axios'
import { Upload } from '@aws-sdk/lib-storage';
import { S3 } from '@aws-sdk/client-s3';
import { config } from '@fl/config'
import * as sharp from 'sharp'

// DOWNLOAD CROPPED IMAGE AND UPLOAD TO ARTWORK FOLDER
export const uploadCroppedImage = async (s3, artworkId) => {
    try {
        const {data: croppedCardImage} = await axios({
            method: 'GET',
            url: `https://images.ygoprodeck.com/images/cards_cropped/${artworkId}.jpg`,
            responseType: 'stream'
        })
        
        const { Location: artworkUri} = await new Upload({
            client: s3,
            params: { Bucket: 'formatlibrary', Key: `images/artworks/${artworkId}.jpg`, Body: croppedCardImage, ContentType: `image/jpg` },
        }).done()
        console.log('artwork image uri', artworkUri)
        return true
    } catch (err) {
        console.log(err)
        return false
    }
}

// DOWNLOAD CARD IMAGE, RESIZE, AND UPLOAD TO MEDIUM CARDS FOLDER
export const uploadMediumCardImage = async (s3, artworkId) => {
   try {
        const {data: fullCardImage} = await axios({
            method: 'GET',
            url: `https://images.ygoprodeck.com/images/cards/${artworkId}.jpg`,
            responseType: 'stream'
        })

        const mediumCardImage = fullCardImage.pipe(sharp().resize(144, 210).jpeg())
        const { Location: imageUri} = await new Upload({
            client: s3,
            params: { Bucket: 'formatlibrary', Key: `images/medium_cards/${artworkId}.jpg`, Body: mediumCardImage, ContentType: `image/jpg` },
        }).done()
        console.log('medium card image uri', imageUri)
        return true
    } catch (err) {
        console.log(err)
        return false
    }
}

// DOWNLOAD CARD IMAGE AND UPLOAD TO CARDS FOLDER
export const uploadFullCardImage = async (s3, artworkId) => {
    const {data: fullCardImage} = await axios({
        method: 'GET',
        url: `https://images.ygoprodeck.com/images/cards/${artworkId}.jpg`,
        responseType: 'stream'
    })

    try {
        const { Location: imageUri} = await new Upload({
            client: s3,
            params: { Bucket: 'formatlibrary', Key: `images/cards/${artworkId}.jpg`, Body: fullCardImage, ContentType: `image/jpg` },
        }).done()
        console.log('card image uri', imageUri)
        return true
    } catch (err) {
        console.log(err)
        return false
    }
}

// UPLOAD CARD IMAGES
export const uploadCardImages = async (s3, artworkId) => {
    const fullSuccess = await uploadFullCardImage(s3, artworkId)
    const mediumSuccess = await uploadMediumCardImage(s3, artworkId)
    const croppedSuccess = await uploadCroppedImage(s3, artworkId)
    return [fullSuccess, mediumSuccess, croppedSuccess]
}

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

        const [fullSuccess, mediumSuccess, croppedSuccess] = await uploadCardImages(s3, req.query.artworkId)

        if (fullSuccess && mediumSuccess && croppedSuccess) {
            return res.json({success: true})
        } else {
            return res.json({success: false})
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
    return res.json({ success: true })
  } catch (err) {
    next(err)
  }
}
