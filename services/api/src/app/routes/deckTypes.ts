import { Router } from 'express'
import { deckTypes, deckTypesCreate, deckTypesDownload, deckTypesName, deckTypesSummary } from '../middleware'

const router = Router()

router.get('/api/deckTypes/summary', deckTypesSummary)

router.get('/api/deckTypes/download', deckTypesDownload)

router.get('/api/deckTypes/:name', deckTypesName)

router.get('/api/deckTypes/', deckTypes)

router.post('/api/deckTypes/create', deckTypesCreate)

export default router
