/** İndigo senaryo sabitleri (ayar modalında yok) */
export const INDIGO_COMMISSION = 15
export const INDIGO_PROFIT_GOLD = 20
export const INDIGO_PROFIT_SILVER = 30

export function readGoldAppSettings(): {
  defaultCommission: number
  defaultLinedProfit: number
  defaultStandardProfit: number
  defaultExtraCost: number
} {
  try {
    const saved = localStorage.getItem('goldAppSettings')
    if (!saved) {
      return { defaultCommission: 22, defaultLinedProfit: 20, defaultStandardProfit: 15, defaultExtraCost: 150 }
    }
    const parsed = JSON.parse(saved)
    return {
      defaultCommission: typeof parsed.defaultCommission === 'number' ? parsed.defaultCommission : 22,
      defaultLinedProfit: typeof parsed.defaultLinedProfit === 'number' ? parsed.defaultLinedProfit : 20,
      defaultStandardProfit: typeof parsed.defaultStandardProfit === 'number' ? parsed.defaultStandardProfit : 15,
      defaultExtraCost: typeof parsed.defaultExtraCost === 'number' ? parsed.defaultExtraCost : 150,
    }
  } catch {
    return { defaultCommission: 22, defaultLinedProfit: 20, defaultStandardProfit: 15, defaultExtraCost: 150 }
  }
}

export function readSilverAppSettings(): {
  defaultCommission: number
  defaultLinedProfit: number
  defaultStandardProfit: number
  defaultExtraCost: number
} {
  try {
    const saved = localStorage.getItem('silverAppSettings')
    if (!saved) {
      return { defaultCommission: 22, defaultLinedProfit: 20, defaultStandardProfit: 30, defaultExtraCost: 150 }
    }
    const parsed = JSON.parse(saved)
    return {
      defaultCommission: typeof parsed.defaultCommission === 'number' ? parsed.defaultCommission : 22,
      defaultLinedProfit: typeof parsed.defaultLinedProfit === 'number' ? parsed.defaultLinedProfit : 20,
      defaultStandardProfit: typeof parsed.defaultStandardProfit === 'number' ? parsed.defaultStandardProfit : 30,
      defaultExtraCost: typeof parsed.defaultExtraCost === 'number' ? parsed.defaultExtraCost : 150,
    }
  } catch {
    return { defaultCommission: 22, defaultLinedProfit: 20, defaultStandardProfit: 30, defaultExtraCost: 150 }
  }
}
