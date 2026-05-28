"use client"

import { useEffect, useState } from 'react'

interface CurrentUserResponse {
  success: boolean
  isAuthenticated?: boolean
  user?: { _id: string; name: string; email: string }
  message?: string
}

let cachedUser: CurrentUserResponse['user'] | null = null
let cachedAt = 0
const USER_CACHE_TTL_MS = 60_000

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUserResponse['user'] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const now = Date.now()
    if (cachedAt && now - cachedAt < USER_CACHE_TTL_MS) {
      setUser(cachedUser)
      setLoading(false)
      return () => { isMounted = false }
    }

    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/status', { credentials: 'include' })
        if (!res.ok) throw new Error('Not authenticated')
        const data: CurrentUserResponse = await res.json()
        if (isMounted && data?.isAuthenticated && data.user) {
          setUser(data.user)
          cachedUser = data.user
          cachedAt = Date.now()
        } else if (isMounted) {
          setUser(null)
          cachedUser = null
          cachedAt = Date.now()
        }
      } catch (_e) {
        if (isMounted) {
          setUser(null)
          cachedUser = null
          cachedAt = Date.now()
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchUser()
    return () => { isMounted = false }
  }, [])

  return { user, loading }
}

