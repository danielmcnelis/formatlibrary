import { Router } from 'express'
import { authenticate, getAllCubes, getCubeById, drawCube, getMyCubes, publishCube, unpublishCube, readCubeYdk, updateCube, createCube } from '../middleware'

const router = Router()

router.put('/api/cubes/read-ydk', readCubeYdk)

router.put('/api/cubes/update/:id', updateCube)

router.get('/api/cubes/my-cubes', [authenticate, getMyCubes])

router.get('/api/cubes/:id', getCubeById)

router.get('/api/cubes', getAllCubes)

router.put('/api/cubes/publish/:id', publishCube)

router.put('/api/cubes/unpublish/:id', unpublishCube)

router.post('/api/cubes/draw/:id', drawCube)

router.post('/api/cubes/create', createCube)

export default router
