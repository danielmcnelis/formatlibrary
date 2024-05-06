import { S3 } from 'aws-sdk'
import { config } from '@fl/config'
import axios from 'axios'
import * as webp from 'webp-converter'
console.log('webp.str2webpstr', webp.str2webpstr)

;(async () => {
    try {    
        const s3 = new S3({
            region: config.s3.region,
            credentials: {
                accessKeyId: config.s3.credentials.accessKeyId,
                secretAccessKey: config.s3.credentials.secretAccessKey
            }
        })

        const {data: readStream} = await axios({
            method: 'GET',
            url: 'https://cdn.formatlibrary.com/images/alexandria.jpg',
            responseType: 'arraybuffer',
        })

        console.log('readStream', readStream)
        console.log('typeof readStream', typeof readStream)
        console.log('webp.str2webpstr', webp.str2webpstr)

        const buffer = Buffer.from(readStream)
        console.log(' buffer',  buffer)
        console.log('typeof buffer', typeof buffer)
        const result = webp.buffer2webpbuffer(buffer, "jpg","-q 80");
        result.then(async (result) => {
            // you access the value from the promise here
            console.log('result', result)
            const { Location: uri} = await s3.upload({ Bucket: 'formatlibrary', Key: 'images/alexandria.webp', Body: result }).promise()
            console.log('uri', uri)
            process.exit()
        });
    } catch (err) {
        console.error('Error: ', err)
    }
})()
