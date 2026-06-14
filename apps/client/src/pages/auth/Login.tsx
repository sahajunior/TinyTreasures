import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '@/api/auth'
import { getErrorMessage } from '@/lib/format'
import { useAuthStore } from '@/store/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const setAuth = useAuthStore((state) => state.setAuth)
  const navigate = useNavigate()
  const location = useLocation()
  const destination =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? '/'
  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken)
      navigate(user.role === 'seller' ? '/seller' : destination, {
        replace: true,
      })
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Sign in failed')),
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <section className="auth-page">
      <div className="auth-intro">
        <p className="eyebrow">Collector access</p>
        <h1>Welcome back.</h1>
        <p>Sign in to complete checkout, track purchases, and leave reviews.</p>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <label>
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button className="button button-primary" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </button>
        <p>
          New collector? <Link to="/register">Create an account.</Link>
        </p>
      </form>
    </section>
  )
}
