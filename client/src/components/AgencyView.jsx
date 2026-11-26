import React, { useState } from 'react';
import { PlusCircle, Compass, FileText, Building2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { JURISDICTIONS, CORRIDOR_SECTORS } from '@shared/revenueCodes';
import { computeCorridorReadiness, ACQUISITION_TRACKS } from '@shared/statutoryEngine';
import { computePublicEconomics } from '@shared/economicsModel';
import { evaluateParcelCorridorIntersection } from '@shared/ulpinSpatial';
import InteractiveGisMap from './InteractiveGisMap';

export default function AgencyView({
  corridor,
  parcels = [],
  selectedParcelId,
  onSelectParcel,
  onKmlRealign,
  onCreateCorridor,
  onOpenCert,
  scanning,
  busy
}) {
  const [shiftMeters, setShiftMeters] = useState(corridor?.corridorShiftMeters || 0);
  const [budgetCr, setBudgetCr] = useState(corridor?.budgetCrores || 1000);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [newName, setNewName] = useState('');
  const [newSector, setNewSector] = useState('RAILWAYS');
  const [newState, setNewState] = useState('TN');
  const [newDistrict, setNewDistrict] = useState('Kancheepuram');
  const [newLength, setNewLength] = useState(42);
  const [newBudget, setNewBudget] = useState(1200);
  const [newTrack, setNewTrack] = useState('FULL_STATUTORY');

  const readiness = computeCorridorReadiness(parcels);
  const econ = computePublicEconomics({ projectBudgetCr: budgetCr, psuFeePct: 0.35, track: corridor?.acquisitionTrack });

  const forestParcel = parcels.find((p) => p.isForestZone);
  const liveForestEval = forestParcel
    ? evaluateParcelCorridorIntersection(forestParcel, shiftMeters, 60)
    : null;

  const handleLaunchCorridor = async (e) => {
    e.preventDefault();
    const ok = await onCreateCorridor({
      name: newName,
      sector: newSector,
      stateCode: newState,
      district: newDistrict,
      corridorLengthKm: Number(newLength),
      budgetCrores: Number(newBudget),
      acquisitionTrack: newTrack
    });
    if (ok) {
      setNewName('');
      setShowCreateForm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            INFRASTRUCTURE AGENCY PORTAL (NHAI · RAILWAYS · METRO · POWER GRID · STATE PSUs)
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
            Single-Window PM GatiShakti Corridor Launch &amp; RoW Handover
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Beyond highway-only BhoomiRashi: unified KML corridor ingestion across all 28 States &amp; 8 UTs.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            className="gov-btn-primary"
          >
            <PlusCircle className="w-4 h-4" /> Launch New Corridor (36 States/UTs)
          </button>
          <button
            type="button"
            onClick={() => parcels[0] && onOpenCert(parcels[0])}
            className="gov-btn-emerald"
          >
            <FileText className="w-4 h-4" /> Clear-Title Handover Record
          </button>
        </div>
      </div>

      {/* Create New Corridor Form */}
      {showCreateForm && (
        <form onSubmit={handleLaunchCorridor} className="gov-card p-5 space-y-4 border-slate-300">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 inline-flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#047857]" /> Launch Single-Window Infrastructure Corridor
            </h2>
            <button type="button" onClick={() => setShowCreateForm(false)} className="text-xs text-slate-500 hover:text-slate-900">
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Corridor Project Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Chennai–Bengaluru Freight Rail Spur (42 km)"
                className="gov-input text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Infrastructure Sector</label>
              <select value={newSector} onChange={(e) => setNewSector(e.target.value)} className="gov-input text-xs">
                {CORRIDOR_SECTORS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">State / UT</label>
              <select value={newState} onChange={(e) => setNewState(e.target.value)} className="gov-input text-xs">
                {JURISDICTIONS.map((j) => (
                  <option key={j.code} value={j.code}>{j.name} ({j.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">District</label>
              <input type="text" required value={newDistrict} onChange={(e) => setNewDistrict(e.target.value)} className="gov-input text-xs" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Acquisition Track</label>
              <select value={newTrack} onChange={(e) => setNewTrack(e.target.value)} className="gov-input text-xs">
                {Object.values(ACQUISITION_TRACKS).map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Length (km)</label>
              <input type="number" min="2" max="500" value={newLength} onChange={(e) => setNewLength(e.target.value)} className="gov-input text-xs font-mono" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Capex Budget (₹ Cr)</label>
              <input type="number" min="50" max="20000" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} className="gov-input text-xs font-mono" />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={busy} className="gov-btn-emerald w-full">
                Ingest KML &amp; Auto-Extract ULPINs
              </button>
            </div>
          </div>
        </form>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="gov-card p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Corridor</div>
          <div className="text-sm font-extrabold text-slate-900 mt-1 line-clamp-1">{corridor?.name}</div>
          <div className="text-xs text-slate-500 mt-1">
            {corridor?.corridorLengthKm} km · {corridor?.district}, {corridor?.stateCode}
          </div>
        </div>
        <div className="gov-card p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">RoW Clear Continuity</div>
          <div className="text-2xl font-extrabold text-[#047857] tabular-nums mt-1">{readiness.rowContinuityPct}%</div>
          <div className="text-xs text-slate-500 mt-1">Sec 77 Escrow prevents single-parcel halts</div>
        </div>
        <div className="gov-card p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Reconciled Net Savings</div>
          <div className="text-2xl font-extrabold text-[#047857] tabular-nums mt-1">₹{econ.netSavingsCr} Cr</div>
          <div className="text-xs text-slate-500 mt-1">{econ.roiMultiple}x ROI after 0.35% PSU SaaS fee</div>
        </div>
        <div className="gov-card p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Digital VID Consent</div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">{readiness.consentedPct}%</div>
          <div className="text-xs text-slate-500 mt-1">
            {corridor?.acquisitionTrack === 'DIRECT_CONSENT' ? '60–90d Direct Consent Track' : '6–9 Mo Statutory Track'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Live KML Alignment Optimizer + Forest Geo-Fence Solver */}
        <div className="lg:col-span-7 gov-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Live KML Alignment Optimizer &amp; MoEFCC Geo-Fence Solver
              </h2>
              <p className="text-xs text-slate-500">
                Shift 60m Right-of-Way North/South in meters to resolve Reserve Forest overlaps before EPC tender
              </p>
            </div>
            {liveForestEval && (
              <span
                className={`gov-badge ${
                  liveForestEval.forestGeoFenceAlert
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-[#047857] border-emerald-200'
                }`}
              >
                {liveForestEval.forestGeoFenceAlert ? (
                  <>
                    <AlertTriangle className="w-3 h-3" /> {liveForestEval.forestOverlapMeters}m Forest Overlap
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3" /> 0.0m Overlap (Cleared)
                  </>
                )}
              </span>
            )}
          </div>

          <div className="gov-inset p-3.5 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[220px]">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700 inline-flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-[#C2410C]" /> Lateral Corridor Shift (North / South)
                </span>
                <span className="font-mono text-slate-900">
                  {shiftMeters >= 0 ? `+${shiftMeters}m North` : `${shiftMeters}m South`}
                </span>
              </div>
              <input
                type="range"
                min={-15}
                max={30}
                step={2}
                value={shiftMeters}
                onChange={(e) => setShiftMeters(Number(e.target.value))}
                className="w-full accent-[#047857]"
              />
            </div>
            <button
              type="button"
              disabled={busy || scanning}
              onClick={() => onKmlRealign(corridor.id, shiftMeters)}
              className="gov-btn-amber"
            >
              Apply &amp; Re-Scan Bhuvan KML
            </button>
          </div>

          <InteractiveGisMap
            parcels={parcels}
            selectedParcelId={selectedParcelId}
            onSelectParcel={onSelectParcel}
            corridorShiftMeters={shiftMeters}
            scanning={scanning}
          />
        </div>

        {/* Right: Reconciled Slide 10 Agency Economics */}
        <div className="lg:col-span-5 gov-card p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Reconciled Public Economics (Slide 10 Benchmark)
            </h2>
            <p className="text-xs text-slate-500">
              Transparently deducts BhoomiSetu’s 0.35% avg PSU SaaS fee (₹0 / 100% free forever for farmers)
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Infrastructure Project Budget</span>
              <span className="font-mono text-[#047857] font-bold">₹{budgetCr.toLocaleString('en-IN')} Cr</span>
            </div>
            <input
              type="range"
              min={250}
              max={5000}
              step={250}
              value={budgetCr}
              onChange={(e) => setBudgetCr(Number(e.target.value))}
              className="w-full accent-[#047857]"
            />
          </div>

          <div className="gov-inset p-4 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
              <span>Manual Delay Interest &amp; EPC Escalation (18.0%)</span>
              <span className="font-mono tabular-nums">₹{econ.manualDelayCr} Cr</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
              <span>Manual Survey &amp; Tehsil Overhead (1.5%)</span>
              <span className="font-mono tabular-nums">₹{econ.manualAdminCr} Cr</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed border-slate-200 text-[#047857]">
              <span>BhoomiSetu Delay &amp; Sec 77 Isolation (0.5%)</span>
              <span className="font-mono tabular-nums">₹{econ.bhoomiDelayCr} Cr</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed border-slate-200 text-[#047857]">
              <span>BhoomiSetu GIS / ULPIN Admin (0.3%)</span>
              <span className="font-mono tabular-nums">₹{econ.bhoomiAdminCr} Cr</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed border-slate-200 text-[#047857]">
              <span>BhoomiSetu PSU SaaS Fee (0.35% avg)</span>
              <span className="font-mono tabular-nums">₹{econ.bhoomiFeeCr} Cr</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-slate-900 font-extrabold text-sm text-[#047857]">
              <span>True Net Public Savings ({econ.roiMultiple}x ROI)</span>
              <span className="font-mono tabular-nums">₹{econ.netSavingsCr} Cr</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
