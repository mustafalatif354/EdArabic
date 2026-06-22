'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBanner(false)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowInstallBanner(false)
    }

    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowInstallBanner(false)
    // Remember user dismissed (optional - could use localStorage)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!showInstallBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-white rounded-2xl shadow-2xl p-6 z-50 border-2 border-emerald-500 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition"
        aria-label="Sluit"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-3xl font-bold">
          ا
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Installeer EdArabic
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Installeer de app op je apparaat voor een betere leerervaring, zelfs offline!
          </p>
          <div className="flex space-x-3">
            <button
              onClick={handleInstall}
              className="flex-1 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition font-semibold"
            >
              Installeren
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Add animation to globals.css:
/*
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
*/
