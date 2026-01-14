import { useState } from 'react'
import ProfitCalculator from './components/ProfitCalculator'
import SilverCalculator from './components/SilverCalculator'

type Material = 'gold' | 'silver'

function App() {
  const [material, setMaterial] = useState<Material>('gold')

  const getTitle = () => {
    if (material === 'silver') {
      return 'Gümüş Takı Kar Hesap'
    }
    return 'Altın Takı Kar Hesap'
  }

  const getIcon = () => {
    if (material === 'silver') {
      return (
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 shadow-xl shadow-slate-500/30 ring-4 ring-slate-400/20">
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

  return (
    <div className={`min-h-screen py-5 px-5 ${
      material === 'silver' 
        ? 'bg-gradient-to-br from-slate-50 via-slate-50/50 to-slate-100/70' 
        : 'bg-gradient-to-br from-slate-50 via-amber-50/50 to-yellow-50/70'
    }`}>
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-5">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {getIcon()}
            <h1 className={`text-4xl font-extrabold text-transparent bg-clip-text tracking-tight ${
              material === 'silver'
                ? 'bg-gradient-to-r from-slate-900 via-slate-600 to-slate-700'
                : 'bg-gradient-to-r from-slate-900 via-amber-600 to-yellow-700'
            }`}>
              {getTitle()}
            </h1>
          </div>
          
          {/* Malzeme Seçimi (Altın/Gümüş) */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => {
                setMaterial('gold')
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                material === 'gold'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Altın
            </button>
            <button
              onClick={() => {
                setMaterial('silver')
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                material === 'silver'
                  ? 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-500/30'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Gümüş
            </button>
          </div>

        </div>
        
        {material === 'silver' ? (
          <SilverCalculator onNavigateToGold={() => setMaterial('gold')} />
        ) : (
          <ProfitCalculator />
        )}
      </div>
    </div>
  )
}

export default App
