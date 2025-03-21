
// import { google } from 'googleapis'
// // import token from '../token'
// // import { installed } from '../credentials.json'

// export const connectToSheets = async () => {
//   const oAuth2Client = 
//   new google.auth.OAuth2(
//     installed.client_id, 
//     installed.client_secret, 
//     installed.redirect_uris[0], 
//     token.access_token, 
//     token.refresh_token
//   )

//   oAuth2Client.setCredentials(token)
//   const sheets = google.sheets({ version: 'v4', auth: oAuth2Client})
//   return {
//     oAuth2Client,
//     sheets
//   }
// }

// export const makeSheet = async (sheets, title = 'Deck Lists', values = []) => {
//   try {
//     const spreadsheet = await createNewSheet(sheets, title)
//     const result = await writeToSheet(sheets, spreadsheet.spreadsheetId, 'Sheet1', 'RAW', values)
//     console.log('%d cells updated.', result.updatedCells)
//     return spreadsheet.spreadsheetId
//   }
//   catch (error) {
//     console.log(error)
//   }
// }

// export const createNewSheet = async (sheets, title) => {
//   const resource = {
//     properties: {
//       title
//     },
//   }
//   return sheets.spreadsheets.create({ resource, fields: 'spreadsheetId' })
//     .then(response => response.data)
// }

// export const writeToSheet = async (sheets, spreadsheetId, range, valueInputOption, values) => {
//   const resource = {
//     values
//   }
//   return sheets.spreadsheets.values.update({ spreadsheetId, range, valueInputOption, resource })
//     .then(response => response.data)
// }

// export const addSheet = async (sheets, oAuth2Client, spreadsheetId, title) => {
//   return sheets.spreadsheets.batchUpdate({
//     auth: oAuth2Client,
//     spreadsheetId: spreadsheetId,
//     resource: {
//       requests: [
//         {
//             'addSheet':{
//                 'properties':{
//                     title
//                 }
//             } 
//         }
//       ],
//     }
// })
//     .then(response => response.data)
// }