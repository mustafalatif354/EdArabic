"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

// Types for API responses
interface Verse {
  number: number
  text: string
  translation?: string
  page?: number
}

interface Surah {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  verses?: Verse[]
}

interface QuranApiResponse {
  code: number
  status: string
  data: Surah[]
}

interface MushafPage {
  pageNumber: number
  verses: Verse[]
  surahInfo: {
    name: string
    englishName: string
    number: number
  }
}

export default function QuranReadExercisePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showTranslation, setShowTranslation] = useState(false)
  const [mushafPages, setMushafPages] = useState<MushafPage[]>([])
  const [loadingPage, setLoadingPage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(604) // Madani Mushaf has 604 pages
  const [isFlipping, setIsFlipping] = useState(false)

  // Convert English numbers to Arabic numerals
  const toArabicNumerals = (num: number): string => {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
    return num.toString().split('').map(digit => arabicNumerals[parseInt(digit)]).join('')
  }

  // Fetch Mushaf page data with Madani Mushaf API
  const fetchMushafPage = async (pageNumber: number) => {
    setLoadingPage(true)
    try {
      // Using Quran.com API for page-based access with Madani Mushaf
      const response = await fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`)
      const data = await response.json()
      
      if (data.code === 200 && data.data && data.data.ayahs) {
        const verses = data.data.ayahs.map((ayah: any) => ({
          number: ayah.numberInSurah,
          text: ayah.text.replace(/بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ/g, '').trim(),
          page: ayah.page
        }))
        
        const firstAyah = data?.data?.ayahs?.[0];

        const surahInfo = firstAyah
          ? {
              name: firstAyah.surah.name,
              englishName: firstAyah.surah.englishName,
              number: firstAyah.surah.number,
            }
          : {
              name: "Onbekende Soera",
              englishName: "",
              number: pageNumber,
            };
        
        const mushafPage: MushafPage = {
          pageNumber,
          verses,
          surahInfo
        }
        
        setMushafPages(prev => {
          const updated = [...prev]
          updated[pageNumber - 1] = mushafPage
          return updated
        })
      } else {
        console.error('API Error:', data)
        setError('Failed to load Mushaf page')
      }
    } catch (err) {
      setError('Failed to load Mushaf page')
      console.error('Error fetching Mushaf page:', err)
    } finally {
      setLoadingPage(false)
    }
  }

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/login")
      } else {
        setUser(data.user)
        // Initialize with empty pages array
        setMushafPages(new Array(604).fill(null))
        // Load first page
        await fetchMushafPage(1)
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Handle page navigation with smooth flip animation for two-page layout
  const handlePageChange = async (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
      // Start flip animation
      setIsFlipping(true)
      
      // Wait for flip animation to complete
      setTimeout(async () => {
        setCurrentPage(pageNumber)
        // Load current page if not already loaded
        if (!mushafPages[pageNumber - 1]) {
          await fetchMushafPage(pageNumber)
        }
        // Load next page for two-page layout if not already loaded
        if (pageNumber < totalPages && !mushafPages[pageNumber]) {
          await fetchMushafPage(pageNumber + 1)
        }
        // End flip animation
        setTimeout(() => setIsFlipping(false), 200)
      }, 400)
    }
  }

  // Get current page data
  const currentPageData = mushafPages[currentPage - 1]
  const nextPageData = mushafPages[currentPage]

  if (loading) {
    return (
      <main className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p>Bezig met laden van de Mushaf...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Fout bij laden</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Probeer opnieuw
          </button>
        </div>
      </main>
    )
  }

  return (
    <>
      <style jsx>{`
        .flip-page {
          animation: flipRight 0.8s cubic-bezier(0.4, 0.0, 0.2, 1);
        }
        
        @keyframes flipRight {
          0% { 
            transform: perspective(1200px) rotateY(0deg);
            opacity: 1;
          }
          25% { 
            transform: perspective(1200px) rotateY(15deg);
            opacity: 0.9;
          }
          50% { 
            transform: perspective(1200px) rotateY(90deg);
            opacity: 0.7;
          }
          75% { 
            transform: perspective(1200px) rotateY(165deg);
            opacity: 0.9;
          }
          100% { 
            transform: perspective(1200px) rotateY(0deg);
            opacity: 1;
          }
        }
      `}</style>
      <main className="min-h-screen bg-gray-50">
      {/* Quran.com Style Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white"
                onChange={(e) => {
                  const surahNumber = parseInt(e.target.value);
                  const surahToPageMap: Record<number, number> = {
                    1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187, 10: 208,
                    11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282, 18: 293, 19: 305, 20: 312,
                    21: 322, 22: 332, 23: 342, 24: 350, 25: 359, 26: 367, 27: 377, 28: 385, 29: 396, 30: 404,
                    31: 411, 32: 415, 33: 418, 34: 428, 35: 434, 36: 440, 37: 446, 38: 453, 39: 458, 40: 467,
                    41: 477, 42: 483, 43: 489, 44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515, 50: 518,
                    51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537, 58: 542, 59: 545, 60: 549,
                    61: 551, 62: 553, 63: 554, 64: 556, 65: 558, 66: 560, 67: 562, 68: 564, 69: 566, 70: 568,
                    71: 570, 72: 572, 73: 574, 74: 575, 75: 577, 76: 578, 77: 580, 78: 582, 79: 583, 80: 585,
                    81: 586, 82: 587, 83: 587, 84: 589, 85: 590, 86: 591, 87: 591, 88: 592, 89: 593, 90: 594,
                    91: 595, 92: 595, 93: 596, 94: 596, 95: 597, 96: 597, 97: 598, 98: 598, 99: 599, 100: 599,
                    101: 600, 102: 600, 103: 601, 104: 601, 105: 601, 106: 602, 107: 602, 108: 602, 109: 603,
                    110: 603, 111: 603, 112: 604, 113: 604, 114: 604
                  };
                  const startPage = surahToPageMap[surahNumber] || 1;
                  handlePageChange(startPage);
                }}
              >
                <option value="">Kies een soera...</option>
                <option value="1">1. Al-Faatiha (الفاتحة)</option>
                <option value="2">2. Al-Baqara (البقرة)</option>
                <option value="3">3. Aal-Imran (آل عمران)</option>
                <option value="4">4. An-Nisa (النساء)</option>
                <option value="5">5. Al-Ma'idah (المائدة)</option>
                <option value="6">6. Al-An'am (الأنعام)</option>
                <option value="7">7. Al-A'raf (الأعراف)</option>
                <option value="8">8. Al-Anfal (الأنفال)</option>
                <option value="9">9. At-Tawbah (التوبة)</option>
                <option value="10">10. Yunus (يونس)</option>
                <option value="11">11. Hud (هود)</option>
                <option value="12">12. Yusuf (يوسف)</option>
                <option value="13">13. Ar-Ra'd (الرعد)</option>
                <option value="14">14. Ibrahim (إبراهيم)</option>
                <option value="15">15. Al-Hijr (الحجر)</option>
                <option value="16">16. An-Nahl (النحل)</option>
                <option value="17">17. Al-Isra' (الإسراء)</option>
                <option value="18">18. Al-Kahf (الكهف)</option>  
                <option value="19">19. Maryam (مريم)</option>
                <option value="20">20. Ta-Ha (طه)</option>
                <option value="21">21. Al-Anbiya' (الأنبياء)</option>
                <option value="22">22. Al-Hajj (الحج)</option>
                <option value="23">23. Al-Mu'minun (المؤمنون)</option>
                <option value="24">24. An-Nur (النور)</option>
                <option value="25">25. Al-Furqan (الفرقان)</option>
                <option value="26">26. Ash-Shu'ara (الشعراء)</option>
                <option value="27">27. An-Naml (النمل)</option>
                <option value="28">28. Al-Qasas (القصص)</option>
                <option value="29">29. Al-Ankabut (العنكبوت)</option>
                <option value="30">30. Ar-Rum (الروم)</option>
                <option value="31">31. Luqman (لقمان)</option>
                <option value="32">32. As-Sajdah (السجدة)</option>
                <option value="33">33. Al-Ahzab (الأحزاب)</option>
                <option value="34">34. Saba' (سبأ)</option>
                <option value="35">35. Fatir (فاطر)</option>
                <option value="36">36. Ya-Sin (يس)</option>
                <option value="37">37. As-Saffat (الصافات)</option>
                <option value="38">38. Sad (ص)</option>
                <option value="39">39. Az-Zumar (الزمر)</option>
                <option value="40">40. Ghafir (غافر)</option>
                <option value="41">41. Fussilat (فصلت)</option>
                <option value="42">42. Ash-Shura (الشورى)</option>
                <option value="43">43. Az-Zukhruf (الزخرف)</option>
                <option value="44">44. Ad-Dukhan (الدخان)</option>
                <option value="45">45. Al-Jathiyah (الجاثية)</option>
                <option value="46">46. Al-Ahqaf (الأحقاف)</option>
                <option value="47">47. Muhammad (محمد)</option>
                <option value="48">48. Al-Fath (الفتح)</option>
                <option value="49">49. Al-Hujurat (الحجرات)</option>
                <option value="50">50. Qaf (ق)</option>
                <option value="51">51. Ad-Dhariyat (الذاريات)</option>
                <option value="52">52. At-Tur (الطور)</option>
                <option value="53">53. An-Najm (النجم)</option>
                <option value="54">54. Al-Qamar (القمر)</option>
                <option value="55">55. Ar-Rahman (الرحمن)</option>
                <option value="56">56. Al-Waqi'ah (الواقعة)</option>
                <option value="57">57. Al-Hadid (الحديد)</option>
                <option value="58">58. Al-Mujadila (المجادلة)</option>
                <option value="59">59. Al-Hashr (الحشر)</option>
                <option value="60">60. Al-Mumtahina (الممتحنة)</option>
                <option value="61">61. As-Saff (الصف)</option>
                <option value="62">62. Al-Jumu'a (الجمعة)</option>
                <option value="63">63. Al-Munafiqun (المنافقون)</option>
                <option value="64">64. At-Taghabun (التغابن)</option>
                <option value="65">65. At-Talaq (الطلاق)</option>
                <option value="66">66. At-Tahrim (التحريم)</option>
                <option value="67">67. Al-Mulk (الملك)</option>
                <option value="68">68. Al-Qalam (القلم)</option>
                <option value="69">69. Al-Haqqah (الحاقة)</option>
                <option value="70">70. Al-Ma'arij (المعارج)</option>
                <option value="71">71. Nuh (نوح)</option>
                <option value="72">72. Al-Jinn (الجن)</option>
                <option value="73">73. Al-Muzzammil (المزمل)</option>
                <option value="74">74. Al-Muddaththir (المدثر)</option>
                <option value="75">75. Al-Qiyamah (القيامة)</option>
                <option value="76">76. Al-Insan (الإنسان)</option>
                <option value="77">77. Al-Mursalat (المرسلات)</option>
                <option value="78">78. An-Naba' (النبأ)</option>
                <option value="79">79. An-Nazi'at (النازعات)</option>
                <option value="80">80. 'Abasa (عبس)</option>
                <option value="81">81. At-Takwir (التكوير)</option>
                <option value="82">82. Al-Infitar (الانفطار)</option>
                <option value="83">83. Al-Mutaffifin (المطففين)</option>
                <option value="84">84. Al-Inshiqaq (الانشقاق)</option>
                <option value="85">85. Al-Buruj (البروج)</option>
                <option value="86">86. At-Tariq (الطارق)</option>
                <option value="87">87. Al-A'la (الأعلى)</option>
                <option value="88">88. Al-Ghashiyah (الغاشية)</option>
                <option value="89">89. Al-Fajr (الفجر)</option>
                <option value="90">90. Al-Balad (البلد)</option>
                <option value="91">91. Ash-Shams (الشمس)</option>
                <option value="92">92. Al-Layl (الليل)</option>
                <option value="93">93. Ad-Duha (الضحى)</option>
                <option value="94">94. Ash-Sharh (الشرح)</option>
                <option value="95">95. At-Tin (التين)</option>
                <option value="96">96. Al-'Alaq (العلق)</option>
                <option value="97">97. Al-Qadr (القدر)</option>
                <option value="98">98. Al-Bayyinah (البينة)</option>
                <option value="99">99. Az-Zalzalah (الزلزلة)</option>
                <option value="100">100. Al-'Adiyat (العاديات)</option>
                <option value="101">101. Al-Qari'ah (القارعة)</option>
                <option value="102">102. At-Takathur (التكاثر)</option>
                <option value="103">103. Al-'Asr (العصر)</option>
                <option value="104">104. Al-Humazah (الهمزة)</option>
                <option value="105">105. Al-Fil (الفيل)</option>
                <option value="106">106. Quraysh (قريش)</option>
                <option value="107">107. Al-Ma'un (الماعون)</option>
                <option value="108">108. Al-Kawthar (الكوثر)</option>
                <option value="109">109. Al-Kafirun (الكافرون)</option>
                <option value="110">110. An-Nasr (النصر)</option>
                <option value="111">111. Al-Masad (المسد)</option>
                <option value="112">112. Al-Ikhlas (الإخلاص)</option>
                <option value="113">113. Al-Falaq (الفلق)</option>
                <option value="114">114. An-Nas (الناس)</option>
              </select>

              <button
                onClick={() => router.push('/home')}
                className="text-gray-600 hover:text-gray-800 transition-colors font-medium"
              >
                ← Terug naar Dashboard
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quran</h1>
                <p className="text-gray-600">Al-Quran Al-Kareem</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-gray-700 font-medium">
                Pagina {currentPage} van {totalPages}
              </div>
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
              >
                {showTranslation ? 'Verberg Vertaling' : 'Toon Vertaling'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quran.com Style Mushaf - Two Pages Side by Side */}
        <div className="flex justify-center">
          <div className={`bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 transition-all duration-500 ease-in-out ${isFlipping ? 'flip-page' : ''}`}
               style={{ 
                 width: '1800px', 
                 height: '1200px',
                 transform: isFlipping ? 'perspective(1000px) rotateY(90deg)' : 'perspective(1000px) rotateY(0deg)',
                 transformOrigin: 'right center'
               }}>
            {loadingPage ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-amber-600 mx-auto mb-4"></div>
                  <p className="text-amber-700 text-lg">Bezig met laden van Mushaf pagina...</p>
                </div>
              </div>
            ) : currentPageData ? (
              <div className="h-full flex relative bg-white">
                {/* Left Page (Page 2) */}
                <div className="w-1/2 h-full p-8 border-r border-gray-200 relative">
                  {/* Left Page Content */}
                  <div className="h-full">
                    {nextPageData ? (
                      <>
                        <div className="text-center mb-8 pb-4 border-b border-gray-200">
                          <h2 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Amiri, serif' }}>
                            {nextPageData.surahInfo.name}
                          </h2>
                          <p className="text-gray-600 text-lg">
                            {nextPageData.surahInfo.englishName}
                          </p>
                          {nextPageData.surahInfo.number !== 9 && nextPageData.verses[0]?.number === 1 && (
                            <div className="text-2xl text-gray-800 mt-4" style={{ fontFamily: 'Amiri, serif' }}>
                              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-6">
                          {nextPageData.verses.map((verse, index) => (
                            <div key={verse.number} className="relative mb-6">
                              <div className="flex-1">
                                <div className="text-3xl leading-relaxed text-gray-900 mb-4 text-right font-arabic" 
                                     style={{ 
                                       lineHeight: '4', 
                                       fontFamily: 'Amiri, serif',
                                       fontFeatureSettings: '"liga" 1'
                                     }}>
                                  {verse.text} ﴾{toArabicNumerals(verse.number)}﴿
                                </div>
                                {showTranslation && verse.translation && (
                                  <div className="text-gray-600 leading-relaxed text-base italic border-l-2 border-gray-300 pl-4">
                                    {verse.translation}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                          <div className="text-4xl mb-4">📖</div>
                          <p>Volgende pagina wordt geladen...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Left Page Footer */}
                  <div className="absolute bottom-4 left-8 right-8 text-center">
                    <div className="text-gray-500 text-sm">
                      Pagina {currentPage + 1}
                    </div>
                  </div>
                </div>

                {/* Right Page (Page 1) */}
                <div className="w-1/2 h-full p-8 relative">
                  {/* Right Page Content */}
                  <div className="h-full">
                    <div className="text-center mb-8 pb-4 border-b border-gray-200">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Amiri, serif' }}>
                        {currentPageData.surahInfo.name}
                      </h2>
                      <p className="text-gray-600 text-lg">
                        {currentPageData.surahInfo.englishName}
                      </p>
                      {currentPageData.surahInfo.number !== 9 && currentPageData.verses[0]?.number === 1 && (
                        <div className="text-2xl text-gray-800 mt-4" style={{ fontFamily: 'Amiri, serif' }}>
                          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-6">
                      {currentPageData.verses.map((verse, index) => (
                        <div key={verse.number} className="relative mb-6">
                          <div className="flex-1">
                            <div className="text-3xl leading-relaxed text-gray-900 mb-4 text-right font-arabic" 
                                 style={{ 
                                   lineHeight: '4', 
                                   fontFamily: 'Amiri, serif',
                                   fontFeatureSettings: '"liga" 1'
                                 }}>
                              {verse.text} ﴾{toArabicNumerals(verse.number)}﴿
                            </div>
                            {showTranslation && verse.translation && (
                              <div className="text-gray-600 leading-relaxed text-base italic border-l-2 border-gray-300 pl-4">
                                {verse.translation}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Right Page Footer */}
                  <div className="absolute bottom-4 left-8 right-8 text-center">
                    <div className="text-gray-500 text-sm">
                      Pagina {currentPage}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-amber-700">
                  <div className="text-6xl mb-4">📖</div>
                  <p className="text-xl">Mushaf pagina niet beschikbaar</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quran.com Style Navigation */}
        <div className="flex justify-center items-center mt-12 space-x-6">
          {/* Next Page Button (on the left for RTL) */}
          <button
            onClick={() => handlePageChange(currentPage + 2)}
            disabled={currentPage >= totalPages - 1}
            className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm font-medium"
          >
            <span>→</span>
            <span>Volgende</span>
          </button>
          
          {/* Page Number Display */}
          <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <span className="text-gray-700 text-sm">Pagina</span>
            <input
              type="number"
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value)
                if (page >= 1 && page <= totalPages) {
                  handlePageChange(page)
                }
              }}
              className="w-20 px-3 py-1 border border-gray-300 rounded text-center text-sm font-medium text-gray-900 bg-white"
              min="1"
              max={totalPages}
            />
            <span className="text-gray-700 text-sm">van {totalPages}</span>
          </div>
          
          {/* Previous Page Button (on the right for RTL) */}
          <button
            onClick={() => handlePageChange(currentPage - 2)}
            disabled={currentPage <= 2}
            className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm font-medium"
          >
            <span>Vorige</span>
            <span>←</span>
          </button>
        </div>

      </div>
      </main>
    </>
  )
}
