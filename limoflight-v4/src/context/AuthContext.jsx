// LimoFlight V4 — src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthCtx = createContext(null)
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Attach saved token to every axios request
const savedToken = localStorage.getItem('lf_token')
if (savedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('lf_user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  // Keep axios header in sync whenever user changes
  useEffect(() => {
    const token = localStorage.getItem('lf_token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }, [user])

  async function login(email, password, twoFACode) {
    setLoading(true)
    try {
      const { data } = await axios.post(`${API}/api/auth/login`, {
        email,
        password,
        ...(twoFACode && { twoFACode }),
      })

      // Server signals 2FA needed — don't save user yet
      if (data.requires2FA) return { requires2FA: true }

      localStorage.setItem('lf_user', JSON.stringify(data.user))
      localStorage.setItem('lf_token', data.token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
      setUser(data.user)
      return data
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem('lf_user')
    localStorage.removeItem('lf_token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  // Auto-logout when token expires (JWT exp check)
  useEffect(() => {
    const token = localStorage.getItem('lf_token')
    if (!token) return
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const msLeft = payload.exp * 1000 - Date.now()
      if (msLeft <= 0) { logout(); return }
      const t = setTimeout(logout, msLeft)
      return () => clearTimeout(t)
    } catch {
      // malformed token — clear it
      logout()
    }
  }, [user])

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
