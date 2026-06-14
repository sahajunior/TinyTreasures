import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'
import { useAuthStore } from '@/store/authStore'
import type { ApiResponse } from '@/types'

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string> | null = null

const refreshAccessToken = async (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<ApiResponse<{ accessToken: string }>>(
        `${api.defaults.baseURL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .then(({ data }) => {
        const token = data.data.accessToken
        useAuthStore.getState().setAccessToken(token)
        return token
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryableRequest | undefined
    const isRefreshRequest = request?.url?.endsWith('/auth/refresh')

    if (error.response?.status !== 401 || !request || request._retry || isRefreshRequest) {
      return Promise.reject(error)
    }

    request._retry = true
    try {
      const token = await refreshAccessToken()
      request.headers.Authorization = `Bearer ${token}`
      return api(request)
    } catch (refreshError) {
      useAuthStore.getState().logout()
      return Promise.reject(refreshError)
    }
  },
)

export default api
