import { memo, useState } from 'react'
import { ProfitResult } from '../types'
import { formatNumber } from '../utils/format'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ResultsTableProps {
  results: ProfitResult[]
  onSaveScenario?: (result: ProfitResult) => void
  showCommission?: boolean
  showBank?: boolean
}

function ResultsTableImpl({ results, onSaveScenario, showCommission = false, showBank = false }: ResultsTableProps) {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())

  const toggleCard = (index: number) => {
    setExpandedCards(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  return (
    <>
      {/* Mobil Kart Görünümü */}
      <div className="md:hidden space-y-3">
        {results.map((result, index) => {
          const nameLc = result.platform.toLowerCase()
          const isCampaign = nameLc.includes('kampanya') || nameLc.includes('kampanyalı') || nameLc.includes('promosyon')
          const optimumScore = result.optimumScore ?? 0
          const isExpanded = expandedCards.has(index)
          
          // Optimum skor aralıklarına göre renkler
          let profitBgColor = 'bg-gradient-to-r from-rose-400 to-red-500 shadow-md shadow-rose-300/30'
          let scoreBgColor = 'bg-gradient-to-r from-rose-100 to-red-100'
          let scoreTextColor = 'text-red-700'
          let scoreLabel = 'Zayıf'
          
          if (isCampaign) {
            profitBgColor = 'bg-gradient-to-r from-slate-400 to-slate-600 shadow-md shadow-slate-300/30'
            scoreBgColor = 'bg-gradient-to-r from-slate-100 to-slate-200'
            scoreTextColor = 'text-slate-700'
            scoreLabel = 'Değişken'
          } else if (optimumScore >= 120) {
            profitBgColor = 'bg-gradient-to-r from-purple-400 to-purple-600 shadow-md shadow-purple-300/30'
            scoreBgColor = 'bg-gradient-to-r from-purple-100 to-purple-200'
            scoreTextColor = 'text-purple-700'
            scoreLabel = 'Aşırı'
          } else if (optimumScore >= 100) {
            profitBgColor = 'bg-gradient-to-r from-emerald-400 to-green-500 shadow-md shadow-emerald-300/30'
            scoreBgColor = 'bg-gradient-to-r from-emerald-100 to-green-100'
            scoreTextColor = 'text-emerald-700'
            scoreLabel = 'Mükemmel'
          } else if (optimumScore >= 80) {
            profitBgColor = 'bg-gradient-to-r from-blue-400 to-blue-600 shadow-md shadow-blue-300/30'
            scoreBgColor = 'bg-gradient-to-r from-blue-100 to-blue-200'
            scoreTextColor = 'text-blue-700'
            scoreLabel = 'İyi'
          } else if (optimumScore >= 60) {
            profitBgColor = 'bg-gradient-to-r from-yellow-300 to-yellow-400 shadow-md shadow-yellow-200/40'
            scoreBgColor = 'bg-gradient-to-r from-yellow-100 to-yellow-200'
            scoreTextColor = 'text-yellow-700'
            scoreLabel = 'Orta'
          }

          const commissionDisplay = result.commissionAmount === 0 
            ? `${Math.round(result.commissionRate)}%`
            : `${formatNumber(result.commissionAmount)} TL`

          return (
            <div
              key={index}
              className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200/80 ring-1 ring-slate-200/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/20"
            >
              {/* Ana Bilgiler - Her Zaman Görünür */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-base font-bold text-slate-900 flex-1">
                    {result.platform}
                  </h3>
                  <button
                    onClick={() => toggleCard(index)}
                    className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors touch-manipulation"
                    aria-label={isExpanded ? 'Detayları gizle' : 'Detayları göster'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-700" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-700" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  {/* Net Kazanç - Büyük ve Belirgin */}
                  <div className="col-span-2">
                    <div className={`${profitBgColor} rounded-xl p-4 text-center`}>
                      <div className="text-xs text-slate-700 font-medium mb-1">Net Kazanç</div>
                      <div className="text-2xl font-extrabold text-white">
                        {formatNumber(result.netProfit)} <span className="text-lg">TL</span>
                      </div>
                    </div>
                  </div>

                  {/* Kâr % */}
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-3 border border-amber-200/50">
                    <div className="text-xs text-slate-600 font-medium mb-1">Kâr %</div>
                    <div className="text-xl font-bold text-slate-900">
                      {Math.round(result.profitRate)}%
                    </div>
                  </div>

                  {/* Optimum Skor */}
                  <div className={`${scoreBgColor} rounded-xl p-3 border border-slate-200/50`}>
                    <div className="text-xs text-slate-600 font-medium mb-1">Optimum Skor</div>
                    {result.optimumScore !== undefined ? (
                      <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-bold ${scoreTextColor}`}>
                          {Math.round(result.optimumScore)}
                        </span>
                        <span className="text-xs text-slate-600 font-medium">{scoreLabel}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Genişletilebilir Detaylar */}
              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50/50 p-4 space-y-3 transition-all duration-300 ease-in-out">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <div className="text-xs text-slate-600 font-medium mb-1">Satış Tutarı</div>
                      <div className="text-base font-semibold text-slate-900">
                        {formatNumber(result.salePrice)} <span className="text-sm text-slate-500">TL</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <div className="text-xs text-slate-600 font-medium mb-1">Alış Fiyatı</div>
                      <div className="text-base font-semibold text-slate-900">
                        {formatNumber(result.purchasePrice)} <span className="text-sm text-slate-500">TL</span>
                      </div>
                    </div>

                    {showCommission && (
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="text-xs text-slate-600 font-medium mb-1">Komisyon</div>
                        <div className="text-base font-semibold text-slate-700">
                          {commissionDisplay}
                        </div>
                      </div>
                    )}

                    {showBank && (
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="text-xs text-slate-600 font-medium mb-1">Bankaya Yatan</div>
                        <div className="text-base font-semibold text-amber-800">
                          {formatNumber(result.bankayaYatan)} <span className="text-sm text-slate-500">TL</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {onSaveScenario && (
                    <button
                      onClick={() => onSaveScenario(result)}
                      className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Bu Senaryoyu Kaydet
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Desktop Tablo Görünümü */}
      <div className="hidden md:block overflow-x-auto -mx-2 sm:mx-0">
        <table className="w-full min-w-[900px] sm:min-w-0">
        <thead>
          <tr className="border-b-2 border-slate-200/80 bg-gradient-to-r from-slate-50 via-amber-50/60 to-yellow-50/70">
            <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-[120px]">
              Senaryo
            </th>
            {showCommission && (
              <>
                <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-[110px]">
                  Alış Fiyatı
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-[110px]">
                  Komisyon
                </th>
              </>
            )}
            <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-[80px]">
              Kâr %
            </th>
            <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-[120px]">
              Optimum Skor
            </th>
            <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-[130px]">
              Net Kazanç
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-[110px]">
              Satış Tutarı
            </th>
            {showBank && (
              <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-[130px]">
                Bankaya Yatan
              </th>
            )}
            {onSaveScenario && (
              <th className="px-3 py-2.5 text-right text-xs font-bold text-slate-700 uppercase tracking-wider w-[100px]">Kaydet</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {results.map((result, index) => {
            const nameLc = result.platform.toLowerCase()
            const isCampaign = nameLc.includes('kampanya') || nameLc.includes('kampanyalı') || nameLc.includes('promosyon')
            const optimumScore = result.optimumScore ?? 0
            
            // Optimum skor aralıklarına göre net kazanç rengi
            let profitBgColor = 'bg-gradient-to-r from-rose-400 to-red-500 shadow-md shadow-rose-300/30' // 0-60: Zayıf
            if (isCampaign) {
              profitBgColor = 'bg-gradient-to-r from-slate-400 to-slate-600 shadow-md shadow-slate-300/30' // Kampanya: Gri
            } else if (optimumScore >= 120) {
              profitBgColor = 'bg-gradient-to-r from-purple-400 to-purple-600 shadow-md shadow-purple-300/30' // 120+: Aşırı
            } else if (optimumScore >= 100) {
              profitBgColor = 'bg-gradient-to-r from-emerald-400 to-green-500 shadow-md shadow-emerald-300/30' // 100-120: Mükemmel
            } else if (optimumScore >= 80) {
              profitBgColor = 'bg-gradient-to-r from-blue-400 to-blue-600 shadow-md shadow-blue-300/30' // 80-100: İyi
            } else if (optimumScore >= 60) {
              profitBgColor = 'bg-gradient-to-r from-yellow-300 to-yellow-400 shadow-md shadow-yellow-200/40' // 60-80: Orta
            } else {
              profitBgColor = 'bg-gradient-to-r from-rose-400 to-red-500 shadow-md shadow-rose-300/30' // 0-60: Zayıf
            }

            const commissionDisplay = result.commissionAmount === 0 
              ? `${Math.round(result.commissionRate)}%`
              : `${formatNumber(result.commissionAmount)} TL`

            return (
              <tr key={index} className="hover:bg-amber-50/50 transition-all duration-200 border-b border-slate-100/80 group">
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">
                    {result.platform}
                  </span>
                </td>
                {showCommission && (
                  <>
                    <td className="px-3 py-2.5 whitespace-nowrap text-center">
                      <span className="text-xs sm:text-sm font-semibold text-slate-900">
                        {formatNumber(result.purchasePrice)} <span className="text-slate-500 font-medium">TL</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-center">
                      <span className="text-xs sm:text-sm font-medium text-slate-700">
                        {commissionDisplay}
                      </span>
                    </td>
                  </>
                )}
                <td className="px-3 py-2.5 whitespace-nowrap text-center">
                  <span className="text-sm sm:text-base font-bold text-slate-900">
                    {Math.round(result.profitRate)}%
                  </span>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-center">
                  {result.optimumScore !== undefined ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`text-sm sm:text-base font-bold ${
                        isCampaign ? 'text-slate-600' :
                        result.optimumScore >= 120 ? 'text-purple-600' :
                        result.optimumScore >= 100 ? 'text-emerald-600' :
                        result.optimumScore >= 80 ? 'text-blue-600' :
                        result.optimumScore >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {Math.round(result.optimumScore)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {isCampaign ? 'Değişken' :
                         result.optimumScore >= 120 ? 'Aşırı' :
                         result.optimumScore >= 100 ? 'Mükemmel' :
                         result.optimumScore >= 80 ? 'İyi' :
                         result.optimumScore >= 60 ? 'Orta' :
                         'Zayıf'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-center">
                  <span className={`inline-block px-2 py-1.5 rounded-lg ${profitBgColor} text-slate-800 font-bold text-xs sm:text-sm hover:scale-105 transition-transform whitespace-nowrap`}>
                    {formatNumber(result.netProfit)} TL
                  </span>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className="text-xs sm:text-sm font-semibold text-slate-900">
                    {formatNumber(result.salePrice)} <span className="text-slate-500 font-medium">TL</span>
                  </span>
                </td>
                {showBank && (
                  <td className="px-3 py-2.5 whitespace-nowrap text-center">
                    <span className="text-xs sm:text-sm font-semibold text-amber-800">
                      {formatNumber(result.bankayaYatan)} TL
                    </span>
                  </td>
                )}
                {onSaveScenario && (
                  <td className="px-3 py-2.5 whitespace-nowrap text-right">
                    <button
                      onClick={() => onSaveScenario(result)}
                      className="btn-outline h-8 text-xs sm:text-sm whitespace-nowrap"
                      title="Bu senaryoyu kaydet"
                    >
                      Kaydet
                    </button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
    </>
  )
}
const ResultsTable = memo(ResultsTableImpl)
export default ResultsTable
