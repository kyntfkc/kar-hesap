const AYAR_14_MILLEM = 0.585;

function calculatePureGoldGram(productInfo) {
  const totalLaborMillem = productInfo.laborMillem || 0; // lazer kesim kaldırıldı
  return (totalLaborMillem + AYAR_14_MILLEM) * productInfo.productGram;
}

function calculateProductAmount(pureGoldGram, goldPrice) {
  return pureGoldGram * goldPrice;
}

function calculatePurchasePrice(productAmount) {
  return productAmount;
}

function calculateProfit(productInfo, goldInfo, expenses, platform) {
  const pureGoldGram = calculatePureGoldGram(productInfo);
  const productAmount = calculateProductAmount(pureGoldGram, goldInfo.goldPrice);
  const purchasePrice = calculatePurchasePrice(productAmount);

  const commissionAmount = (platform.salePrice * platform.commissionRate) / 100;
  const eCommerceTaxRate = expenses.eCommerceTaxRate || 1.0;
  const eCommerceTaxAmount = platform.salePrice * (eCommerceTaxRate / 100);

  const totalExpenses =
    (expenses.shipping || 0) +
    (expenses.packaging || 0) +
    eCommerceTaxAmount +
    (expenses.serviceFee || 0) +
    (expenses.specialPackaging || 0);

  const totalCost = purchasePrice + totalExpenses + commissionAmount;
  const netProfit = platform.salePrice - totalCost;
  const profitRate = (netProfit / platform.salePrice) * 100;
  const amountDepositedToBank = platform.salePrice - (commissionAmount + (expenses.shipping || 0) + eCommerceTaxAmount);

  return {
    platform: platform.name,
    commissionRate: platform.commissionRate,
    salePrice: platform.salePrice,
    commissionAmount,
    totalExpenses,
    amountDepositedToBank,
    netProfit,
    profitRate,
  };
}

function calculateAllPlatforms(productInfo, goldInfo, expenses, platforms) {
  const sorted = [...platforms].sort((a, b) => {
    if (a.name === 'Standart') return -1;
    if (b.name === 'Standart') return 1;
    const mA = a.name.match(/Senaryo (\d+)/);
    const mB = b.name.match(/Senaryo (\d+)/);
    const nA = mA ? parseInt(mA[1]) : Infinity;
    const nB = mB ? parseInt(mB[1]) : Infinity;
    if (nA !== Infinity && nB !== Infinity) return nA - nB;
    return a.name.localeCompare(b.name);
  });
  return sorted.map((p) => calculateProfit(productInfo, goldInfo, expenses, p));
}

function calculateStandardSalePrice(productInfo, goldInfo, expenses, commissionRate = 22, targetProfitRate = 15) {
  const pureGoldGram = calculatePureGoldGram(productInfo);
  const productAmount = calculateProductAmount(pureGoldGram, goldInfo.goldPrice);
  const purchasePrice = calculatePurchasePrice(productAmount);
  const fixedExpenses = (expenses.shipping || 0) + (expenses.packaging || 0) + (expenses.serviceFee || 0) + (expenses.specialPackaging || 0);
  const eCommerceTaxRate = expenses.eCommerceTaxRate || 1.0;
  const denominator = 1 - eCommerceTaxRate / 100 - commissionRate / 100 - targetProfitRate / 100;
  if (denominator <= 0) return Math.ceil(productInfo.productGram * goldInfo.goldPrice * 1.2);
  const calculatedSalePrice = (purchasePrice + fixedExpenses) / denominator;
  return Math.ceil(calculatedSalePrice);
}

module.exports = {
  calculateAllPlatforms,
  calculateStandardSalePrice,
};


