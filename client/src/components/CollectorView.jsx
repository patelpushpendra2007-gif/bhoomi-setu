import React from 'react';
import {
  CheckCircle2,
  Scale,
  AlertTriangle,
  Clock,
  FileText,
  Banknote,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { computeCorridorReadiness } from '@shared/statutoryEngine';
import { formatInr, formatInrCompact, formatUlpin, getParcelBadgeMeta } from '../lib/format';

export default function CollectorView({
  corridor,
  parcels = [],
  objections = [],
  selectedParcelId,
  onSelectParcel,
  onApproveDbt,
  onBatchDisburse,
  onToggleEscrow,
  onOpenCert,
  onOpenGis,
  onTriageObjection,
  onEscalateLarr,
  onResolveObjection,
  busy
}) {
  const readiness = computeCorridorReadiness(parcels);
  const totalAward = parcels.reduce((s, p) => s + (p.isForestZone ? 0 : p.valuation.netFarmerPayout), 0);
  const paidParcels = parcels.filter((p) => p.disbursementStatus === 'CREDITED_PFMS');
  const paidAmount = paidParcels.reduce((s, p) => s + p.valuation.netFarmerPayout, 0);
  const readyBatch = parcels.filter(
    (p) => !p.disputeFlag && !p.forestGeoFenceAlert && !p.isForestZone && p.consentSigned && p.disbursementStatus !== 'CREDITED_PFMS'
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#047857]">
            DISTRICT MAGISTRATE / COLLECTORATE COMMAND CENTER
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
            Single-Window Acquisition, Sec 77 Escrow &amp; 24-Hr PFMS Disbursement
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            {corridor?.name} · Zero manual Tehsil files · Automated DILRMP / ULPIN mutation upon PFMS credit.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onOpenGis} className="gov-btn-outline">
            Inspect Bhuvan GIS Map
          </button>
          <button
            type="button"
            disabled={busy || readyBatch.length === 0}
            onClick={onBatchDisburse}
            className="gov-btn-emerald"
          >
            <Banknote className="w-4 h-4" />
            1-Click Batch PFMS Release ({readyBatch.length} Ready)
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="gov-card p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Sanctioned Award Pool
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
            {formatInrCompact(totalAward)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {parcels.length} ULPIN parcels in active corridor
          </div>
        </div>

        <div className="gov-card p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            24-Hr PFMS Disbursed
          </div>
          <div className="text-2xl font-extrabold text-[#047857] tabular-nums mt-1">
            {formatInrCompact(paidAmount)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {paidParcels.length} farmers paid + 24-mo annuity live
          </div>
        </div>

        <div className="gov-card p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Sec 77 Escrow Isolation
          </div>
          <div className="text-2xl font-extrabold text-[#C2410C] tabular-nums mt-1">
            {readiness.escrowIsolated} Isolated · {readiness.rowContinuityPct}% RoW
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Undisputed stretches remain unblocked (0 HC stays)
          </div>
        </div>

        <div className="gov-card p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Statutory Cycle Progress
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
            Day {corridor?.elapsedDays || 22} / {corridor?.targetDays || 75}
          </div>
          <div className="text-xs text-[#047857] font-semibold mt-1">
            60–90d consent · 6–9 mo full RFCTLARR
          </div>
        </div>
      </div>

      {/* Parcel Ledger */}
      <div className="gov-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Corridor Parcel Ledger &amp; Instant PFMS Escrow Release
            </h2>
            <p className="text-xs text-slate-500">
              Approve Khasra #402 (₹14,50,000) to release PFMS DBT + 24-mo ₹8,000/mo annuity + automatic DILRMP RoR mutation.
            </p>
          </div>
          <span className="gov-badge bg-emerald-50 text-[#047857] border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> SHA-256 Audit Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Parcel &amp; 14-Digit ULPIN</th>
                <th className="py-3 px-4">Landowner (VID)</th>
                <th className="py-3 px-4">Statutory Status</th>
                <th className="py-3 px-4 text-right">Schedule I Award</th>
                <th className="py-3 px-4 text-right">Annuity / Mo</th>
                <th className="py-3 px-4">DILRMP RoR</th>
                <th className="py-3 px-4">Collector Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {parcels.map((p) => {
                const badge = getParcelBadgeMeta(p);
                const canPay =
                  !p.disputeFlag &&
                  !p.forestGeoFenceAlert &&
                  !p.isForestZone &&
                  p.disbursementStatus !== 'CREDITED_PFMS';
                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectParcel(p.id)}
                    className={`cursor-pointer transition-colors ${
                      p.id === selectedParcelId ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{p.parcelNumber}</div>
                      <div className="font-mono text-[11px] text-slate-500">{formatUlpin(p.ulpin)}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.village} · {p.areaHectares} Ha
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{p.farmerName}</div>
                      <div className="font-mono text-[11px] text-slate-500">{p.aadhaarVid}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <span className={`gov-badge ${badge.cls}`}>{badge.label}</span>
                      {p.disputeReason && (
                        <div className="text-[11px] text-amber-800 mt-1 leading-snug">{p.disputeReason}</div>
                      )}
                      {p.neslLienDetails && (
                        <div className="text-[11px] text-orange-700 mt-1 leading-snug">{p.neslLienDetails}</div>
                      )}
                      {p.forestAlertDetails && (
                        <div className="text-[11px] text-rose-700 mt-1 leading-snug">{p.forestAlertDetails}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {p.isForestZone ? 'Bypassed' : formatInr(p.valuation.netFarmerPayout)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                      {p.isForestZone ? '—' : formatInr(p.valuation.monthlyAnnuity)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{p.mutationStatus}</td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-1.5">
                        {canPay && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onApproveDbt(p.id)}
                            className="gov-btn-emerald py-1 px-2.5 text-[11px]"
                          >
                            Approve PFMS DBT
                          </button>
                        )}
                        {!p.isForestZone && p.disbursementStatus !== 'CREDITED_PFMS' && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onToggleEscrow(p.id)}
                            className="gov-btn-outline py-1 px-2.5 text-[11px]"
                          >
                            {p.escrowStatus === 'ISOLATED_IN_ESCROW' ? 'Tribunal Release' : 'Sec 77 Escrow'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onOpenCert(p)}
                          className="gov-btn-outline py-1 px-2 text-[11px]"
                        >
                          <FileText className="w-3 h-3" /> Record
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sec 15 Objection & 7-15 Day CALA/DM Triage + Sec 51 LARR Authority */}
      <div className="gov-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              RFCTLARR Sec 15 Objections · 7–15 Day CALA / DM Triage &amp; Sec 51 LARR Authority
            </h2>
            <p className="text-xs text-slate-500">
              Valuation &amp; lien objections receive fast-track District Collector triage within 7–15 days prior to Sec 51 LARR referral.
            </p>
          </div>
          <span className="gov-badge bg-slate-100 text-slate-700 border-slate-300">
            <Clock className="w-3.5 h-3.5" /> 7–15 Day SLA
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-2.5 px-4">Ticket / Section</th>
                <th className="py-2.5 px-4">Parcel &amp; Landowner</th>
                <th className="py-2.5 px-4">Objection Details</th>
                <th className="py-2.5 px-4">Triage SLA</th>
                <th className="py-2.5 px-4">Collector Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {objections.map((obj) => (
                <tr key={obj.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-slate-900">{obj.id}</div>
                    <div className="text-[11px] text-slate-500">{obj.sectionRef}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{obj.parcelNumber}</div>
                    <div className="text-[11px] text-slate-600">{obj.farmerName}</div>
                  </td>
                  <td className="py-3 px-4 max-w-md">
                    <div className="font-semibold text-slate-900">{obj.category}</div>
                    <div className="text-[11px] text-slate-600">{obj.summary}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`gov-badge ${
                        obj.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-[#047857] border-emerald-200'
                          : obj.status === 'REFERRED_LARR_SEC51'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : obj.escalatedToDm
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {obj.status === 'RESOLVED'
                        ? 'Resolved within SLA'
                        : `${obj.triageStage} (Day ${obj.daysOpen})`}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1.5">
                      {obj.status === 'OPEN' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onTriageObjection(obj.id)}
                          className="gov-btn-outline py-1 px-2 text-[11px]"
                        >
                          <AlertTriangle className="w-3 h-3" /> DM 7–15d Triage
                        </button>
                      )}
                      {obj.status !== 'RESOLVED' && obj.status !== 'REFERRED_LARR_SEC51' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onEscalateLarr(obj.id)}
                          className="gov-btn-outline py-1 px-2 text-[11px]"
                        >
                          <Scale className="w-3 h-3" /> Refer LARR Sec 51
                        </button>
                      )}
                      {obj.status !== 'RESOLVED' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onResolveObjection(obj.id)}
                          className="gov-btn-emerald py-1 px-2 text-[11px]"
                        >
                          Resolve
                        </button>
                      )}
                      {obj.status === 'RESOLVED' && (
                        <span className="text-[11px] text-[#047857] font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Closed
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
