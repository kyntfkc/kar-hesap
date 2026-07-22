import { useState, useEffect } from 'react'
import ProfitCalculator from './components/ProfitCalculator'
import SilverCalculator from './components/SilverCalculator'
import VariantPriceCalculator from './components/VariantPriceCalculator'
import EcommerceMilyemCalculator from './components/EcommerceMilyemCalculator'
import { apiEnabled, getSync, postSync } from './utils/api'
import {
  APP_DATA_CHANGED,
  AppSnapshot,
  applySnapshotToLocal,
  buildLocalSnapshot,
  hasRemoteSnapshotData,
} from './utils/appSnapshot'

type Tab = 'gold' | 'silver' | 'variant' | 'ecommerceMilyem'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('gold')
  const [ready, setReady] = useState(false)

  // Açılışta online hydrate; başarısızsa localStorage ile devam
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (apiEnabled) {
          const remote = (await getSync()) as AppSnapshot
          if (hasRemoteSnapshotData(remote)) {
            applySnapshotToLocal(remote)
          } else {
            // Uzakta veri yoksa mevcut local'i bir kez yükle
            const local = buildLocalSnapshot()
            if (hasRemoteSnapshotData(local)) {
              await postSync(local).catch(() => {})
            }
          }
        }
      } catch (err) {
        console.warn('Online hydrate failed, using local cache', err)
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Değişikliklerde debounce ile tam snapshot kaydet
  useEffect(() => {
    if (!ready || !apiEnabled) return

    let timer: ReturnType<typeof setTimeout> | null = null
    const onChange = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        const snapshot = buildLocalSnapshot()
        localStorage.setItem('appSnapshot', JSON.stringify(snapshot))
        postSync(snapshot).catch((err) => console.error('Sync error:', err))
      }, 1500)
    }

    window.addEventListener(APP_DATA_CHANGED, onChange)
    return () => {
      window.removeEventListener(APP_DATA_CHANGED, onChange)
      if (timer) clearTimeout(timer)
    }
  }, [ready])

  const getTitle = () => {
    if (activeTab === 'silver') {
      return 'Gümüş Takı Kar Hesap'
    }
    if (activeTab === 'variant') {
      return 'Varyant Fiyat Hesap'
    }
    if (activeTab === 'ecommerceMilyem') {
      return 'E-ticaret Milyemi'
    }
    return 'Altın Takı Kar Hesap'
  }

  const getIcon = () => {
    if (activeTab === 'silver') {
      return (
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-400 to-cyan-500 shadow-xl shadow-sky-400/30 ring-4 ring-sky-300/20">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"/>
            <path d="M7 14l4-4 3 3 6-6"/>
            <path d="M20 7h-4V3"/>
          </svg>
        </div>
      )
    }
    if (activeTab === 'variant') {
      return (
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 shadow-xl shadow-emerald-400/30 ring-4 ring-emerald-300/20">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"/>
            <path d="M7 14l4-4 3 3 6-6"/>
            <path d="M20 7h-4V3"/>
          </svg>
        </div>
      )
    }
    if (activeTab === 'ecommerceMilyem') {
      return (
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500 shadow-xl shadow-sky-500/25 ring-4 ring-sky-300/20">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"/>
            <path d="M7 14l4-4 3 3 6-6"/>
            <path d="M20 7h-4V3"/>
          </svg>
        </div>
      )
    }
    return (
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 shadow-xl shadow-amber-500/30 ring-4 ring-amber-400/20">
        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18"/>
          <path d="M7 14l4-4 3 3 6-6"/>
          <path d="M20 7h-4V3"/>
        </svg>
      </div>
    )
  }

  const getBackgroundClass = () => {
    if (activeTab === 'silver') {
      return 'bg-gradient-to-br from-sky-50 via-blue-50/50 to-cyan-50/70'
    }
    if (activeTab === 'variant') {
      return 'bg-gradient-to-br from-emerald-50 via-green-50/50 to-teal-50/70'
    }
    if (activeTab === 'ecommerceMilyem') {
      return 'bg-gradient-to-br from-sky-50 via-cyan-50/40 to-teal-50/60'
    }
    return 'bg-gradient-to-br from-slate-50 via-amber-50/50 to-yellow-50/70'
  }

  const getTitleGradient = () => {
    if (activeTab === 'silver') {
      return 'bg-gradient-to-r from-slate-900 via-sky-600 to-blue-600'
    }
    if (activeTab === 'variant') {
      return 'bg-gradient-to-r from-slate-800 via-emerald-600 to-teal-700'
    }
    if (activeTab === 'ecommerceMilyem') {
      return 'bg-gradient-to-r from-slate-900 via-sky-700 to-teal-700'
    }
    return 'bg-gradient-to-r from-slate-900 via-amber-600 to-yellow-700'
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-amber-50/50 to-yellow-50/70">
        <div className="text-sm font-semibold text-slate-600">Veriler yükleniyor…</div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen py-5 px-5 ${getBackgroundClass()}`}>
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-5">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {getIcon()}
            <h1 className={`text-4xl font-extrabold text-transparent bg-clip-text tracking-tight ${getTitleGradient()}`}>
              {getTitle()}
            </h1>
          </div>
          
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
            <button
              onClick={() => setActiveTab('gold')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'gold'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Altın
            </button>
            <button
              onClick={() => setActiveTab('silver')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'silver'
                  ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-lg shadow-sky-400/30'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Gümüş
            </button>
            <button
              onClick={() => setActiveTab('variant')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'variant'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Varyant Fiyat
            </button>
            <button
              onClick={() => setActiveTab('ecommerceMilyem')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'ecommerceMilyem'
                  ? 'bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 text-white shadow-lg shadow-sky-500/25'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 14l4-4 3 3 6-6"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7h-4V3"/></svg>
              E-ticaret Milyemi
            </button>
          </div>

        </div>
        
        {activeTab === 'silver' ? (
          <SilverCalculator onNavigateToGold={() => setActiveTab('gold')} />
        ) : activeTab === 'variant' ? (
          <VariantPriceCalculator />
        ) : activeTab === 'ecommerceMilyem' ? (
          <EcommerceMilyemCalculator />
        ) : (
          <ProfitCalculator />
        )}
      </div>
    </div>
  )
}

export default App
