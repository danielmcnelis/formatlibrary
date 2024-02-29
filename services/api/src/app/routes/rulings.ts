import { Router } from 'express'
import { authenticate, deleteRuling } from '../middleware'

const router = Router()

router.delete('/api/rulings/delete', [authenticate, deleteRuling])

export default router
