import { ProfitResult } from '../types'

interface ResultsTableProps {
  results: ProfitResult[]
}

function ResultsTable({ results }: ResultsTableProps) {
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
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {results.map((result, index) => {
            const profitBgColor =
              result.profitRate > 20
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30'
                : result.profitRate > 10
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30'
                : 'bg-gradient-to-r from-amber-600 to-red-500 shadow-lg shadow-amber-600/30'

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
                  <span className={`inline-block px-4 py-2 rounded-lg ${profitBgColor} text-white font-bold text-sm shadow-md shadow-black/10 hover:scale-105 transition-transform`}>
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
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default ResultsTable
