import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '@/api/auth'
import { getErrorMessage } from '@/lib/format'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types'

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'buyer' as UserRole,
  })
  const setAuth = useAuthStore((state) => state.setAuth)
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: () => register(form),
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken)
      navigate(user.role === 'seller' ? '/seller' : '/')
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, 'Registration failed')),
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <section className="auth-page">
      <div className="auth-intro">
        <p className="eyebrow">Join the marketplace</p>
        <h1>Begin your archive.</h1>
        <p>Collect rare objects or open an independent seller catalogue.</p>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <label>
          <span>Name</span>
          <input
            required
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
          />
        </label>
        <label>
          <span>Email</span>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
          />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            minLength={8}
            required
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
          />
        </label>
        <fieldset className="role-picker">
          <legend>Account type</legend>
          {(['buyer', 'seller'] as UserRole[]).map((role) => (
            <label key={role}>
              <input
                type="radio"
                name="role"
                checked={form.role === role}
                onChange={() => setForm((current) => ({ ...current, role }))}
              />
              <span>{role}</span>
            </label>
          ))}
        </fieldset>
        <button className="button button-primary" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating account…' : 'Create account'}
        </button>
        <p>
          Already registered? <Link to="/login">Sign in.</Link>
        </p>
      </form>
    </section>
  )
}
