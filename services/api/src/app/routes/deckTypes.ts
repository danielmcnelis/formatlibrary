import { Router } from 'express'
import { deckTypes, deckTypesCreate, deckTypesDownload, deckTypesName, deckTypesSummary } from '../middleware'

const router = Router()

router.get('/api/decktypes/summary', deckTypesSummary)

router.get('/api/decktypes/download', deckTypesDownload)

router.get('/api/decktypes/:name', deckTypesName)

router.get('/api/decktypes/', deckTypes)

router.post('/api/decktypes/create', deckTypesCreate)

export default router
