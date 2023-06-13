import { Router } from 'express'
import {
  authenticate,
  decksDeleteId,
  decksUpdateId,
  decksPublishId,
  decksUnpublishId,
  decksShareId,
  decksBuilderId,
  decksMyDecks,
  decksReadYdk,
  decksPopular,
  decksGallery,
  decksFrequent,
  decksPlayer,
  decksLike,
  decksDownload,
  getDecks,
  countDecks,
  decksId,
  decksCreate,
  convertTextToYDK
} from '../middleware'

const router = Router()

router.put('/api/decks/read-ydk', decksReadYdk)

router.delete('/api/decks/delete/:id', decksDeleteId)

router.put('/api/decks/update/:id', decksUpdateId)

router.put('/api/decks/publish/:id', decksPublishId)

router.put('/api/decks/unpublish/:id', decksUnpublishId)

router.put('/api/decks/share/:id', decksShareId)

router.get('/api/decks/builder/:id', decksBuilderId)

router.get('/api/decks/my-decks', [authenticate, decksMyDecks])

router.get('/api/decks/popular/:format', decksPopular)

router.get('/api/decks/gallery/:format', decksGallery)

router.get('/api/decks/frequent/:id', decksFrequent)

router.get('/api/decks/player/:id', decksPlayer)

router.get('/api/decks/like/:id', decksLike)

router.post('/api/decks/text-to-ydk/', convertTextToYDK)

router.get('/api/decks/download/:id', decksDownload)

router.get('/api/decks/count', countDecks)

router.get('/api/decks/:id', decksId)

router.get('/api/decks/', getDecks)

router.post('/api/decks/create', decksCreate)

export default router
