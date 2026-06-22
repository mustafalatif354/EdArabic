// lib/playArabic.ts
// Plays Arabic letter names using the Web Speech API.
// Robust handling for Chrome (async voices), Safari, Firefox.

const LETTER_NAMES_AR: Record<string, string> = {
  'ا': 'ألف',
  'ب': 'باء',
  'ت': 'تاء',
  'ث': 'ثاء',
  'ج': 'جيم',
  'ح': 'حاء',
  'خ': 'خاء',
  'د': 'دال',
  'ذ': 'ذال',
  'ر': 'راء',
  'ز': 'زاي',
  'س': 'سين',
  'ش': 'شين',
  'ص': 'صاد',
  'ض': 'ضاد',
  'ط': 'طاء',
  'ظ': 'ظاء',
  'ع': 'عين',
  'غ': 'غين',
  'ف': 'فاء',
  'ق': 'قاف',
  'ك': 'كاف',
  'ل': 'لام',
  'م': 'ميم',
  'ن': 'نون',
  'ه': 'هاء',
  'و': 'واو',
  'ي': 'ياء',
}

let audioEl: HTMLAudioElement | null = null

function speakText(text: string, voice: SpeechSynthesisVoice | null) {
  const synth = window.speechSynthesis

  // Chrome bug: if speech is paused/stuck, cancel it first
  if (synth.speaking) synth.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ar-SA'
  utterance.rate = 0.8
  utterance.pitch = 1.0
  utterance.volume = 1.0
  if (voice) utterance.voice = voice

  // Chrome bug workaround: sometimes speak() silently fails
  // Small timeout gives the cancel() time to take effect
  setTimeout(() => synth.speak(utterance), 50)
}

function getArabicVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined') return null
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find(v => v.lang === 'ar-SA') ||
    voices.find(v => v.lang === 'ar-EG') ||
    voices.find(v => v.lang === 'ar') ||
    voices.find(v => v.lang.startsWith('ar')) ||
    null
  )
}

export function playArabicLetter(symbol: string): void {
  if (typeof window === 'undefined') return
  const synth = window.speechSynthesis
  if (!synth) return

  const text = LETTER_NAMES_AR[symbol] ?? symbol

  // Try immediately with already-loaded voices
  const voice = getArabicVoice()
  if (voice) {
    speakText(text, voice)
    return
  }

  // Voices not loaded yet (Chrome loads them async) — wait for them
  const handleVoicesChanged = () => {
    synth.removeEventListener('voiceschanged', handleVoicesChanged)
    const loadedVoice = getArabicVoice()
    speakText(text, loadedVoice)
  }
  synth.addEventListener('voiceschanged', handleVoicesChanged)

  // Also trigger a getVoices() call to kick off loading
  synth.getVoices()

  // Safety fallback: if voiceschanged never fires, speak anyway after 500ms
  setTimeout(() => {
    synth.removeEventListener('voiceschanged', handleVoicesChanged)
    if (!synth.speaking) {
      speakText(text, getArabicVoice())
    }
  }, 500)
}

export function playArabicFile(
  soundFile: string | null | undefined,
  symbol: string,
): void {
  if (!soundFile) {
    playArabicLetter(symbol)
    return
  }

  if (!audioEl) audioEl = new Audio()
  audioEl.pause()
  audioEl.src = soundFile

  audioEl.play().catch(() => {
    playArabicLetter(symbol)
  })
}

// Call once on app mount to trigger voice loading early
export function preloadArabicVoices(): void {
  if (typeof window === 'undefined') return
  window.speechSynthesis?.getVoices()
}
