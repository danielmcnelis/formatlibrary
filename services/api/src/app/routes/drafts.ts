import { Router } from 'express'
import { getDraft, getParticipants, downloadInventory, getInventory, getPack } from '../middleware'

const router = Router()

router.get('/api/drafts/download', downloadInventory)

router.get('/api/drafts/inventory', getInventory)

router.get('/api/drafts/pack', getPack)

router.get('/api/drafts/participants/:id', getParticipants)

router.get('/api/drafts/:id', getDraft)

export default router
