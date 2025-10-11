"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function LessonsPage() {
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/login")
      } else {
        // Redirect to homepage since we now have individual lesson pages
        router.push("/home")
      }
    }

    checkAuth()
  }, [router])

  return (
    <main className="min-h-screen bg-emerald-50 flex items-center justify-center">
      <p>Bezig met omleiden...</p>
    </main>
  )
}
