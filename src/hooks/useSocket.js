import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import useAuthStore from '../store/authStore'

const SOCKET_URL = (`${import.meta.env.VITE_API_URL}/api` || 'http://localhost:5000')
  .replace(/\/api$/, '')

let socket = null

export function useSocket(tripId) {
  const { accessToken } = useAuthStore()
  const qc = useQueryClient()

  useEffect(() => {
    if (!accessToken || !tripId) return

    if (!socket || socket.disconnected) {
      socket = io(SOCKET_URL, {
        auth:                 { token: accessToken },
        transports:           ['polling', 'websocket'],
        reconnection:         true,
        reconnectionAttempts: 5,
        reconnectionDelay:    1000,
      })

      socket.on('connect', () => console.log('Socket connected ✅'))
      socket.on('connect_error', (err) => console.warn('Socket error (non-fatal):', err.message))

      // On reconnect, re-join the trip room so presence is restored
      socket.on('reconnect', () => {
        if (tripId) socket.emit('join:trip', tripId)
      })
    }

    // Send user info with join so backend can track presence without JWT
    const { user } = useAuthStore.getState()
    socket.emit('join:trip', {
      tripId,
      user: user ? { userId: user._id || user.id, name: user.name, avatar: user.avatar || null } : null
    })

    const onActivityCreated   = () => qc.invalidateQueries({ queryKey: ['activities', tripId] })
    const onActivityUpdated   = () => qc.invalidateQueries({ queryKey: ['activities', tripId] })
    const onActivityReordered = () => qc.invalidateQueries({ queryKey: ['activities', tripId] })
    const onActivityDeleted   = () => qc.invalidateQueries({ queryKey: ['activities', tripId] })
    const onCommentAdded      = (data) => qc.invalidateQueries({ queryKey: ['comments', data.entityType, data.entityId] })
    const onMemberJoined      = () => qc.invalidateQueries({ queryKey: ['trip', tripId] })

    socket.on('activity:created',   onActivityCreated)
    socket.on('activity:updated',   onActivityUpdated)
    socket.on('activity:reordered', onActivityReordered)
    socket.on('activity:deleted',   onActivityDeleted)
    socket.on('comment:added',      onCommentAdded)
    socket.on('member:joined',      onMemberJoined)

    return () => {
      socket.emit('leave:trip', tripId)
      socket.off('activity:created',   onActivityCreated)
      socket.off('activity:updated',   onActivityUpdated)
      socket.off('activity:reordered', onActivityReordered)
      socket.off('activity:deleted',   onActivityDeleted)
      socket.off('comment:added',      onCommentAdded)
      socket.off('member:joined',      onMemberJoined)
    }
  }, [tripId, accessToken])

  return socket
}