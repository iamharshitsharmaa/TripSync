import axios from 'axios'

const BASE_URL =  process.env.VITE_API_URL //  || '''http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends httpOnly refresh token cookie
})

// ── Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Track if a refresh is already in progress (prevents multiple refresh calls)
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => {
    if (error) p.reject(error)
    else p.resolve(token)
  })
  failedQueue = []
}

// ── Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Call refresh endpoint — sends cookie automatically
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )

        const newToken = data.data.accessToken
        localStorage.setItem('accessToken', newToken)
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`
        originalRequest.headers.Authorization = `Bearer ${newToken}`

        processQueue(null, newToken)
        return api(originalRequest) // retry original request with new token

      } catch (refreshError) {
        // Refresh failed — log user out
        processQueue(refreshError, null)
        localStorage.removeItem('accessToken')
        window.location.href = '/login' // force redirect to login
        return Promise.reject(refreshError)

      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api