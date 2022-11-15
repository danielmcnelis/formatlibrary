import { S3 } from 'aws-sdk'
import { createReadStream } from 'fs'
import { config } from '@fl/config'
import axios from 'axios'


;(async () => {
  try {    
    const s3 = new S3({
        region: config.s3.region,
        credentials: {
            accessKeyId: config.s3.credentials.accessKeyId,
            secretAccessKey: config.s3.credentials.secretAccessKey
        }
    })
  
//   const readStream = createReadStream('./penguin.jpg')

// const {data} = await axios({
//     method: 'GET',
//     url: `https://storage.googleapis.com/ygoprodeck.com/pics/${id}.jpg`,
//     responseType: 'stream'
// })

// (fs.createWriteStream(`../cards/${id}.jpg`))

const {data: readStream} = await axios({
    method: 'GET',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/World_Globe_Map.jpg/800px-World_Globe_Map.jpg',
    responseType: 'stream',
  })

//   const readStream = createReadStream(data)
  
  const { Location: uri} = await s3
    .upload({ Bucket: 'formatlibrary', Key: 'images/globe.jpg', Body: readStream })
    .promise()

    console.log('uri', uri)
    process.exit()
  } catch (e) {
    console.error('Error: ', e)
  }
})()
