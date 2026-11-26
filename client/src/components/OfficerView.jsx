import React, { useEffect, useState } from 'react';
import { Search, Calculator, FileText, ShieldAlert, CheckCircle2, Satellite } from 'lucide-react';
import { JURISDICTION_MAP } from '@shared/revenueCodes';
import { calculateRfctlarrValuation, computeNdviFromBands } from '@shared/rfctlarrEngine';
import { formatInr, formatUlpin, getParcelBadgeMeta } from '../lib/format';
import InteractiveGisMap from './InteractiveGisMap';

export default function OfficerView({
  corridor,
  parcels = [],
  selectedParcelId,
  onSelectParcel,
  onRunScan,
  onSaveValuation,
  onOpenCert,
  scanning,
  busy
}) {
  const parcel = parcels.find((p) => p.id === selectedParcelId) || parcels[0];
  const [ulpinQuery, setUlpinQuery] = useState('');
  const [zone, setZone] = useState(parcel?.zone || 'Rural');
  const [areaHectares, setAreaHectares] = useState(parcel?.areaHectares || 0.5);
  const [circleRatePerHa, setCircleRatePerHa] = useState(parcel?.valuation?.circleRatePerHa || 650000);
  const [nir, setNir] = useState(parcel?.nirReflectance || 0.74);
  const [red, setRed] = useState(parcel?.redReflectance || 0.082);
  const [structureValue, setStructureValue] = useState(parcel?.valuation?.structureValue || 20000);
  const [lienAmount, setLienAmount] = useState(parcel?.valuation?.bankLienDeduction || 0);
  const [assessmentDays, setAssessmentDays] = useState(parcel?.valuation?.assessmentDays || 365);

  useEffect(() => {
    if (!parcel) return;
    setZone(parcel.zone);
    setAreaHectares(parcel.areaHectares);
    setCircleRatePerHa(parcel.valuation.circleRatePerHa);
    setNir(parcel.nirReflectance || 0.74);
    setRed(parcel.redReflectance || 0.082);
    setStructureValue(parcel.valuation.structureValue);
    setLienAmount(parcel.valuation.bankLienDeduction);
    setAssessmentDays(parcel.valuation.assessmentDays || 365);
  }, [parcel?.id]);

  if (!parcel) {
    return <div className="gov-card p-6 text-sm text-slate-600">No parcels available in active corridor.</div>;
  }

  const jur = JURISDICTION_MAP[parcel.stateCode] || JURISDICTION_MAP.UP;
  const ndviModel = computeNdviFromBands({ nirReflectance: nir, redReflectance: red });
  const livePreview = calculateRfctlarrValuation({
    stateCode: parcel.stateCode,
    zone,
    areaHectares,
    circleRatePerHa,
    ndviCropScore: ndviModel.ndvi,
    structureValue,
    lienAmount,
    assessmentDays,
    comparableDeedsPerHa: parcel.comparableDeedsPerHa
  });
  const badge = getParcelBadgeMeta(parcel);

  const handleUlpinSearch = (e) => {
    e.preventDefault();
    const clean = ulpinQuery.replace(/[\s-]/g, '');
    if (!clean) return;
    const hit = parcels.find(
      (p) => p.ulpin.includes(clean) || p.parcelNumber.toLowerCase().includes(clean.toLowerCase())
    );
    if (hit) onSelectParcel(hit.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSaveValuation(parcel.id, {
      zone,
      areaHectares: Number(areaHectares),
      circleRatePerHa: Number(circleRatePerHa),
      nirReflectance: Number(nir),
      redReflectance: Number(red),
      ndviCropScore: ndviModel.ndvi,
      structureValue: Number(structureValue),
      lienAmount: Number(lienAmount),
      assessmentDays: Number(assessmentDays)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#047857]">
            LAND ACQUISITION OFFICER (CALA) &amp; STATUTORY VALUATION ENGINE
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
            14-Digit ULPIN Lookup, ISRO Bhuvan GIS &amp; RFCTLARR Schedule I Award Editor
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Replaces manual circle-rate lookups with IGRS 3-year comparable deed analysis, NDVI crop vigor, and NeSL lien verification.
          </p>
        </div>

        <form onSubmit={handleUlpinSearch} className="flex items-center gap-2">
          <input
            type="text"
            value={ulpinQuery}
            onChange={(e) => setUlpinQuery(e.target.value)}
            placeholder="Search ULPIN or Khasra #..."
            className="gov-input w-56 text-xs font-mono"
          />
          <button type="submit" className="gov-btn-primary">
            <Search className="w-3.5 h-3.5" /> Lookup
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive GIS Map + Selected ULPIN Telemetry */}
        <div className="lg:col-span-7 space-y-4">
          <div className="gov-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Interactive Cadastral Corridor Map</h2>
                <p className="text-xs text-slate-500">Click any parcel polygon to load its Schedule I valuation sheet</p>
              </div>
              <span className="gov-badge bg-slate-100 text-slate-700 border-slate-300">
                {jur.portalName}
              </span>
            </div>

            <InteractiveGisMap
              parcels={parcels}
              selectedParcelId={parcel.id}
              onSelectParcel={onSelectParcel}
              corridorShiftMeters={corridor?.corridorShiftMeters || 0}
              scanning={scanning}
              onRunScan={onRunScan}
            />
          </div>

          <div className="gov-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="gov-inset p-3">
              <div className="text-[11px] text-slate-500 font-semibold">14-Digit Bhu-Aadhaar (ULPIN)</div>
              <div className="font-mono font-bold text-slate-900 mt-0.5">{formatUlpin(parcel.ulpin)}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{parcel.khataNumber} · {parcel.village}</div>
            </div>
            <div className="gov-inset p-3">
              <div className="text-[11px] text-slate-500 font-semibold">IGRS 3-Yr Sale-Deed Mean</div>
              <div className="font-mono font-bold text-slate-900 mt-0.5">
                {formatInr(livePreview.igrsBenchmark.adoptedRatePerHa)} / Ha
              </div>
              <div className="text-[11px] text-[#047857] mt-0.5">{livePreview.igrsBenchmark.rateSource}</div>
            </div>
            <div className="gov-inset p-3">
              <div className="text-[11px] text-slate-500 font-semibold">NeSL / CERSAI Encumbrance</div>
              <div className={`font-bold mt-0.5 ${parcel.neslLienFlag ? 'text-orange-700' : 'text-[#047857]'}`}>
                {parcel.neslLienFlag ? `Active Lien (${formatInr(parcel.valuation.bankLienDeduction)})` : 'Zero Bank Mortgage'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{parcel.landClass}</div>
            </div>
          </div>
        </div>

        {/* Right: Schedule I Valuation Editor */}
        <div className="lg:col-span-5 gov-card p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Schedule I Valuation — {parcel.parcelNumber}
              </h2>
              <p className="text-xs text-slate-500">{jur.revenueAct}</p>
            </div>
            <span className={`gov-badge ${badge.cls}`}>{badge.label}</span>
          </div>

          {parcel.forestGeoFenceAlert && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{parcel.forestAlertDetails}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Zone Multiplier (Sec 26)
                </label>
                <select value={zone} onChange={(e) => setZone(e.target.value)} className="gov-input text-xs">
                  <option value="Rural">Rural ({jur.ruralFactor}x Multiplier)</option>
                  <option value="Urban">Urban ({jur.urbanFactor}x Multiplier)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Parcel Area (Hectares)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.05"
                  value={areaHectares}
                  onChange={(e) => setAreaHectares(e.target.value)}
                  className="gov-input text-xs font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  SRO Circle Rate (₹ / Ha)
                </label>
                <input
                  type="number"
                  step="10000"
                  value={circleRatePerHa}
                  onChange={(e) => setCircleRatePerHa(e.target.value)}
                  className="gov-input text-xs font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Sec 30(3) Days (12% p.a.)
                </label>
                <input
                  type="number"
                  min="30"
                  max="1095"
                  step="5"
                  value={assessmentDays}
                  onChange={(e) => setAssessmentDays(e.target.value)}
                  className="gov-input text-xs font-mono tabular-nums"
                />
              </div>
            </div>

            {/* Real Spectral NDVI Band Calculator */}
            <div className="gov-inset p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-700 inline-flex items-center gap-1">
                  <Satellite className="w-3.5 h-3.5 text-[#047857]" /> ISRO NDVI = (NIR − Red) / (NIR + Red)
                </span>
                <span className="font-mono font-bold text-[#047857]">
                  NDVI {ndviModel.ndvi} ({ndviModel.vigorLabel})
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500">NIR Band Reflectance</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="0.98"
                    value={nir}
                    onChange={(e) => setNir(e.target.value)}
                    className="gov-input py-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">Red Band Reflectance</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.02"
                    max="0.6"
                    value={red}
                    onChange={(e) => setRed(e.target.value)}
                    className="gov-input py-1 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  LiDAR Assets / Tubewell (₹)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={structureValue}
                  onChange={(e) => setStructureValue(e.target.value)}
                  className="gov-input text-xs font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  NeSL Bank Lien Split (₹)
                </label>
                <input
                  type="number"
                  step="10000"
                  value={lienAmount}
                  onChange={(e) => setLienAmount(e.target.value)}
                  className="gov-input text-xs font-mono tabular-nums"
                />
              </div>
            </div>

            {/* Live Schedule I Breakdown */}
            <div className="gov-inset p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Market Value × {livePreview.factorApplied}x Factor</span>
                <span className="font-mono font-semibold tabular-nums">{formatInr(livePreview.multipliedValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">NDVI Standing Crop + LiDAR Assets</span>
                <span className="font-mono font-semibold tabular-nums">{formatInr(livePreview.assetsAndCropValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">100% Solatium (Sec 30)</span>
                <span className="font-mono font-semibold tabular-nums">{formatInr(livePreview.solatiumAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">12% p.a. Sec 30(3) Interest</span>
                <span className="font-mono font-semibold tabular-nums">{formatInr(livePreview.statutoryInterest12Pct)}</span>
              </div>
              {livePreview.bankLienDeduction > 0 && (
                <div className="flex justify-between text-orange-700">
                  <span>Less NeSL KCC Bank Lien</span>
                  <span className="font-mono font-semibold tabular-nums">-{formatInr(livePreview.bankLienDeduction)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-300 font-extrabold text-sm text-[#047857]">
                <span>Net Beneficiary Payout</span>
                <span className="font-mono tabular-nums">{formatInr(livePreview.netFarmerPayout)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="gov-btn-emerald flex-1">
                <Calculator className="w-3.5 h-3.5" /> Save &amp; Sign Schedule I Award
              </button>
              <button type="button" onClick={() => onOpenCert(parcel)} className="gov-btn-outline">
                <FileText className="w-3.5 h-3.5" /> Award Sheet
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
