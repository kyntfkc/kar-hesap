import { useState, useEffect } from 'react'

export interface AppSettings {
  defaultProductGram: number
  defaultGoldPrice: number
  defaultShipping: number
  defaultPackaging: number
  defaultServiceFee: number
  defaultETaxRate: number
  defaultCommission: number
  defaultStandardProfit: number
  defaultLinedProfit: number
  defaultLaborMillem: number
  defaultExtraCost: number
}

interface SettingsModalProps {
  open: boolean
  initial: AppSettings
  onClose: () => void
  onSave: (settings: AppSettings, applyNow: boolean) => void
}

export default function SettingsModal({ open, initial, onClose, onSave }: SettingsModalProps) {
  const [form, setForm] = useState<AppSettings>(initial)
  const [applyNow, setApplyNow] = useState(true)

  useEffect(() => {
    setForm(initial)
  }, [initial])

  if (!open) return null

  const update = (key: keyof AppSettings, value: number) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const numberOr = (v: string, fallback: number) => {
    const n = parseFloat(v)
    return isNaN(n) ? fallback : n
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 p-5">
        <h3 className="text-lg font-bold text-slate-900 mb-3">Ayarlar</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">İşçilik (milyem)</label>
            <input type="number" step="0.001" value={form.defaultLaborMillem}
              onChange={e=>update('defaultLaborMillem', numberOr(e.target.value, form.defaultLaborMillem))}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">Varsayılan Ürün Gram</label>
            <input type="number" step="0.01" value={form.defaultProductGram}
              onChange={e=>update('defaultProductGram', numberOr(e.target.value, form.defaultProductGram))}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">Varsayılan Altın Kuru</label>
            <input type="number" step="0.01" value={form.defaultGoldPrice}
              onChange={e=>update('defaultGoldPrice', numberOr(e.target.value, form.defaultGoldPrice))}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">Kargo</label>
            <input type="number" step="1" value={form.defaultShipping}
              onChange={e=>update('defaultShipping', numberOr(e.target.value, form.defaultShipping))}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">Ambalaj</label>
            <input type="number" step="1" value={form.defaultPackaging}
              onChange={e=>update('defaultPackaging', numberOr(e.target.value, form.defaultPackaging))}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">Ekstra Maliyet Farkı (varsayılan)</label>
            <input type="number" step="1" value={form.defaultExtraCost}
              onChange={e=>update('defaultExtraCost', numberOr(e.target.value, form.defaultExtraCost))}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">Hizmet Bedeli</label>
            <input type="number" step="1" value={form.defaultServiceFee}
              onChange={e=>update('defaultServiceFee', numberOr(e.target.value, form.defaultServiceFee))}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">E-ticaret Stopajı (%)</label>
            <input type="number" step="0.01" value={form.defaultETaxRate}
              onChange={e=>update('defaultETaxRate', numberOr(e.target.value, form.defaultETaxRate))}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">Komisyon (%)</label>
            <input type="number" step="0.1" value={form.defaultCommission}
              onChange={e=>update('defaultCommission', numberOr(e.target.value, form.defaultCommission))}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">Standart Kâr Oranı (%)</label>
            <input type="number" step="0.1" value={form.defaultStandardProfit}
              onChange={e=>update('defaultStandardProfit', numberOr(e.target.value, form.defaultStandardProfit))}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">Astarlı Ürün Kâr Oranı (%)</label>
            <input type="number" step="0.1" value={form.defaultLinedProfit}
              onChange={e=>update('defaultLinedProfit', numberOr(e.target.value, form.defaultLinedProfit))}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={applyNow} onChange={e=>setApplyNow(e.target.checked)} />
            Kaydet ve mevcut değerlere uygula
          </label>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-lg border border-slate-300">İptal</button>
            <button onClick={()=>onSave(form, applyNow)} className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white">Kaydet</button>
          </div>
        </div>
      </div>
    </div>
  )
}


