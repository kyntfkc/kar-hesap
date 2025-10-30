import { memo } from 'react'
import { ProfitResult } from '../types'
import { formatNumber } from '../utils/format'

interface ResultsTableProps {
  results: ProfitResult[]
  onSaveScenario?: (result: ProfitResult) => void
}

function ResultsTableImpl({ results, onSaveScenario }: ResultsTableProps) {
  return (
    <div>
      <table className="w-full min-w-0 table-fixed">
        <thead>
          <tr className="border-b-2 border-slate-200/80 bg-gradient-to-r from-slate-50 via-blue-50/40 to-indigo-50/40">
            <th className="px-2 py-2 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
              Senaryo
            </th>
            <th className="px-2 py-2 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
              Satış Tutarı
            </th>
            <th className="px-2 py-2 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
              Komisyon
            </th>
            <th className="px-2 py-2 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
              Net Kazanç
            </th>
            <th className="px-2 py-2 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
              Kâr %
            </th>
            <th className="px-2 py-2 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
              Bankaya Yatan
            </th>
            {onSaveScenario && (
              <th className="px-2 py-2 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Kaydet</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {results.map((result, index) => {
            const nameLc = result.platform.toLowerCase()
            const isCampaign = nameLc.includes('kampanya') || nameLc.includes('kampanyalı') || nameLc.includes('promosyon')
            let profitBgColor = 'bg-gradient-to-r from-rose-400 to-red-500 shadow-md shadow-rose-300/30' // default: <10%
            const pr = result.profitRate
            if (isCampaign) {
              profitBgColor = 'bg-gradient-to-r from-sky-400 to-indigo-400 shadow-md shadow-sky-300/30'
            } else if (pr >= 20) {
              profitBgColor = 'bg-gradient-to-r from-emerald-400 to-green-500 shadow-md shadow-emerald-300/30'
            } else if (pr >= 15) {
              profitBgColor = 'bg-gradient-to-r from-yellow-300 to-yellow-400 shadow-md shadow-yellow-200/40'
            } else if (pr >= 10) {
              profitBgColor = 'bg-gradient-to-r from-orange-400 to-amber-400 shadow-md shadow-amber-300/30'
            } else {
              profitBgColor = 'bg-gradient-to-r from-rose-400 to-red-500 shadow-md shadow-rose-300/30'
            }

            const commissionDisplay = result.commissionAmount === 0 
              ? `${Math.round(result.commissionRate)}%`
              : `${formatNumber(result.commissionAmount)} TL`

            return (
              <tr key={index} className="hover:bg-blue-50/50 transition-all duration-200 border-b border-slate-100/80 group">
                <td className="px-2 py-2 whitespace-nowrap">
                  <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {result.platform}
                  </span>
                </td>
                <td className="px-2 py-2 whitespace-nowrap">
                  <span className="text-sm font-semibold text-slate-900">
                    {formatNumber(result.salePrice)} <span className="text-slate-500 font-medium">TL</span>
                  </span>
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-center">
                  <span className="text-sm font-medium text-slate-700">
                    {commissionDisplay}
                  </span>
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-center">
                  <span className={`inline-block px-4 py-2 rounded-lg ${profitBgColor} text-slate-800 font-bold text-sm hover:scale-105 transition-transform`}>
                    {formatNumber(result.netProfit)} TL
                  </span>
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-center">
                  <span className="text-base font-bold text-slate-900">
                    {Math.round(result.profitRate)}%
                  </span>
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-center">
                  <span className="text-sm font-semibold text-blue-900">
                    {formatNumber(result.bankayaYatan)} TL
                  </span>
                </td>
                {onSaveScenario && (
                  <td className="px-2 py-2 whitespace-nowrap text-right">
                    <button
                      onClick={() => onSaveScenario(result)}
                      className="text-xs px-2 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
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
