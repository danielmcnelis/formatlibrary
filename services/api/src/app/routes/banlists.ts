import { Router } from 'express'
import { getAllBanlists, getBanlistByDate, createNewBanlist } from '../middleware'

const router = Router()

router.get('/api/banlists/all', getAllBanlists)
router.get('/api/banlists/:date', getBanlistByDate)
router.post('/api/banlists/create', createNewBanlist)

export default router
