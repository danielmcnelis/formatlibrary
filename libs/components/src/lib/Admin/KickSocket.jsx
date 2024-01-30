
import {useSocket} from '@fl/hooks'
import { useEffect } from 'react'

export const KickSocket = () => {
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
            socket.emit('kick')
        } catch (err) {
            console.log(err)
        }
    }

    return (
        <div className="admin-portal">
            <div
                className="admin-button"
                type="submit"
                onClick={() => kick()}
            >
                Kick
            </div>
        </div>
    )
}
