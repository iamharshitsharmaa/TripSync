import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'

export function useActivities(tripId, dayIndex) {
  return useQuery({
    queryKey: ['activities', tripId, dayIndex],
    queryFn: () => api.get(`/trips/${tripId}/activities?dayIndex=${dayIndex}`).then(r => r.data.data)
  })
}

export function useCreateActivity(tripId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post(`/trips/${tripId}/activities`, data).then(r => r.data.data),
    onSuccess: (_, vars) => qc.invalidateQueries(['activities', tripId, vars.dayIndex])
  })
}

export function useReorderActivity(tripId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, prevPosition, nextPosition }) =>
      api.patch(`/activities/${id}/reorder`, { prevPosition, nextPosition }),
    onSuccess: (_, vars) => qc.invalidateQueries(['activities', tripId])
  })
}