import { Router } from 'express'
import { draftsId, getDraftParticipants, downloadInventory, selectCard, getInventory, getPack, joinDraft, leaveDraft, startDraft } from '../middleware'

const router = Router()

router.get('/api/drafts/participants/:id', getDraftParticipants)

router.get('/api/drafts/pack', getPack)

router.get('/api/drafts/download', downloadInventory)

router.get('/api/drafts/inventory', getInventory)

router.get('/api/drafts/:id', draftsId)

router.put('/api/drafts/select/:id', selectCard)

router.post('/api/drafts/join/:id', joinDraft)

router.post('/api/drafts/leave/:id', leaveDraft)

router.post('/api/drafts/start/:id', startDraft)

export default router
