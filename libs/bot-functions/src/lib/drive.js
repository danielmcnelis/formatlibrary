

import { google as Google } from 'googleapis'
import { config } from '@fl/config'       
import axios from 'axios'

export const generateNewToken = async (server) => {
  console.log('generateNewToken()', generateNewToken)
  const { refresh_token } = JSON.parse(server.googleToken)
  try {
    console.log('refresh_token', refresh_token)
    console.log('installed.client_secret', config.google.client_secret)
    console.log('installed.client_id', config.google.client_id)

    const { data } = await axios.post('https://www.googleapis.com/oauth2/v4/token', {
      "installed.client_id": config.google.client_id,
      "installed.client_secret": config.google.client_secret,
      "refresh_token": refresh_token,
      "grant_type": "refresh_token"
    })

    console.log('data', data)
    return data.access_token
  } catch (err) {
    console.log(err)
    return false
  }
}

export const checkExpiryDate = async (server) => {
    console.log('checkExpiryDate()', checkExpiryDate)
  const { access_token, expiry_date } = JSON.parse(server.googleToken)
  const currentTime = Date.now()
  if (currentTime > expiry_date) {
    console.log('generating new token')
    const newAccessToken = await generateNewToken(server)
    return newAccessToken
  } else {
    console.log('access token not expired')
    return access_token
  }
}

export const uploadDeckFolder = async (server, tournamentName, decks) => {
    console.log('uploadDeckFolder()', uploadDeckFolder)
  try {
    const { access_token, refresh_token } = JSON.parse(server.googleToken)
    console.log('access_token', access_token)
    console.log('refresh_token', refresh_token)

    const oAuth2Client = new Google.auth.OAuth2(
        config.google.client_id, 
        config.google.client_secret, 
        config.google.redirect_uris[0], 
      access_token, 
      refresh_token
    )

    console.log('oAuth2Client', oAuth2Client)
    oAuth2Client.setCredentials(JSON.parse(server.googleToken))
    const drive = Google.drive({ version: 'v3', auth: oAuth2Client})
  
    const fileMetadata = {
      'name': `${tournamentName} Decks`,
      'mimeType': 'application/vnd.google-apps.folder'
    }

    try {
      drive.files.create({
        resource: fileMetadata,
        fields: 'id'
      }, function (err, file) {
        if (err) {
          console.error('line 73 error:\n', err)
        } else {
          const folderId = file.data.id
          console.log(`Created folder with id: ${folderId}.`)
          for (let i = 0; i < decks.length; i++) {
              const deck = decks[i]
  
              const fileMetadata = {
                'name': `${deck.player.globalName || deck.player.discordName}#${deck.player.discriminator}.ydk`,
                parents: [folderId]
              }
  
              const media = {
                mimeType: 'application/json',
                body: deck.ydk
              }
  
              saveFile(drive, fileMetadata, media, i) 
          }
        }
      })
    } catch (err) {
      console.log(err)
    }
  } catch (err) {
    console.log(err)
  }
}

export const saveFile = async (drive, fileMetadata, media, i) => {
	return setTimeout(async function() {
      await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
      }, function (err) {
        if (err) {
          console.log(err)
        } else {
          console.log(`Saved a new file: ${fileMetadata.name}.`)
        }
      })  
  }, (i+1)*1000)
}