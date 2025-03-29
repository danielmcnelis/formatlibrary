import { Router } from 'express'
import { authenticate, getDeckTypes, createDeckType, getWinRateData, downloadDeckType, getDeckTypeByName, getDeckTypeSummary, getWinRateData } from '../middleware'

const router = Router()

router.get('/api/decktypes/winrates', [authenticate, getWinRateData])

router.get('/api/decktypes/summary', getDeckTypeSummary)

router.get('/api/decktypes/download', downloadDeckType)

router.get('/api/decktypes/:name', getDeckTypeByName)

router.get('/api/decktypes/', getDeckTypes)

router.post('/api/decktypes/create', createDeckType)

export default router
