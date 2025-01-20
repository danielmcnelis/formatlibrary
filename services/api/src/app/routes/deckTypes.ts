import { Router } from 'express'
import { getDeckTypes, createDeckType, downloadDeckType, getDeckTypeByName, getDeckTypeSummary } from '../middleware'

const router = Router()

router.get('/api/deckTypes/summary', getDeckTypeSummary)

router.get('/api/deckTypes/download', downloadDeckType)

router.get('/api/deckTypes/:name', getDeckTypeByName)

router.get('/api/deckTypes/', getDeckTypes)

router.post('/api/deckTypes/create', createDeckType)

export default router
