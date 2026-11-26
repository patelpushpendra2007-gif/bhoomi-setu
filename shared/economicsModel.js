/**
 * Reconciled National Public ROI & Cycle-Time Economics Model (Slides 08, 09, 10).
 *
 * Baseline per ₹1,000 Cr Infrastructure Project:
 *   Manual Process:
 *     - Delay Interest & EPC Escalation (18.0%) : ₹180.0 Cr
 *     - Manual Survey & Admin Overhead  (1.5%)  : ₹15.0 Cr
 *     - Total Manual Overhead                   : ₹195.0 Cr
 *   BhoomiSetu Engine:
 *     - Delay & Litigation (Sec 77 Escrow 0.5%) : ₹5.0 Cr
 *     - GIS / ULPIN Admin Overhead (0.3%)       : ₹3.0 Cr
 *     - BhoomiSetu PSU SaaS Fee (0.35% avg)     : ₹3.5 Cr  (range 0.25%–0.50%, ₹0 for farmers)
 *     - Total BhoomiSetu Overhead               : ₹11.5 Cr
 *   True Reconciled Net Public Savings          : ₹183.5 Cr (18.35% of budget, 52.4x net ROI!)
 */

export function computePublicEconomics({
  projectBudgetCr = 1000,
  psuFeePct = 0.35,
  track = 'FULL_STATUTORY'
}) {
  const budget = Math.max(50, Number(projectBudgetCr) || 1000);
  const feeRate = Math.min(0.5, Math.max(0.25, Number(psuFeePct) || 0.35)) / 100;

  const manualDelayCr = Number((budget * 0.18).toFixed(1));
  const manualAdminCr = Number((budget * 0.015).toFixed(1));
  const manualTotalCr = Number((manualDelayCr + manualAdminCr).toFixed(1));

  const bhoomiDelayCr = Number((budget * 0.005).toFixed(1));
  const bhoomiAdminCr = Number((budget * 0.003).toFixed(1));
  const bhoomiFeeCr = Number((budget * feeRate).toFixed(2));
  const bhoomiTotalCr = Number((bhoomiDelayCr + bhoomiAdminCr + bhoomiFeeCr).toFixed(2));

  const netSavingsCr = Number((manualTotalCr - bhoomiTotalCr).toFixed(2));
  const savingsPctOfBudget = Number(((netSavingsCr / budget) * 100).toFixed(1));
  const roiMultiple = bhoomiFeeCr > 0 ? Number((netSavingsCr / bhoomiFeeCr).toFixed(1)) : 0;

  const cycleMetrics =
    track === 'DIRECT_CONSENT'
      ? {
          manualMonths: 54,
          bhoomiLabel: '60–90 Days (Direct Consent)',
          bhoomiMonthsMid: 2.5,
          speedupPct: 95
        }
      : {
          manualMonths: 54,
          bhoomiLabel: '6–9 Months (Full Statutory RFCTLARR)',
          bhoomiMonthsMid: 7.5,
          speedupPct: 83
        };

  return {
    budgetCr: budget,
    psuFeePct: Number((feeRate * 100).toFixed(2)),
    manualDelayCr,
    manualAdminCr,
    manualTotalCr,
    bhoomiDelayCr,
    bhoomiAdminCr,
    bhoomiFeeCr,
    bhoomiTotalCr,
    netSavingsCr,
    savingsPctOfBudget,
    roiMultiple,
    farmerCostInr: 0,
    cycleMetrics
  };
}
