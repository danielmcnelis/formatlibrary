import { Router } from 'express'
import { getSealedPacks, launchSealed } from '../middleware'

const router = Router()

router.get('/api/sealed/packs', getSealedPacks)

router.post('/api/sealed/launch', launchSealed)

export default router
