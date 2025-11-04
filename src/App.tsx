 
import ProfitCalculator from './components/ProfitCalculator'

function App() {
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
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-amber-600 to-yellow-700 tracking-tight">Altın Takı Kar Hesap</h1>
          </div>
          {/* alt açıklama kaldırıldı */}
        </div>
        <ProfitCalculator />
      </div>
    </div>
  )
}

export default App
