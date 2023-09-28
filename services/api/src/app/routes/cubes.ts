import { Router } from 'express'
import { authenticate, cubesId, getMyCubes, cubesReadYdk, cubesUpdateId, cubesCreate } from '../middleware'

const router = Router()

router.put('/api/cubes/read-ydk', cubesReadYdk)

router.put('/api/cubes/update/:id', cubesUpdateId)

router.get('/api/cubes/my-cubes', [authenticate, getMyCubes])

router.get('/api/cubes/:id', cubesId)

router.post('/api/cubes/create', cubesCreate)

export default router
