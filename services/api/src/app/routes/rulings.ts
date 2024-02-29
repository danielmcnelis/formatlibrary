import { Router } from 'express'
import { authenticate, deleteRuling, updateRuling } from '../middleware'

const router = Router()

router.post('/api/rulings/update', [authenticate, updateRuling])

router.delete('/api/rulings/delete', [authenticate, deleteRuling])

export default router
