import { Router } from 'express'
import { authenticate, getPlayerAvatarById, getPlayerRoles, getPlayersByPartialName, updatePassword, createPlayer, getPlayerById, getPlayers, countPlayers, updatePlayer } from '../middleware'

const router = Router()

router.get('/api/players/partial-name/:query', getPlayersByPartialName)

router.put('/api/players/update/:id', updatePlayer)

router.put('/api/players/password/:id', updatePassword)

router.get('/api/players/roles', [authenticate, getPlayerRoles])

router.get('/api/players/count', countPlayers)

router.get('/api/players/:id/avatar', getPlayerAvatarById)

router.get('/api/players/:id', getPlayerById)

router.get('/api/players/', getPlayers)

router.post('/api/players/create', createPlayer)

export default router
