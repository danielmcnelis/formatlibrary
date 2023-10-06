import { Router } from 'express'
import { draftsId, joinDraft, startDraft } from '../middleware'

const router = Router()

console.log('!!joinDraft', !!joinDraft)

router.get('/api/drafts/:id', draftsId)

router.post('/api/drafts/join/:id', joinDraft)

router.post('/api/drafts/start/:id', startDraft)

export default router
