import { Router } from 'express'
import { getSealedPacks, launchSealed } from '../middleware'

const router = Router()

router.post('/api/sealed/launch', launchSealed)

router.post('/api/sealed/packs', getSealedPacks)

export default router
