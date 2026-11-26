export function formatInr(num) {
  return '₹' + Math.round(Number(num || 0)).toLocaleString('en-IN');
}

export function formatInrCompact(num) {
  const val = Number(num || 0);
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return formatInr(val);
}

export function formatUlpin(raw) {
  const s = String(raw || '').replace(/[\s-]/g, '');
  if (s.length !== 14) return raw || '—';
  return `${s.slice(0, 2)}-${s.slice(2, 6)}-${s.slice(6, 10)}-${s.slice(10, 14)}`;
}

export function getParcelBadgeMeta(parcel) {
  if (parcel.forestGeoFenceAlert) {
    return {
      label: `Forest Geo-Fence (${parcel.forestOverlapMeters || 18}m)`,
      cls: 'bg-rose-50 text-rose-700 border-rose-200'
    };
  }
  if (parcel.isForestZone && !parcel.forestGeoFenceAlert) {
    return {
      label: 'Forest Bypassed (0m Overlap)',
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  }
  if (parcel.disputeFlag || parcel.escrowStatus === 'ISOLATED_IN_ESCROW') {
    return {
      label: 'Sec 77 Escrow Isolated',
      cls: 'bg-amber-50 text-amber-800 border-amber-200'
    };
  }
  if (parcel.neslLienFlag) {
    return {
      label: 'NeSL KCC Lien Split',
      cls: 'bg-orange-50 text-orange-800 border-orange-200'
    };
  }
  if (parcel.disbursementStatus === 'CREDITED_PFMS') {
    return {
      label: 'Stage 5 · PFMS Paid & Mutated',
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  }
  if (parcel.stage === 3) {
    return {
      label: 'Stage 3 · Schedule I Ready',
      cls: 'bg-slate-100 text-slate-800 border-slate-300'
    };
  }
  if (parcel.stage === 2) {
    return {
      label: 'Stage 2 · VID Consent Verified',
      cls: 'bg-sky-50 text-sky-800 border-sky-200'
    };
  }
  return {
    label: 'Stage 1 · ULPIN Notice',
    cls: 'bg-slate-100 text-slate-600 border-slate-200'
  };
}
