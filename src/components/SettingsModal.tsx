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
  const [draft, setDraft] = useState<Record<keyof AppSettings, string>>({
    defaultProductGram: String(initial.defaultProductGram),
    defaultGoldPrice: String(initial.defaultGoldPrice),
    defaultShipping: String(initial.defaultShipping),
    defaultPackaging: String(initial.defaultPackaging),
    defaultServiceFee: String(initial.defaultServiceFee),
    defaultETaxRate: String(initial.defaultETaxRate),
    defaultCommission: String(initial.defaultCommission),
    defaultStandardProfit: String(initial.defaultStandardProfit),
    defaultLinedProfit: String(initial.defaultLinedProfit),
    defaultLaborMillem: String(initial.defaultLaborMillem),
    defaultExtraCost: String(initial.defaultExtraCost),
  })

  useEffect(() => {
    setForm(initial)
    setDraft({
      defaultProductGram: String(initial.defaultProductGram),
      defaultGoldPrice: String(initial.defaultGoldPrice),
      defaultShipping: String(initial.defaultShipping),
      defaultPackaging: String(initial.defaultPackaging),
      defaultServiceFee: String(initial.defaultServiceFee),
      defaultETaxRate: String(initial.defaultETaxRate),
      defaultCommission: String(initial.defaultCommission),
      defaultStandardProfit: String(initial.defaultStandardProfit),
      defaultLinedProfit: String(initial.defaultLinedProfit),
      defaultLaborMillem: String(initial.defaultLaborMillem),
      defaultExtraCost: String(initial.defaultExtraCost),
    })
  }, [initial])

  if (!open) return null

  const setDraftValue = (key: keyof AppSettings, v: string) => {
    setDraft(prev => ({ ...prev, [key]: v }))
  }
  const commitNumber = (key: keyof AppSettings) => {
    const raw = draft[key]
    const n = parseFloat(raw)
    setForm(prev => ({ ...prev, [key]: isNaN(n) ? 0 : n }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 p-5">
        <h3 className="text-lg font-bold text-slate-900 mb-3">Ayarlar</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">İşçilik (milyem)</label>
            <input type="text" inputMode="decimal" value={draft.defaultLaborMillem}
              onChange={e=>setDraftValue('defaultLaborMillem', e.target.value)} onBlur={()=>commitNumber('defaultLaborMillem')}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">Varsayılan Ürün Gram</label>
            <input type="text" inputMode="decimal" value={draft.defaultProductGram}
              onChange={e=>setDraftValue('defaultProductGram', e.target.value)} onBlur={()=>commitNumber('defaultProductGram')}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">Varsayılan Altın Kuru</label>
            <input type="text" inputMode="numeric" value={draft.defaultGoldPrice}
              onChange={e=>setDraftValue('defaultGoldPrice', e.target.value)} onBlur={()=>commitNumber('defaultGoldPrice')}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">Kargo</label>
            <input type="text" inputMode="numeric" value={draft.defaultShipping}
              onChange={e=>setDraftValue('defaultShipping', e.target.value)} onBlur={()=>commitNumber('defaultShipping')}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">Ambalaj</label>
            <input type="text" inputMode="numeric" value={draft.defaultPackaging}
              onChange={e=>setDraftValue('defaultPackaging', e.target.value)} onBlur={()=>commitNumber('defaultPackaging')}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">Ekstra Maliyet Farkı (varsayılan)</label>
            <input type="text" inputMode="numeric" value={draft.defaultExtraCost}
              onChange={e=>setDraftValue('defaultExtraCost', e.target.value)} onBlur={()=>commitNumber('defaultExtraCost')}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">Hizmet Bedeli</label>
            <input type="text" inputMode="numeric" value={draft.defaultServiceFee}
              onChange={e=>setDraftValue('defaultServiceFee', e.target.value)} onBlur={()=>commitNumber('defaultServiceFee')}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">E-ticaret Stopajı (%)</label>
            <input type="text" inputMode="decimal" value={draft.defaultETaxRate}
              onChange={e=>setDraftValue('defaultETaxRate', e.target.value)} onBlur={()=>commitNumber('defaultETaxRate')}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">Komisyon (%)</label>
            <input type="text" inputMode="decimal" value={draft.defaultCommission}
              onChange={e=>setDraftValue('defaultCommission', e.target.value)} onBlur={()=>commitNumber('defaultCommission')}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">Standart Kâr Oranı (%)</label>
            <input type="text" inputMode="decimal" value={draft.defaultStandardProfit}
              onChange={e=>setDraftValue('defaultStandardProfit', e.target.value)} onBlur={()=>commitNumber('defaultStandardProfit')}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">Astarlı Ürün Kâr Oranı (%)</label>
            <input type="text" inputMode="decimal" value={draft.defaultLinedProfit}
              onChange={e=>setDraftValue('defaultLinedProfit', e.target.value)} onBlur={()=>commitNumber('defaultLinedProfit')}
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
            <button onClick={()=>onSave(form, applyNow)} className="px-3 py-1.5 text-sm rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all">Kaydet</button>
          </div>
        </div>
      </div>
    </div>
  )
}


