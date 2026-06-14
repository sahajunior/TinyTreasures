import axios from 'axios'

export const formatCurrency = (cents: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)

export const formatDate = (date: string): string =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))

export const getErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong',
): string => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallback
  }
  return error instanceof Error ? error.message : fallback
}
