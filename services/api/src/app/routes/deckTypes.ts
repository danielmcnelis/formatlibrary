import { Router } from 'express'
import { getDeckTypes, createDeckType, downloadDeckType, getDeckTypeByName, getDeckTypeSummary } from '../middleware'

const router = Router()

router.get('/api/decktypes/summary', getDeckTypeSummary)

router.get('/api/decktypes/download', downloadDeckType)

router.get('/api/decktypes/:name', getDeckTypeByName)

router.get('/api/decktypes/', getDeckTypes)

router.post('/api/decktypes/create', createDeckType)

export default router
