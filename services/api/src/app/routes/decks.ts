import { Router } from 'express'
import {
  authenticate,
  deleteDeck,
  updateDeck,
  publishDeck,
  unpublishDeck,
  shareDeck,
  openDeckInBuilder,
  getMyDecks,
  readDeckYdk,
  getPlayerMostDownloadedDecks,
  getPopularDecks,
  getDeckGallery,
  getFavoriteDecks,
  getPublicDecks,
  likeDeck,
  downloadDeck,
  getDeckAsAdmin,
  getDeckAsRegularUser,
  getDeckAsSubscriber,
  getDecksAsAdmin,
  getDecksAsSubscriber,
  getDecksAsRegularUser,
  countDecks,
  createDeck,
  updateDeckLabels,
  convertTextToYDK,
  convertYDKeToYDK
} from '../middleware'

const router = Router()

router.put('/api/decks/read-ydk', readDeckYdk)

router.put('/api/decks/convert-ydke-to-ydk', convertYDKeToYDK)

router.delete('/api/decks/delete/:id', deleteDeck)

router.put('/api/decks/update/:id', updateDeck)

router.put('/api/decks/publish/:id', publishDeck)

router.put('/api/decks/unpublish/:id', unpublishDeck)

router.put('/api/decks/share/:id', shareDeck)

router.get('/api/decks/deck-builder/:id', openDeckInBuilder)

router.get('/api/decks/my-decks', [authenticate, getMyDecks])

router.get('/api/decks/popular/:format', getPopularDecks)

router.get('/api/decks/gallery/:format', getDeckGallery)

router.get('/api/decks/favorite/:id', getFavoriteDecks)

router.get('/api/decks/player/:id', getPublicDecks)

router.get('/api/decks/most-downloaded/:id', getPlayerMostDownloadedDecks)

router.get('/api/decks/like/:id', likeDeck)

router.post('/api/decks/text-to-ydk/', convertTextToYDK)

router.get('/api/decks/download/subscriber/:id', [authenticate, downloadDeck])

router.get('/api/decks/download/:id', [authenticate, downloadDeck])

router.get('/api/decks/count', countDecks)

router.get('/api/decks/admin/:id', [authenticate, getDeckAsAdmin])

router.get('/api/decks/subscriber/:id', [authenticate, getDeckAsSubscriber])

router.get('/api/decks/admin', [authenticate, getDecksAsAdmin])

router.get('/api/decks/subscriber', [authenticate, getDecksAsSubscriber])

router.get('/api/decks/:id', [authenticate, getDeckAsRegularUser])

router.get('/api/decks/', [authenticate, getDecksAsRegularUser])

router.post('/api/decks/labels', [authenticate, updateDeckLabels])

router.post('/api/decks/create', createDeck)

export default router
