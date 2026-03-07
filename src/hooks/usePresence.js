import { useEffect, useState } from 'react'
import { useSocket } from './useSocket'

export function usePresence(tripId) {
  const socket = useSocket(tripId)
  const [online, setOnline] = useState([])

  useEffect(() => {
    if (!socket || !tripId) return

    console.log('[Presence] hook mounted, socket id:', socket.id, 'tripId:', tripId)

    const onPresence = ({ tripId: tid, online: users }) => {
      console.log('[Presence] received presence:update for', tid, '→', users)
      if (tid === tripId) setOnline(users)
    }
    socket.on('presence:update', onPresence)

    // Small delay to ensure join:trip has been processed first
    const timer = setTimeout(() => {
      console.log('[Presence] emitting presence:get for', tripId)
      socket.emit('presence:get', tripId)
    }, 300)

    const onReconnect = () => socket.emit('presence:get', tripId)
    socket.on('reconnect', onReconnect)

    return () => {
      clearTimeout(timer)
      socket.off('presence:update', onPresence)
      socket.off('reconnect', onReconnect)
    }
  }, [socket?.id, tripId])  // socket?.id ensures re-run when socket actually connects

  return online
}