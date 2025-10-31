import { memo } from 'react'
import { ProfitResult } from '../types'
import { formatNumber } from '../utils/format'

interface ResultsTableProps {
  results: ProfitResult[]
  onSaveScenario?: (result: ProfitResult) => void
  showCommission?: boolean
  showBank?: boolean
}

function ResultsTableImpl({ results, onSaveScenario, showCommission = false, showBank = false }: ResultsTableProps) {
  return (
    <div className="overflow-x-auto -mx-2 sm:mx-0">
      <table className="w-full min-w-[720px] sm:min-w-0 table-fixed">
        <thead>
          <tr className="border-b-2 border-slate-200/80 bg-gradient-to-r from-slate-50 via-blue-50/40 to-indigo-50/40">
            <th className="px-2 py-2 text-left text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
              Senaryo
            </th>
            <th className="px-2 py-2 text-left text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
              Satış Tutarı
            </th>
            {showCommission && (
              <th className="px-2 py-2 text-center text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                Komisyon
              </th>
            )}
            <th className="px-2 py-2 text-center text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
              Kâr %
            </th>
            <th className="px-2 py-2 text-center text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
              Optimum Skor
            </th>
            {showBank && (
              <th className="px-2 py-2 text-center text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                Bankaya Yatan
              </th>
            )}
            <th className="px-2 py-2 text-center text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
              Net Kazanç
            </th>
            {onSaveScenario && (
              <th className="px-2 py-2 text-right text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">Kaydet</th>
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
              profitBgColor = 'bg-gradient-to-r from-sky-400 to-indigo-400 shadow-md shadow-sky-300/30' // Kampanya
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
              <tr key={index} className="hover:bg-blue-50/50 transition-all duration-200 border-b border-slate-100/80 group">
                <td className="px-2 py-2 whitespace-nowrap">
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {result.platform}
                  </span>
                </td>
                <td className="px-2 py-2 whitespace-nowrap">
                  <span className="text-xs sm:text-sm font-semibold text-slate-900">
                    {formatNumber(result.salePrice)} <span className="text-slate-500 font-medium">TL</span>
                  </span>
                </td>
                {showCommission && (
                  <td className="px-2 py-2 whitespace-nowrap text-center">
                    <span className="text-xs sm:text-sm font-medium text-slate-700">
                      {commissionDisplay}
                    </span>
                  </td>
                )}
                <td className="px-2 py-2 whitespace-nowrap text-center">
                  <span className="text-sm sm:text-base font-bold text-slate-900">
                    {Math.round(result.profitRate)}%
                  </span>
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-center">
                  {result.optimumScore !== undefined ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`text-sm sm:text-base font-bold ${
                        isCampaign ? 'text-sky-600' :
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
                {showBank && (
                  <td className="px-2 py-2 whitespace-nowrap text-center">
                    <span className="text-xs sm:text-sm font-semibold text-blue-900">
                      {formatNumber(result.bankayaYatan)} TL
                    </span>
                  </td>
                )}
                <td className="px-2 py-2 whitespace-nowrap text-center">
                  <span className={`inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg ${profitBgColor} text-slate-800 font-bold text-xs sm:text-sm hover:scale-105 transition-transform`}>
                    {formatNumber(result.netProfit)} TL
                  </span>
                </td>
                {onSaveScenario && (
                  <td className="px-2 py-2 whitespace-nowrap text-right">
                    <button
                      onClick={() => onSaveScenario(result)}
                      className="btn-outline h-8 text-xs sm:text-sm"
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
  )
}
const ResultsTable = memo(ResultsTableImpl)
export default ResultsTable
