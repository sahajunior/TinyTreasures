import api from '@/api/client'
import type { ApiResponse, User, UserRole } from '@/types'

interface AuthPayload {
  user: User
  accessToken: string
}

export const login = async (
  email: string,
  password: string,
): Promise<AuthPayload> => {
  const { data } = await api.post<ApiResponse<AuthPayload>>('/auth/login', {
    email,
    password,
  })
  return data.data
}

export const register = async (input: {
  name: string
  email: string
  password: string
  role: UserRole
}): Promise<AuthPayload> => {
  const { data } = await api.post<ApiResponse<AuthPayload>>(
    '/auth/register',
    input,
  )
  return data.data
}

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout')
}
