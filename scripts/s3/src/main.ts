import { S3 } from 'aws-sdk'
import { config } from '@fl/config'
import axios from 'axios'
import { v2 as cloudinary } from 'cloudinary'
import { Op } from 'sequelize'
import {Artwork, Card} from '@fl/models'

// ;(async () => {
//     try {    
//         const s3 = new S3({
//             region: config.s3.region,
//             credentials: {
//                 accessKeyId: config.s3.credentials.accessKeyId,
//                 secretAccessKey: config.s3.credentials.secretAccessKey
//             }
//         })

//         const {data: readStream} = await axios({
//             method: 'GET',
//             url: 'https://cdn.formatlibrary.com/images/cards/52687916.jpg',
//             responseType: 'arraybuffer',
//         })

//         const buffer = Buffer.from(readStream)
//         const result = webp.buffer2webpbuffer(buffer, "jpg","-q 80");
//         result.then(async (result) => {
//             // you access the value from the promise here
//             console.log('result', result)
//             const { Location: uri} = await s3.upload({ Bucket: 'formatlibrary', Key: 'images/52687916.webp', Body: result }).promise()
//             console.log('uri', uri)
//             process.exit()
//         });
//     } catch (err) {
//         console.error('Error: ', err)
//     }
// })()

(async function() {
    // Configuration
    cloudinary.config({ 
        cloud_name: config.cloudinary.cloudName, 
        api_key: config.cloudinary.apiKey, 
        api_secret: config.cloudinary.apiSecret
    });

    const cards = await Card.findAll({
        where: {
            ypdId: {[Op.not]: null},
        },
        order: [["id", "DESC"]]
    })

    for (let i = 0; i < 1000; i++) {
        const card = cards[i]
        // const artworks = await Artwork.findAll({
        //     where: {
        //         cardId: card.id,
        //         ypdId: {[Op.not]: card.ypdId}
        //     }
        // })

        // for (let j = 0; j < artworks.length; j++) {
            // Upload an image
            // const artwork = artworks[j]
            const uploadResult = await cloudinary.uploader
            .upload(
                `https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`, {
                    width: 72,
                    folder: 'small_cards',
                    format: 'webp',
                    public_id: card.ypdId,
                }
            )
            .catch((error) => {
                console.log(error);
            });
        
            console.log(uploadResult);
        // }
    }
    
})();