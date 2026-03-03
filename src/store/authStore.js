import { create } from 'zustand'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const useAuthStore = create((set, get) => ({
  user:        JSON.parse(localStorage.getItem('user') || 'null'),
  accessToken: localStorage.getItem('accessToken') || null,
  isLoading:   false,

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data } = await axios.post(
        `${BASE_URL}/auth/login`,
        { email, password },
        { withCredentials: true }
      )
      const { user, accessToken } = data.data

      // Save both to localStorage so they survive page refresh
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('user', JSON.stringify(user))

      set({ user, accessToken, isLoading: false })
      return user
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true })
    try {
      const { data } = await axios.post(
        `${BASE_URL}/auth/register`,
        { name, email, password },
        { withCredentials: true }
      )
      const { user, accessToken } = data.data

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('user', JSON.stringify(user))

      set({ user, accessToken, isLoading: false })
      return user
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  logout: async () => {
    try {
      const token = localStorage.getItem('accessToken')
      await axios.post(
        `${BASE_URL}/auth/logout`,
        {},
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
        }
      )
    } catch {
      // ignore logout errors
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      set({ user: null, accessToken: null })
    }
  },

  // Call this on app load to restore user from localStorage
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },
}))

export default useAuthStore


