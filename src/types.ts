export interface ProductInfo {
  productGram: number
  laborMillem: number
  pureGoldGram: number
  laserCuttingEnabled: boolean
  laserCuttingMillem: number
}

export interface GoldInfo {
  goldPrice: number
  productAmount: number
  purchasePrice: number
}

export interface Expenses {
  shipping: number
  packaging: number
  eCommerceTax: number
  eCommerceTaxRate: number
  serviceFee: number
  extraChain: number
  specialPackaging: number
}

export interface Platform {
  name: string
  commissionRate: number
  salePrice: number
  targetProfitRate?: number // Standart senaryo için kâr oranı (%)
}

export interface ProfitResult {
  platform: string
  commissionRate: number
  salePrice: number
  commissionAmount: number
  totalExpenses: number
  netProfit: number
  profitRate: number
  bankayaYatan: number
}

