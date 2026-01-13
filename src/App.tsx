import { useState } from 'react'
import ProfitCalculator from './components/ProfitCalculator'
import WholesaleCalculator from './components/WholesaleCalculator'
import { Store, Package } from 'lucide-react'

type Page = 'retail' | 'wholesale'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('retail')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/50 to-yellow-50/70 py-5 px-5">
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-5">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 shadow-xl shadow-amber-500/30 ring-4 ring-amber-400/20">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18"/>
                <path d="M7 14l4-4 3 3 6-6"/>
                <path d="M20 7h-4V3"/>
              </svg>
            </div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-amber-600 to-yellow-700 tracking-tight">
              {currentPage === 'retail' ? 'Altın Takı Kar Hesap' : 'Toptan Altın Satış'}
            </h1>
          </div>
          
          {/* Sayfa Geçiş Butonları */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => setCurrentPage('retail')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                currentPage === 'retail'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Store className="w-4 h-4" />
              Takı Satışı
            </button>
            <button
              onClick={() => setCurrentPage('wholesale')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                currentPage === 'wholesale'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Package className="w-4 h-4" />
              Toptan Satış
            </button>
          </div>
        </div>
        
        {currentPage === 'retail' ? (
          <ProfitCalculator onNavigateToWholesale={() => setCurrentPage('wholesale')} />
        ) : (
          <WholesaleCalculator onNavigateToRetail={() => setCurrentPage('retail')} />
        )}
      </div>
    </div>
  )
}

export default App
