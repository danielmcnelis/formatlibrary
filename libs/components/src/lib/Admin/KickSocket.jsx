
import {useSocket} from '@fl/hooks'
import { useState, useEffect } from 'react'

export const KickSocket = () => {
	const [socketId, setSocketId] = useState(null)
    const socket = useSocket()

    // USE EFFECT
    useEffect(() => {
        return () => {
            console.log('disconnectSocket()')
            socket.disconnect()
        }
    }, [])

    // KICK
    const kick = async () => {
        try {
            const data = { socketId }
            socket.emit('kick', data)
        } catch (err) {
            console.log(err)
        }
    }

    return (
        <div className="admin-portal">

            <label>Socket ID:
                <input
                    id="socket-id"
                    value={socketId || ''}
                    type="text"
                    onChange={(e) => setSocketId(e.target.value)}
                />
            </label>

            <a
                className="admin-button"
                type="submit"
                onClick={() => kick()}
            >
                Kick
            </a>
        </div>
    )
}
