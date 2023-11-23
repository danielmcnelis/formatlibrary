
import {useContext} from 'react'
import {SocketContext} from '@fl/context'

export const useSocket = () => {
    const socket = useContext(SocketContext)
    
    if (!socket) { 
        throw new Error('No socket context.')
    }

    return socket
}