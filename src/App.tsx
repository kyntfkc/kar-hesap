 
import ProfitCalculator from './components/ProfitCalculator'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 py-5 px-5">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 mb-3 shadow-xl shadow-blue-500/25 ring-4 ring-blue-500/5">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18"/>
              <path d="M7 14l4-4 3 3 6-6"/>
              <path d="M20 7h-4V3"/>
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-700 to-indigo-800 mb-1.5 tracking-tight">
            Kâr Hesap
          </h1>
          {/* alt açıklama kaldırıldı */}
        </div>
        <ProfitCalculator />
      </div>
    </div>
  )
}

export default App
