
import { createContext } from "react"
import { Socket } from "socket.io-client"

export const SocketContext = createContext<Socket>(undefined as unknown as Socket)
export const SocketProvider = SocketContext.Provider