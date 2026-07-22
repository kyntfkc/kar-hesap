export const APP_DATA_CHANGED = 'appDataChanged'

export type AppSnapshot = {
  gold?: {
    appSettings?: unknown
    productInfo?: unknown
    goldInfo?: unknown
    expenses?: unknown
    platforms?: unknown
  }
  silver?: {
    appSettings?: unknown
    productInfo?: unknown
    silverInfo?: unknown
    expenses?: unknown
    platforms?: unknown
  }
  variant?: {
    variantReference?: unknown
    variantGroups?: unknown
  }
  ecommerceMilyem?: {
    goldPrice?: number
  }
  updatedAt?: number
}

function parseJson(key: string): unknown | undefined {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return undefined
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

function setJson(key: string, value: unknown) {
  if (value === undefined) return
  localStorage.setItem(key, JSON.stringify(value))
}

/** localStorage'tan tam snapshot oluştur */
export function buildLocalSnapshot(): AppSnapshot {
  const ecommerceRaw = localStorage.getItem('ecommerceGoldPrice')
  const ecommerceGoldPrice = ecommerceRaw != null ? Number(ecommerceRaw) : undefined

  return {
    gold: {
      appSettings: parseJson('goldAppSettings'),
      productInfo: parseJson('productInfo'),
      goldInfo: parseJson('goldInfo'),
      expenses: parseJson('expenses'),
      platforms: parseJson('platforms'),
    },
    silver: {
      appSettings: parseJson('silverAppSettings'),
      productInfo: parseJson('silverProductInfo'),
      silverInfo: parseJson('silverInfo'),
      expenses: parseJson('silverExpenses'),
      platforms: parseJson('silverPlatforms'),
    },
    variant: {
      variantReference: parseJson('variantReference'),
      variantGroups: parseJson('variantGroups'),
    },
    ecommerceMilyem: {
      goldPrice: Number.isFinite(ecommerceGoldPrice) ? ecommerceGoldPrice : undefined,
    },
    updatedAt: Date.now(),
  }
}

/** Uzak snapshot'ı localStorage anahtarlarına yaz */
export function applySnapshotToLocal(snapshot: AppSnapshot) {
  if (!snapshot || typeof snapshot !== 'object') return

  if (snapshot.gold) {
    setJson('goldAppSettings', snapshot.gold.appSettings)
    setJson('productInfo', snapshot.gold.productInfo)
    setJson('goldInfo', snapshot.gold.goldInfo)
    setJson('expenses', snapshot.gold.expenses)
    setJson('platforms', snapshot.gold.platforms)
  }
  if (snapshot.silver) {
    setJson('silverAppSettings', snapshot.silver.appSettings)
    setJson('silverProductInfo', snapshot.silver.productInfo)
    setJson('silverInfo', snapshot.silver.silverInfo)
    setJson('silverExpenses', snapshot.silver.expenses)
    setJson('silverPlatforms', snapshot.silver.platforms)
  }
  if (snapshot.variant) {
    setJson('variantReference', snapshot.variant.variantReference)
    setJson('variantGroups', snapshot.variant.variantGroups)
  }
  if (snapshot.ecommerceMilyem && snapshot.ecommerceMilyem.goldPrice != null) {
    localStorage.setItem('ecommerceGoldPrice', String(snapshot.ecommerceMilyem.goldPrice))
  }

  localStorage.setItem('appSnapshot', JSON.stringify(snapshot))
}

export function hasRemoteSnapshotData(snapshot: AppSnapshot | null | undefined): boolean {
  if (!snapshot || typeof snapshot !== 'object') return false
  return Boolean(
    snapshot.gold?.productInfo ||
    snapshot.gold?.platforms ||
    snapshot.silver?.productInfo ||
    snapshot.silver?.platforms ||
    snapshot.variant?.variantReference ||
    snapshot.ecommerceMilyem?.goldPrice != null
  )
}

export function notifyAppDataChanged() {
  window.dispatchEvent(new CustomEvent(APP_DATA_CHANGED))
}

/** localStorage yaz + sync tetikle */
export function cacheSet(key: string, value: string) {
  localStorage.setItem(key, value)
  notifyAppDataChanged()
}

export function cacheSetJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
  notifyAppDataChanged()
}
