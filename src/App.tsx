 
import ProfitCalculator from './components/ProfitCalculator'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 py-5 px-5">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl overflow-hidden mb-3 shadow-xl ring-4 ring-blue-500/5 bg-white">
            <img src="https://cdn.myikas.com/images/theme-images/77d0a753-cf57-4d75-bd02-483df087b978/image_540.webp" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-700 to-indigo-800 mb-1.5 tracking-tight">
            Kârlılık Hesaplayıcı
          </h1>
          {/* alt açıklama kaldırıldı */}
        </div>
        <ProfitCalculator />
      </div>
    </div>
  )
}

export default App
