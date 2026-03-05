import { create } from 'zustand'
import axios from 'axios'

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')

const useAuthStore = create((set) => ({
  user:        JSON.parse(localStorage.getItem('user') || 'null'),
  accessToken: localStorage.getItem('accessToken') || null,
  isLoading:   false,

  // ── helpers ──────────────────────────────────────────────
  _persist: (user, accessToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, accessToken, isLoading: false })
  },

  // ── email/password login ──────────────────────────────────
  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data } = await axios.post(
        `${BASE_URL}/auth/login`,
        { email, password },
        { withCredentials: true }
      )
      useAuthStore.getState()._persist(data.data.user, data.data.accessToken)
      return data.data.user
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  // ── Google login ──────────────────────────────────────────
  loginWithGoogle: async (idToken) => {
    set({ isLoading: true })
    try {
      const { data } = await axios.post(
        `${BASE_URL}/auth/google`,
        { idToken },
        { withCredentials: true }
      )
      useAuthStore.getState()._persist(data.data.user, data.data.accessToken)
      return data.data.user
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  // ── register ──────────────────────────────────────────────
  register: async (name, email, password) => {
    set({ isLoading: true })
    try {
      const { data } = await axios.post(
        `${BASE_URL}/auth/register`,
        { name, email, password },
        { withCredentials: true }
      )
      useAuthStore.getState()._persist(data.data.user, data.data.accessToken)
      return data.data.user
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  // ── logout ────────────────────────────────────────────────
  logout: async () => {
    try {
      const token = localStorage.getItem('accessToken')
      await axios.post(
        `${BASE_URL}/auth/logout`,
        {},
        { withCredentials: true, headers: { Authorization: `Bearer ${token}` } }
      )
    } catch {
      // ignore — clear local state regardless
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      set({ user: null, accessToken: null })
    }
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },
}))

export default useAuthStore