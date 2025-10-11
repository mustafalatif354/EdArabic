'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuthAndRedirect() {
      const { data } = await supabase.auth.getUser();
      
      if (data.user) {
        // User is logged in, redirect to homepage
        router.push('/home');
      } else {
        // User is not logged in, redirect to login
        router.push('/login');
      }
    }

    checkAuthAndRedirect();
  }, [router]);

  // Show loading while checking authentication
  return (
    <main className="min-h-screen bg-emerald-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">EdArabic</h1>
        <p>Bezig met laden...</p>
      </div>
    </main>
  );
}
