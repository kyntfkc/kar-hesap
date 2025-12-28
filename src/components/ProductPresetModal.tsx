import { useState, useEffect } from 'react'
import { ProductPreset, ProductInfo } from '../types'
import { X, Plus, Edit2, Trash2, Check, X as XIcon } from 'lucide-react'

interface ProductPresetModalProps {
  open: boolean
  presets: ProductPreset[]
  currentProductInfo: ProductInfo
  onClose: () => void
  onSave: (name: string) => void
  onUpdate: (id: string, name: string) => void
  onDelete: (id: string) => void
  onLoad: (preset: ProductPreset) => void
}

export default function ProductPresetModal({
  open,
  presets,
  currentProductInfo,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  onLoad,
}: ProductPresetModalProps) {
  const [newPresetName, setNewPresetName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setNewPresetName('')
      setEditingId(null)
      setEditName('')
      setDeleteConfirmId(null)
    }
  }, [open])

  if (!open) return null

  const handleStartEdit = (preset: ProductPreset) => {
    setEditingId(preset.id)
    setEditName(preset.name)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const handleConfirmEdit = (id: string) => {
    if (editName.trim()) {
      onUpdate(id, editName.trim())
      setEditingId(null)
      setEditName('')
    }
  }

  const handleSaveNew = () => {
    if (newPresetName.trim()) {
      onSave(newPresetName.trim())
      setNewPresetName('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Ürün Preset'leri</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Yeni Preset Ekleme */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-4 border border-amber-200/50">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Mevcut Değerleri Preset Olarak Kaydet
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveNew()
                }}
                placeholder="Preset adı (örn: Minik İkili)"
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <button
                onClick={handleSaveNew}
                disabled={!newPresetName.trim()}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-semibold rounded-lg hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Kaydet
              </button>
            </div>
          </div>

          {/* Preset Listesi */}
          {presets.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Henüz preset yok. Yukarıdan yeni preset ekleyebilirsiniz.
            </div>
          ) : (
            <div className="space-y-2">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="bg-white border border-slate-200 rounded-lg p-3 hover:border-amber-300 transition-colors"
                >
                  {editingId === preset.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmEdit(preset.id)
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                        className="flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleConfirmEdit(preset.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onLoad(preset)}
                        className="flex-1 text-left px-3 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 rounded-lg border border-amber-200/50 transition-all group"
                      >
                        <div className="font-semibold text-slate-900 group-hover:text-amber-700">
                          {preset.name}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {preset.productInfo.productGram.toFixed(2)}g • İşçilik: {preset.productInfo.laborMillem} •{' '}
                          {preset.productInfo.laserCuttingEnabled ? 'Lazer: Açık' : 'Lazer: Kapalı'}
                        </div>
                      </button>
                      <button
                        onClick={() => handleStartEdit(preset)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {deleteConfirmId === preset.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              onDelete(preset.id)
                              setDeleteConfirmId(null)
                            }}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                            title="Sil"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(preset.id)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 text-red-600 hover:bg-red-50 transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

