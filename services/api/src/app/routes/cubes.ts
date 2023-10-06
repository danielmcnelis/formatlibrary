import { Router } from 'express'
import { authenticate, cubesAll, cubesId, cubesLaunch, drawCube, getMyCubes, cubesReadYdk, cubesUpdateId, cubesCreate } from '../middleware'

const router = Router()

router.put('/api/cubes/read-ydk', cubesReadYdk)

router.put('/api/cubes/update/:id', cubesUpdateId)

router.get('/api/cubes/my-cubes', [authenticate, getMyCubes])

router.get('/api/cubes/:id', cubesId)

router.get('/api/cubes', cubesAll)

router.post('/api/cubes/draw/:id', drawCube)

router.post('/api/cubes/launch', cubesLaunch)

router.post('/api/cubes/create', cubesCreate)

export default router
