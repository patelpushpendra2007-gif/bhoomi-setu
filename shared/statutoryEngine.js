/**
 * RFCTLARR Act 2013 Statutory Workflow & Section 77 Escrow Isolation State Machine.
 * Tracks Section 4 SIA, Section 11 Preliminary Notice, Section 15 (60-Day Objections),
 * Section 77 Digital Court Escrow isolation, and Section 51 LARR Authority referral.
 */

export const ACQUISITION_TRACKS = {
  FULL_STATUTORY: {
    id: 'FULL_STATUTORY',
    label: 'Full Statutory RFCTLARR (6–9 Months)',
    targetDays: 210,
    sec15WindowDays: 60,
    requiresSia: true
  },
  DIRECT_CONSENT: {
    id: 'DIRECT_CONSENT',
    label: 'Direct Consent Fast-Track Sec 2(2) (60–90 Days)',
    targetDays: 75,
    sec15WindowDays: 15,
    requiresSia: false
  }
};

export const STATUTORY_STAGES = [
  { stage: 1, code: 'SEC_11_ULPIN_NOTICE', title: 'ULPIN Notice (Sec 11)', desc: '14-digit Bhu-Aadhaar geotagged & vernacular SMS/IVRS delivered' },
  { stage: 2, code: 'SEC_2_ESIGN_CONSENT', title: 'e-Sign Consent (Sec 2(2))', desc: 'Aadhaar VID OTP / CSC Bhoomi Mitra verifiable consent logged' },
  { stage: 3, code: 'SCHEDULE_I_AWARD', title: 'Schedule I Award (Sec 23)', desc: 'Itemized RFCTLARR formula published & Sec 15 objections cleared' },
  { stage: 4, code: 'PFMS_24HR_DBT', title: '24-Hr PFMS Credit (Sec 31)', desc: '100% undisputed funds credited directly; DILRMP RoR mutated' },
  { stage: 5, code: 'ANNUITY_PMKVY_BRIDGE', title: 'Annuity & PMKVY 4.0', desc: '24-mo Transition Annuity (₹8k–₹15k/mo) + Skill India R&R active' }
];

/**
 * Validates whether PFMS DBT disbursement can legally fire for a parcel.
 */
export function validateDisbursementGate(parcel, openObjections = []) {
  if (!parcel) {
    return { allowed: false, code: 'NOT_FOUND', status: 404, reason: 'Parcel not found.' };
  }
  if (parcel.forestGeoFenceAlert) {
    return {
      allowed: false,
      code: 'FOREST_GEO_FENCE_BLOCK',
      status: 409,
      reason: 'Blocked: Corridor intersects notified MoEFCC Reserve Forest buffer. Shift KML alignment first.'
    };
  }
  if (parcel.disputeFlag || parcel.escrowStatus === 'ISOLATED_IN_ESCROW') {
    return {
      allowed: false,
      code: 'SEC_77_ESCROW_LOCKED',
      status: 409,
      reason: 'Blocked: Award is isolated in RFCTLARR Section 77 Digital Court Escrow pending title/tribunal resolution.'
    };
  }
  if (parcel.disbursementStatus === 'CREDITED_PFMS') {
    return {
      allowed: false,
      code: 'ALREADY_DISBURSED',
      status: 409,
      reason: `PFMS DBT already credited via UTR ${parcel.pfmsUtr}.`
    };
  }
  const blockingObj = openObjections.find(
    (o) => o.parcelId === parcel.id && o.status === 'OPEN' && o.blocksDisbursement
  );
  if (blockingObj) {
    return {
      allowed: false,
      code: 'SEC_15_OBJECTION_OPEN',
      status: 409,
      reason: `Blocked by pending Sec 15 objection (${blockingObj.id}). Complete 7–15 day CALA/DM triage first.`
    };
  }

  return { allowed: true, code: 'CLEAR', status: 200 };
}

/**
 * Computes Corridor Right-of-Way Readiness proving Section 77 Escrow Isolation prevents
 * single-parcel disputes from stalling entire multi-km corridors.
 */
export function computeCorridorReadiness(parcels = []) {
  const acquireable = parcels.filter((p) => !p.forestGeoFenceAlert);
  const clearedForWork = acquireable.filter(
    (p) => p.disbursementStatus === 'CREDITED_PFMS' || p.escrowStatus === 'ISOLATED_IN_ESCROW'
  );
  const forestBlocked = parcels.filter((p) => p.forestGeoFenceAlert).length;
  const escrowIsolated = parcels.filter((p) => p.escrowStatus === 'ISOLATED_IN_ESCROW').length;
  const paidCount = parcels.filter((p) => p.disbursementStatus === 'CREDITED_PFMS').length;
  const consentedCount = acquireable.filter((p) => p.consentSigned).length;

  const rowContinuityPct =
    acquireable.length > 0 ? Math.round((clearedForWork.length / acquireable.length) * 100) : 0;

  return {
    totalParcels: parcels.length,
    acquireableParcels: acquireable.length,
    paidCount,
    escrowIsolated,
    forestBlocked,
    consentedPct: acquireable.length > 0 ? Math.round((consentedCount / acquireable.length) * 100) : 0,
    rowContinuityPct,
    corridorHalts: forestBlocked > 0 ? 1 : 0
  };
}
