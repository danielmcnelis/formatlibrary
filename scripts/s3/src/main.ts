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

    // for (let i = 0; i < cards.length; i++) {
    //     const card = cards[i]

    //     const count = await Artwork.count({
    //         where: {
    //             cardId: card.id
    //         }
    //     })

    //     if (count < 2) {
    //         continue 
    //     } else {
    //         const artwork = await Artwork.findOne({
    //             where: {
    //                 cardId: card.id,
    //                 isOriginal: true
    //             }
    //         })
    
                const uploadResult = await cloudinary.uploader
                .upload(
                    `https://i.imgur.com/MsGeIhU.jpeg`,{
                    // `https://cdn.formatlibrary.com/images/cards/${57728570}.jpg`, {
                        width: 72,
                        folder: 'small_cards_missing',
                        format: 'webp',
                        public_id: '57728570',
                    }
                )
                .catch((error) => {
                    console.log(error);
                });
            
                console.log(uploadResult);
            // }
    //     }

    // }
    
})();