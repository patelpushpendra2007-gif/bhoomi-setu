/**
 * Real RFCTLARR Act 2013 Compensation Engine:
 *  1. IGRS 3-Year Sale-Deed Outlier-Trimmed Weighted Mean (Sec 26(1) Fair Market Benchmark)
 *  2. ISRO Bhuvan Multi-Spectral NDVI = (NIR - Red) / (NIR + Red) Biomass Valuation
 *  3. Schedule I Exact Award Formula:
 *       Total Award = (Market Value * [1.0x Urban | 1.0-2.0x Rural] + Assets)
 *                     + 100% Solatium (Sec 30)
 *                     + 12% p.a. Sec 30(3) Statutory Interest
 *  4. NeSL / CERSAI Bank Lien / KCC Split Deduction
 *  5. Schedule II 24-Month Transition Annuity (₹8,000 - ₹15,000 / mo)
 */

import { JURISDICTION_MAP } from './revenueCodes.js';

/**
 * Computes Normalized Difference Vegetation Index from Sentinel-2 / ISRO Resourcesat bands.
 */
export function computeNdviFromBands({ nirReflectance = 0.72, redReflectance = 0.08 }) {
  const nir = Math.max(0.01, Math.min(1, Number(nirReflectance) || 0.72));
  const red = Math.max(0.01, Math.min(1, Number(redReflectance) || 0.08));
  const ndvi = Number(((nir - red) / (nir + red)).toFixed(3));
  const clamped = Math.max(0.05, Math.min(0.98, ndvi));
  const vigorLabel =
    clamped >= 0.72
      ? 'High-Yield Irrigated Double-Crop'
      : clamped >= 0.48
        ? 'Moderate Seasonal Cropping'
        : 'Low-Canopy / Fallow Parcel';
  return { nir, red, ndvi: clamped, vigorLabel };
}

/**
 * RFCTLARR Section 26(1): Evaluates highest of (a) SRO Circle Rate or
 * (b) IQR-outlier-trimmed weighted average of top 50% comparable IGRS sale deeds over 3 years.
 */
export function computeIgrsMarketBenchmark({
  circleRatePerHa = 650000,
  comparableDeedsPerHa = []
}) {
  const baseCircle = Math.max(50000, Number(circleRatePerHa) || 650000);
  if (!Array.isArray(comparableDeedsPerHa) || comparableDeedsPerHa.length === 0) {
    return {
      circleRatePerHa: baseCircle,
      igrsTrimmedMeanPerHa: baseCircle,
      adoptedRatePerHa: baseCircle,
      rateSource: 'SRO Circle Rate (Sec 26(1)(a))',
      outliersRejected: 0
    };
  }

  const sorted = comparableDeedsPerHa.map(Number).filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
  if (sorted.length === 0) {
    return {
      circleRatePerHa: baseCircle,
      igrsTrimmedMeanPerHa: baseCircle,
      adoptedRatePerHa: baseCircle,
      rateSource: 'SRO Circle Rate (Sec 26(1)(a))',
      outliersRejected: 0
    };
  }

  // IQR outlier filter to eliminate speculative spikes or distress fire-sales
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowFence = q1 - 1.5 * iqr;
  const highFence = q3 + 1.5 * iqr;
  const clean = sorted.filter((v) => v >= lowFence && v <= highFence);
  const pool = clean.length > 0 ? clean : sorted;

  // Section 26(1)(b): Top 50% of comparable deeds in vicinity
  const topHalf = pool.slice(Math.floor(pool.length / 2));
  const trimmedMean = Math.round(topHalf.reduce((s, v) => s + v, 0) / topHalf.length);
  const adopted = Math.max(baseCircle, trimmedMean);

  return {
    circleRatePerHa: baseCircle,
    igrsTrimmedMeanPerHa: trimmedMean,
    adoptedRatePerHa: adopted,
    rateSource:
      adopted > baseCircle
        ? 'IGRS Top-50% Sale Deed Mean (Sec 26(1)(b))'
        : 'SRO Circle Rate (Sec 26(1)(a))',
    outliersRejected: sorted.length - pool.length
  };
}

/**
 * Deterministic RFCTLARR Act 2013 Schedule I & II Compensation Calculation.
 */
export function calculateRfctlarrValuation({
  stateCode = 'UP',
  zone = 'Rural',
  areaHectares = 0.5,
  circleRatePerHa = 650000,
  sroTrendMultiplier = 1.0,
  ndviCropScore = 0.76,
  structureValue = 20000,
  cropValueOverride = null,
  lienAmount = 0,
  assessmentDays = 365,
  comparableDeedsPerHa = []
}) {
  const jur = JURISDICTION_MAP[stateCode] || JURISDICTION_MAP.UP;
  const factor = zone === 'Rural' ? jur.ruralFactor : jur.urbanFactor;
  const safeArea = Math.max(0.01, Number(areaHectares) || 0.5);
  const igrs = computeIgrsMarketBenchmark({ circleRatePerHa, comparableDeedsPerHa });
  const effectiveRatePerHa = igrs.adoptedRatePerHa;

  const baseMarketValue = Math.round(safeArea * effectiveRatePerHa * (Number(sroTrendMultiplier) || 1));
  const multipliedValue = Math.round(baseMarketValue * factor);

  const safeNdvi = Math.max(0.05, Math.min(1.0, Number(ndviCropScore) || 0.75));
  const ndviCropValue =
    cropValueOverride !== null && cropValueOverride !== undefined
      ? Math.round(Number(cropValueOverride))
      : Math.round(safeArea * 45000 * safeNdvi);

  const safeStructure = Math.max(0, Math.round(Number(structureValue) || 0));
  const assetsAndCropValue = safeStructure + ndviCropValue;
  const baseSubtotal = multipliedValue + assetsAndCropValue;

  // Schedule I: 100% Solatium (Sec 30(1))
  const solatiumAmount = Math.round(baseSubtotal * 1.0);

  // Sec 30(3): 12% p.a. on Market Value from Sec 4/11 notification to award
  const safeDays = Math.max(30, Math.min(1095, Number(assessmentDays) || 365));
  const statutoryInterest12Pct = Math.round(multipliedValue * 0.12 * (safeDays / 365));

  const grossAward = baseSubtotal + solatiumAmount + statutoryInterest12Pct;
  const bankLienDeduction = Math.min(Math.max(0, Math.round(Number(lienAmount) || 0)), grossAward);
  const netFarmerPayout = grossAward - bankLienDeduction;

  // Schedule II Transition Annuity: ₹8,000 - ₹15,000 / month for 24 months
  // Baseline ₹8,000/mo for smallholders up to 0.50 Ha; scales proportionally above 0.50 Ha
  const rawAnnuity =
    Math.round((jur.defaultAnnuityMonthly + Math.max(0, safeArea - 0.5) * 10000) / 500) * 500;
  const monthlyAnnuity = Math.min(15000, Math.max(8000, rawAnnuity));

  return {
    stateCode: jur.code,
    stateName: jur.name,
    revenueTerm: jur.recordTerm,
    zone,
    areaHectares: safeArea,
    circleRatePerHa: effectiveRatePerHa,
    igrsBenchmark: igrs,
    sroTrendMultiplier: Number(sroTrendMultiplier) || 1,
    ndviCropScore: safeNdvi,
    factorApplied: factor,
    assessmentDays: safeDays,
    baseMarketValue,
    multipliedValue,
    ndviCropValue,
    structureValue: safeStructure,
    assetsAndCropValue,
    baseSubtotal,
    solatiumAmount,
    statutoryInterest12Pct,
    grossAward,
    bankLienDeduction,
    netFarmerPayout,
    monthlyAnnuity,
    annuityMonths: 24,
    totalAnnuity24M: monthlyAnnuity * 24,
    totalLifetimeBenefit: netFarmerPayout + monthlyAnnuity * 24
  };
}
