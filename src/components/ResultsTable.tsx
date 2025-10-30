import { memo } from 'react'
import { ProfitResult } from '../types'

interface ResultsTableProps {
  results: ProfitResult[]
  onSaveScenario?: (result: ProfitResult) => void
}

function ResultsTableImpl({ results, onSaveScenario }: ResultsTableProps) {
  return (
    <div>
      <table className="w-full min-w-0">
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
            const profitBgColor =
              result.profitRate > 20
                ? 'bg-gradient-to-r from-emerald-300 to-teal-300 shadow-md shadow-emerald-300/30'
                : result.profitRate > 10
                ? 'bg-gradient-to-r from-amber-300 to-orange-300 shadow-md shadow-amber-300/30'
                : 'bg-gradient-to-r from-rose-300 to-red-300 shadow-md shadow-rose-300/30'

            const commissionDisplay = result.commissionAmount === 0 
              ? `${result.commissionRate.toFixed(0)}%`
              : `${result.commissionAmount.toLocaleString('tr-TR', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })} TL`

            return (
              <tr key={index} className="hover:bg-blue-50/50 transition-all duration-200 border-b border-slate-100/80 group">
                <td className="px-2 py-2 whitespace-nowrap">
                  <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {result.platform}
                  </span>
                </td>
                <td className="px-2 py-2 whitespace-nowrap">
                  <span className="text-sm font-semibold text-slate-900">
                    {result.salePrice.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).replace(',', '.')}{' '}
                    <span className="text-slate-500 font-medium">TL</span>
                  </span>
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-center">
                  <span className="text-sm font-medium text-slate-700">
                    {commissionDisplay}
                  </span>
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-center">
                  <span className={`inline-block px-4 py-2 rounded-lg ${profitBgColor} text-slate-800 font-bold text-sm hover:scale-105 transition-transform`}>
                    {result.netProfit.toLocaleString('tr-TR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })} TL
                  </span>
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-center">
                  <span className="text-base font-bold text-slate-900">
                    {result.profitRate.toFixed(1).replace('.', ',')}%
                  </span>
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-center">
                  <span className="text-sm font-semibold text-blue-900">
                    {result.bankayaYatan.toLocaleString('tr-TR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })} TL
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
