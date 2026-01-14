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
  targetProfitRate?: number
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
  optimumScore?: number
}

export interface SavedCalculation {
  id: string
  name: string
  createdAt: number
  results: ProfitResult[]
}

export interface WholesaleInfo {
  gram: number
  goldPrice: number
  purchasePrice: number
}

export interface WholesaleExpenses {
  commission: number
  otherExpenses: number
}

export interface WholesalePlatform {
  name: string
  commissionRate: number
  salePrice: number
  targetProfitRate?: number
}

export interface WholesaleResult {
  platform: string
  commissionRate: number
  salePrice: number
  commissionAmount: number
  totalExpenses: number
  netProfit: number
  profitRate: number
  optimumScore?: number
}
export interface SilverProductInfo {
  productGram: number
  laborUsd: number
  pureSilverGram: number
  laserCuttingEnabled: boolean
  laserCuttingUsd: number
}

export interface SilverInfo {
  silverPrice: number
  usdTryRate: number
  productAmount: number
  purchasePrice: number
}

export interface SilverExpenses {
  shipping: number
  packaging: number
  eCommerceTax: number
  eCommerceTaxRate: number
  serviceFee: number
  extraChain: number
  specialPackaging: number
}

export interface SilverPlatform {
  name: string
  commissionRate: number
  salePrice: number
  targetProfitRate?: number
}

export interface SilverResult {
  platform: string
  commissionRate: number
  salePrice: number
  commissionAmount: number
  totalExpenses: number
  netProfit: number
  profitRate: number
  bankayaYatan: number
  optimumScore?: number
}
