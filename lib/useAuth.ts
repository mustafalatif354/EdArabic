// lib/useAuth.ts
// Replaces the copy-pasted auth check in every page.
// Usage:
//   const { user, loading } = useAuth()
//   if (loading) return <LoadingScreen />

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

interface UseAuthOptions {
  redirectTo?: string  // where to send unauthenticated users (default: '/login')
}

interface UseAuthResult {
  user: User | null
  loading: boolean
}

export function useAuth({ redirectTo = '/login' }: UseAuthOptions = {}): UseAuthResult {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push(redirectTo)
      } else {
        setUser(data.user)
        setLoading(false)
      }
    }
    checkAuth()
  }, [router, redirectTo])

  return { user, loading }
}
