import { ProductInfo, GoldInfo, Expenses, Platform, ProfitResult, WholesaleInfo, WholesaleExpenses, WholesalePlatform, WholesaleResult, SilverProductInfo, SilverInfo, SilverExpenses, SilverPlatform, SilverResult } from '../types'

// 14 ayar milyem sabit değeri
const AYAR_14_MILLEM = 0.585

// Ondalık sayı hassasiyet sorunlarını düzeltmek için yardımcı fonksiyonlar
function roundToDecimals(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round((value + Number.EPSILON) * factor) / factor
}

function roundToTwoDecimals(value: number): number {
  return roundToDecimals(value, 2)
}

function roundToFourDecimals(value: number): number {
  return roundToDecimals(value, 4)
}

// Has Gram hesaplama: (İşçilik milyemi + Lazer Kesim milyemi + 14 ayar milyem) × Ürün Gramı
export function calculatePureGoldGram(productInfo: ProductInfo): number {
  const totalLaborMillem = productInfo.laborMillem + (productInfo.laserCuttingEnabled ? productInfo.laserCuttingMillem : 0)
  const result = (totalLaborMillem + AYAR_14_MILLEM) * productInfo.productGram
  return roundToFourDecimals(result)
}

// Ürün Tutarı hesaplama: Has Gram × Altın Kuru
export function calculateProductAmount(pureGoldGram: number, goldPrice: number): number {
  const result = pureGoldGram * goldPrice
  return roundToTwoDecimals(result)
}

// Alış Fiyatı hesaplama: Ürün Tutarı (işçilik maliyeti ayrı bir gider olarak sayılmıyor, Has Gram'da dahil)
// Görseldeki mantığa göre: Alış Fiyatı = Ürün Tutarı (işçilik dahil Has Gram üzerinden hesaplanıyor)
export function calculatePurchasePrice(
  productAmount: number
): number {
  // Görseldeki mantığa göre: Ürün Tutarı zaten Has Gram × Altın Kuru olarak hesaplanıyor
  // Has Gram'da işçilik milyemi dahil, dolayısıyla işçilik maliyeti eklenmiyor
  return productAmount
}

export function calculateProfit(
  productInfo: ProductInfo,
  goldInfo: GoldInfo,
  expenses: Expenses,
  platform: Platform
): ProfitResult {
  // Has Gram hesapla
  const pureGoldGram = calculatePureGoldGram(productInfo)
  
  // Ürün Tutarı hesapla
  const productAmount = calculateProductAmount(pureGoldGram, goldInfo.goldPrice)
  
  // Toplam işçilik milyemi (normal + lazer kesim)
  const totalLaborMillem = productInfo.laborMillem + (productInfo.laserCuttingEnabled ? productInfo.laserCuttingMillem : 0)
  
  // Alış Fiyatı hesapla
  const purchasePrice = calculatePurchasePrice(productAmount)
  
  // Komisyon Tutarı: Satış Tutarı × Komisyon Oranı / 100
  const commissionAmount = roundToTwoDecimals((platform.salePrice * platform.commissionRate) / 100)
  
  // E-ticaret Stopajı: Satış Tutarı × (eCommerceTaxRate / 100) (her senaryo için farklı)
  const eCommerceTaxRate = expenses.eCommerceTaxRate || 1.00
  const eCommerceTaxAmount = roundToTwoDecimals(platform.salePrice * (eCommerceTaxRate / 100))
  
  // Masraf Toplamı: Kargo + Ambalaj + Stopaj + Hizmet + Ekstra Zincir + Işıklı Kutu
  const totalExpenses = roundToTwoDecimals(
    expenses.shipping +
    expenses.packaging +
    eCommerceTaxAmount + // Stopaj satış tutarına göre hesaplanıyor
    expenses.serviceFee +
    expenses.extraChain +
    expenses.specialPackaging
  )
  
  // Toplam Maliyet: Alış Fiyatı + Masraf Toplamı + Komisyon Tutarı
  const totalCost = roundToTwoDecimals(purchasePrice + totalExpenses + commissionAmount)
  
  // Kazanç: Satış Tutarı - Toplam Maliyet
  const netProfit = roundToTwoDecimals(platform.salePrice - totalCost)
  
  // Kâr %: (Kazanç ÷ Satış Tutarı) × 100
  const profitRate = roundToFourDecimals((netProfit / platform.salePrice) * 100)

  // Bankaya yatan: Satış Tutarı - (Komisyon + Kargo + Stopaj)
  const bankayaYatan = roundToTwoDecimals(platform.salePrice - (commissionAmount + expenses.shipping + eCommerceTaxAmount))

  // Optimum Skor Hesaplama: (Kâr % / 15) × Satış Fiyatı Katsayısı × 100
  // Satış Fiyatı Katsayısı = Mevcut Satış Fiyatı / Standart Satış Fiyatı (%15 kâr ile)
  const standardSalePrice = calculateStandardSalePrice(
    productInfo,
    goldInfo,
    expenses,
    platform.commissionRate,
    15 // %15 kâr referans olarak
  )
  const salePriceCoefficient = standardSalePrice > 0 ? roundToFourDecimals(platform.salePrice / standardSalePrice) : 1
  const optimumScore = roundToTwoDecimals((profitRate / 15) * salePriceCoefficient * 100)

  return {
    platform: platform.name,
    commissionRate: platform.commissionRate,
    salePrice: platform.salePrice,
    commissionAmount,
    totalExpenses,
    netProfit,
    profitRate,
    bankayaYatan,
    purchasePrice,
    optimumScore
  }
}

export function calculateAllPlatforms(
  productInfo: ProductInfo,
  goldInfo: GoldInfo,
  expenses: Expenses,
  platforms: Platform[]
): ProfitResult[] {
  // Özel sıralama: Standart ilk, sonra Senaryo 1, Senaryo 2, vb.
  const sortedPlatforms = [...platforms].sort((a, b) => {
    // Standart her zaman ilk
    if (a.name === 'Standart') return -1
    if (b.name === 'Standart') return 1
    
    // Senaryo numaralarına göre sırala
    const getScenarioNumber = (name: string): number => {
      const match = name.match(/Senaryo (\d+)/)
      return match ? parseInt(match[1]) : Infinity
    }
    
    const numA = getScenarioNumber(a.name)
    const numB = getScenarioNumber(b.name)
    
    if (numA !== Infinity && numB !== Infinity) {
      return numA - numB
    }
    
    // Senaryo olmayan diğer isimler alfabetik sırada
    return a.name.localeCompare(b.name)
  })
  
  return sortedPlatforms.map(platform => 
    calculateProfit(productInfo, goldInfo, expenses, platform)
  )
}

// Standart senaryo için satış fiyatını hesapla (masraflar, komisyon ve kâr dahil)
export function calculateStandardSalePrice(
  productInfo: ProductInfo,
  goldInfo: GoldInfo,
  expenses: Expenses,
  commissionRate: number = 22,
  targetProfitRate: number = 15 // Hedef kâr oranı (%)
): number {
  // Has Gram hesapla
  const pureGoldGram = calculatePureGoldGram(productInfo)
  
  // Ürün Tutarı hesapla
  const productAmount = calculateProductAmount(pureGoldGram, goldInfo.goldPrice)
  
  // Toplam işçilik milyemi (normal + lazer kesim)
  const totalLaborMillem = productInfo.laborMillem + (productInfo.laserCuttingEnabled ? productInfo.laserCuttingMillem : 0)
  
  // Alış Fiyatı hesapla
  const purchasePrice = calculatePurchasePrice(productAmount)
  
  // Sabit masraflar (stopaj hariç)
  const fixedExpenses = 
    expenses.shipping +
    expenses.packaging +
    expenses.serviceFee +
    expenses.extraChain +
    expenses.specialPackaging
  
  // Stopaj oranı
  const eCommerceTaxRate = expenses.eCommerceTaxRate || 1.00
  
  // Formül: Satış Fiyatı = (Alış Fiyatı + Sabit Masraflar) / (1 - Stopaj Oranı/100 - Komisyon Oranı/100 - Kâr Oranı/100)
  const denominator = roundToFourDecimals(1 - (eCommerceTaxRate / 100) - (commissionRate / 100) - (targetProfitRate / 100))
  
  // Payda sıfır veya negatif olmamalı
  if (denominator <= 0) {
    // Fallback: Eski yöntem (en azından bir değer döndürmek için)
    const fallback = roundToTwoDecimals(productInfo.productGram * goldInfo.goldPrice * 1.2)
    return Math.ceil(fallback)
  }
  
  const calculatedSalePrice = roundToTwoDecimals((purchasePrice + fixedExpenses) / denominator)
  
  // Alt sınır yok; doğrudan yukarı yuvarla
  return Math.ceil(calculatedSalePrice)
}

// Toptan Satış Hesaplama Fonksiyonları

// Toptan satış için alış fiyatı: Gram × Altın Kuru
export function calculateWholesalePurchasePrice(gram: number, goldPrice: number): number {
  return roundToTwoDecimals(gram * goldPrice)
}

// Toptan satış kâr hesaplama
export function calculateWholesaleProfit(
  wholesaleInfo: WholesaleInfo,
  expenses: WholesaleExpenses,
  platform: WholesalePlatform
): WholesaleResult {
  // Alış Fiyatı: Gram × Altın Kuru
  const purchasePrice = calculateWholesalePurchasePrice(wholesaleInfo.gram, wholesaleInfo.goldPrice)
  
  // Komisyon Tutarı: Satış Tutarı × Komisyon Oranı / 100
  const commissionAmount = roundToTwoDecimals((platform.salePrice * platform.commissionRate) / 100)
  
  // Toplam Masraflar: Komisyon + Diğer Masraflar
  const totalExpenses = roundToTwoDecimals(commissionAmount + expenses.otherExpenses)
  
  // Toplam Maliyet: Alış Fiyatı + Toplam Masraflar
  const totalCost = roundToTwoDecimals(purchasePrice + totalExpenses)
  
  // Net Kazanç: Satış Tutarı - Toplam Maliyet
  const netProfit = roundToTwoDecimals(platform.salePrice - totalCost)
  
  // Kâr %: (Net Kazanç ÷ Satış Tutarı) × 100
  const profitRate = roundToFourDecimals((netProfit / platform.salePrice) * 100)
  
  // Optimum Skor Hesaplama: (Kâr % / 15) × Satış Fiyatı Katsayısı × 100
  const standardSalePrice = calculateWholesaleStandardSalePrice(
    wholesaleInfo,
    expenses,
    platform.commissionRate,
    15 // %15 kâr referans olarak
  )
  const salePriceCoefficient = standardSalePrice > 0 ? roundToFourDecimals(platform.salePrice / standardSalePrice) : 1
  const optimumScore = roundToTwoDecimals((profitRate / 15) * salePriceCoefficient * 100)
  
  return {
    platform: platform.name,
    commissionRate: platform.commissionRate,
    salePrice: platform.salePrice,
    commissionAmount,
    totalExpenses,
    netProfit,
    profitRate,
    purchasePrice,
    optimumScore
  }
}

// Tüm platformlar için toptan satış hesaplama
export function calculateAllWholesalePlatforms(
  wholesaleInfo: WholesaleInfo,
  expenses: WholesaleExpenses,
  platforms: WholesalePlatform[]
): WholesaleResult[] {
  // Özel sıralama: Standart ilk, sonra Senaryo 1, Senaryo 2, vb.
  const sortedPlatforms = [...platforms].sort((a, b) => {
    if (a.name === 'Standart') return -1
    if (b.name === 'Standart') return 1
    
    const getScenarioNumber = (name: string): number => {
      const match = name.match(/Senaryo (\d+)/)
      return match ? parseInt(match[1]) : Infinity
    }
    
    const numA = getScenarioNumber(a.name)
    const numB = getScenarioNumber(b.name)
    
    if (numA !== Infinity && numB !== Infinity) {
      return numA - numB
    }
    
    return a.name.localeCompare(b.name)
  })
  
  return sortedPlatforms.map(platform => 
    calculateWholesaleProfit(wholesaleInfo, expenses, platform)
  )
}

// Toptan satış için standart satış fiyatı hesaplama
export function calculateWholesaleStandardSalePrice(
  wholesaleInfo: WholesaleInfo,
  expenses: WholesaleExpenses,
  commissionRate: number = 2, // Toptan satışta genelde düşük komisyon
  targetProfitRate: number = 5 // Toptan satışta düşük kâr oranı
): number {
  // Alış Fiyatı
  const purchasePrice = calculateWholesalePurchasePrice(wholesaleInfo.gram, wholesaleInfo.goldPrice)
  
  // Sabit masraflar (komisyon hariç)
  const fixedExpenses = expenses.otherExpenses
  
  // Formül: Satış Fiyatı = (Alış Fiyatı + Sabit Masraflar) / (1 - Komisyon Oranı/100 - Kâr Oranı/100)
  const denominator = roundToFourDecimals(1 - (commissionRate / 100) - (targetProfitRate / 100))
  
  if (denominator <= 0) {
    const fallback = roundToTwoDecimals(purchasePrice * 1.1)
    return Math.ceil(fallback)
  }
  
  const calculatedSalePrice = roundToTwoDecimals((purchasePrice + fixedExpenses) / denominator)
  return Math.ceil(calculatedSalePrice)
}

// Gümüş Hesaplama Fonksiyonları

// 925 ayar gümüş milyem sabit değeri
const AYAR_925_MILLEM = 0.925

// Has Gümüş Gram hesaplama: (925 ayar milyemi) × Ürün Gramı
// Not: Gümüşte işçilik milyemi yok, sadece 925 ayar kullanılıyor
export function calculatePureSilverGram(productInfo: SilverProductInfo): number {
  const result = AYAR_925_MILLEM * productInfo.productGram
  return roundToFourDecimals(result)
}

// Ürün Tutarı hesaplama: Has Gümüş Gram × Gümüş Kuru
export function calculateSilverProductAmount(pureSilverGram: number, silverPrice: number): number {
  const result = pureSilverGram * silverPrice
  return roundToTwoDecimals(result)
}

// İşçilik Maliyeti hesaplama: (İşçilik USD + Lazer Kesim USD) × USD/TRY Kuru
export function calculateSilverLaborCost(productInfo: SilverProductInfo, usdTryRate: number): number {
  const totalLaborUsd = productInfo.laborUsd + (productInfo.laserCuttingEnabled ? productInfo.laserCuttingUsd : 0)
  const result = totalLaborUsd * usdTryRate
  return roundToTwoDecimals(result)
}

// Alış Fiyatı hesaplama: Ürün Tutarı + İşçilik Maliyeti
export function calculateSilverPurchasePrice(
  productAmount: number,
  laborCost: number
): number {
  return roundToTwoDecimals(productAmount + laborCost)
}

// Gümüş kar hesaplama
export function calculateSilverProfit(
  productInfo: SilverProductInfo,
  silverInfo: SilverInfo,
  expenses: SilverExpenses,
  platform: SilverPlatform
): SilverResult {
  // Has Gümüş Gram hesapla
  const pureSilverGram = calculatePureSilverGram(productInfo)
  
  // Ürün Tutarı hesapla
  const productAmount = calculateSilverProductAmount(pureSilverGram, silverInfo.silverPrice)
  
  // İşçilik Maliyeti hesapla
  const laborCost = calculateSilverLaborCost(productInfo, silverInfo.usdTryRate)
  
  // Alış Fiyatı hesapla
  const purchasePrice = calculateSilverPurchasePrice(productAmount, laborCost)
  
  // Komisyon Tutarı: Satış Tutarı × Komisyon Oranı / 100
  const commissionAmount = roundToTwoDecimals((platform.salePrice * platform.commissionRate) / 100)
  
  // E-ticaret Stopajı: Satış Tutarı × (eCommerceTaxRate / 100)
  const eCommerceTaxRate = expenses.eCommerceTaxRate || 1.00
  const eCommerceTaxAmount = roundToTwoDecimals(platform.salePrice * (eCommerceTaxRate / 100))
  
  // Masraf Toplamı: Kargo + Ambalaj + Stopaj + Hizmet + Ekstra Zincir + Işıklı Kutu
  const totalExpenses = roundToTwoDecimals(
    expenses.shipping +
    expenses.packaging +
    eCommerceTaxAmount +
    expenses.serviceFee +
    expenses.extraChain +
    expenses.specialPackaging
  )
  
  // Toplam Maliyet: Alış Fiyatı + Masraf Toplamı + Komisyon Tutarı
  const totalCost = roundToTwoDecimals(purchasePrice + totalExpenses + commissionAmount)
  
  // Kazanç: Satış Tutarı - Toplam Maliyet
  const netProfit = roundToTwoDecimals(platform.salePrice - totalCost)
  
  // Kâr %: (Kazanç ÷ Satış Tutarı) × 100
  const profitRate = roundToFourDecimals((netProfit / platform.salePrice) * 100)

  // Bankaya yatan: Satış Tutarı - (Komisyon + Kargo + Stopaj)
  const bankayaYatan = roundToTwoDecimals(platform.salePrice - (commissionAmount + expenses.shipping + eCommerceTaxAmount))

  // Optimum Skor Hesaplama: (Kâr % / 15) × Satış Fiyatı Katsayısı × 100
  const standardSalePrice = calculateSilverStandardSalePrice(
    productInfo,
    silverInfo,
    expenses,
    platform.commissionRate,
    15 // %15 kâr referans olarak
  )
  const salePriceCoefficient = standardSalePrice > 0 ? roundToFourDecimals(platform.salePrice / standardSalePrice) : 1
  const optimumScore = roundToTwoDecimals((profitRate / 15) * salePriceCoefficient * 100)

  return {
    platform: platform.name,
    commissionRate: platform.commissionRate,
    salePrice: platform.salePrice,
    commissionAmount,
    totalExpenses,
    netProfit,
    profitRate,
    bankayaYatan,
    purchasePrice,
    optimumScore
  }
}

// Tüm platformlar için gümüş hesaplama
export function calculateAllSilverPlatforms(
  productInfo: SilverProductInfo,
  silverInfo: SilverInfo,
  expenses: SilverExpenses,
  platforms: SilverPlatform[]
): SilverResult[] {
  // Özel sıralama: Standart ilk, sonra Senaryo 1, Senaryo 2, vb.
  const sortedPlatforms = [...platforms].sort((a, b) => {
    // Standart her zaman ilk
    if (a.name === 'Standart') return -1
    if (b.name === 'Standart') return 1
    
    // Senaryo numaralarına göre sırala
    const getScenarioNumber = (name: string): number => {
      const match = name.match(/Senaryo (\d+)/)
      return match ? parseInt(match[1]) : Infinity
    }
    
    const numA = getScenarioNumber(a.name)
    const numB = getScenarioNumber(b.name)
    
    if (numA !== Infinity && numB !== Infinity) {
      return numA - numB
    }
    
    // Senaryo olmayan diğer isimler alfabetik sırada
    return a.name.localeCompare(b.name)
  })
  
  return sortedPlatforms.map(platform => 
    calculateSilverProfit(productInfo, silverInfo, expenses, platform)
  )
}

// Gümüş için standart satış fiyatını hesapla
export function calculateSilverStandardSalePrice(
  productInfo: SilverProductInfo,
  silverInfo: SilverInfo,
  expenses: SilverExpenses,
  commissionRate: number = 22,
  targetProfitRate: number = 15 // Hedef kâr oranı (%)
): number {
  // Has Gümüş Gram hesapla
  const pureSilverGram = calculatePureSilverGram(productInfo)
  
  // Ürün Tutarı hesapla
  const productAmount = calculateSilverProductAmount(pureSilverGram, silverInfo.silverPrice)
  
  // İşçilik Maliyeti hesapla
  const laborCost = calculateSilverLaborCost(productInfo, silverInfo.usdTryRate)
  
  // Alış Fiyatı hesapla
  const purchasePrice = calculateSilverPurchasePrice(productAmount, laborCost)
  
  // Sabit masraflar (stopaj hariç)
  const fixedExpenses = 
    expenses.shipping +
    expenses.packaging +
    expenses.serviceFee +
    expenses.extraChain +
    expenses.specialPackaging
  
  // Stopaj oranı
  const eCommerceTaxRate = expenses.eCommerceTaxRate || 1.00
  
  // Formül: Satış Fiyatı = (Alış Fiyatı + Sabit Masraflar) / (1 - Stopaj Oranı/100 - Komisyon Oranı/100 - Kâr Oranı/100)
  const denominator = roundToFourDecimals(1 - (eCommerceTaxRate / 100) - (commissionRate / 100) - (targetProfitRate / 100))
  
  // Payda sıfır veya negatif olmamalı
  if (denominator <= 0) {
    // Fallback: Eski yöntem
    const fallback = roundToTwoDecimals(productInfo.productGram * silverInfo.silverPrice * 1.2)
    return Math.ceil(fallback)
  }
  
  const calculatedSalePrice = roundToTwoDecimals((purchasePrice + fixedExpenses) / denominator)
  
  // Alt sınır yok; doğrudan yukarı yuvarla
  return Math.ceil(calculatedSalePrice)
}
