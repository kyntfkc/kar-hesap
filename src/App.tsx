import { useState } from 'react'
import ProfitCalculator from './components/ProfitCalculator'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 py-5 px-5">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 mb-3 shadow-xl shadow-blue-500/25 ring-4 ring-blue-500/5">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-700 to-indigo-800 mb-1.5 tracking-tight">
            Kârlılık Hesaplayıcı
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Platform komisyon ve fiyat karşılaştırması
          </p>
        </div>
        <ProfitCalculator />
      </div>
    </div>
  )
}

export default App
