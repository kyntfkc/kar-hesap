import { VariantPriceResult } from '../types'
import { formatNumber } from '../utils/format'

interface VariantPriceTableProps {
  results: VariantPriceResult[]
}

function VariantPriceTable({ results }: VariantPriceTableProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mb-4 shadow-lg shadow-emerald-200/30">
          <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-sm font-medium">Sonuçları görmek için hesapla butonuna tıklayın</p>
      </div>
    )
  }

  return (
    <>
      {/* Mobil Kart Görünümü */}
      <div className="md:hidden space-y-3">
        {results.map((result, index) => (
          <div
            key={index}
            className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200/80 ring-1 ring-slate-200/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {result.groupName}
                </h3>
                <span className="text-sm text-slate-600 font-medium">
                  {result.sizeRange} Ölçü
                </span>
              </div>
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-center shadow-md shadow-emerald-300/30">
                <div className="text-xs text-white/90 font-medium mb-1">Fiyat</div>
                <div className="text-2xl font-extrabold text-white">
                  {formatNumber(result.price)} <span className="text-lg">TL</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Tablo Görünümü */}
      <div className="hidden md:block overflow-x-auto -mx-2 sm:mx-0">
        <table className="w-full min-w-[600px] sm:min-w-0">
          <thead>
            <tr className="border-b-2 border-slate-200/80 bg-gradient-to-r from-slate-50 via-emerald-50/60 to-green-50/70">
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Ölçü Grubu
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                Ölçü Aralığı
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                Fiyat
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.map((result, index) => (
              <tr key={index} className="hover:bg-emerald-50/50 transition-all duration-200 border-b border-slate-100/80 group">
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {result.groupName}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span className="text-sm font-medium text-slate-700">
                    {result.sizeRange}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span className="inline-block px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-300/30">
                    {formatNumber(result.price)} TL
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default VariantPriceTable
