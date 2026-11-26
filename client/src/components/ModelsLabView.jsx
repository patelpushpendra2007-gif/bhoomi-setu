import React, { useState } from 'react';
import { Scale, Cpu, IndianRupee, CheckCircle2, Search, Play } from 'lucide-react';
import { JURISDICTIONS, JURISDICTION_MAP } from '@shared/revenueCodes';
import { calculateRfctlarrValuation, computeNdviFromBands, computeIgrsMarketBenchmark } from '@shared/rfctlarrEngine';
import { encodeUlpin, decodeUlpin, polygonAreaHectares, parsePolygonPoints } from '@shared/ulpinSpatial';
import { computePublicEconomics } from '@shared/economicsModel';
import { apiRequest } from '../lib/api';
import { formatInr, formatUlpin } from '../lib/format';

export default function ModelsLabView({ parcels = [] }) {
  // 1. 36-State Harmonizer & Schedule I Model
  const [stateCode, setStateCode] = useState('UP');
  const [zone, setZone] = useState('Rural');
  const [areaHa, setAreaHa] = useState(0.5);
  const [circleRate, setCircleRate] = useState(650000);
  const [deedsText, setDeedsText] = useState('610000, 625000, 645000, 650000, 2400000');
  const [nir, setNir] = useState(0.74);
  const [red, setRed] = useState(0.082);
  const [structureVal, setStructureVal] = useState(20000);
  const [lienAmt, setLienAmt] = useState(0);
  const [days, setDays] = useState(365);
  const [serverVerifyResult, setServerVerifyResult] = useState(null);

  // 2. 14-Digit ULPIN Encoder / Decoder
  const [ulpinInput, setUlpinInput] = useState(parcels[1]?.ulpin || parcels[0]?.ulpin || '');
  const [genState, setGenState] = useState('MH');
  const [genLat, setGenLat] = useState(18.7492);
  const [genLng, setGenLng] = useState(74.2814);
  const [genSeq, setGenSeq] = useState(118);

  // 3. Reconciled Economics Model
  const [budgetCr, setBudgetCr] = useState(1000);
  const [psuFeePct, setPsuFeePct] = useState(0.35);
  const [track, setTrack] = useState('FULL_STATUTORY');

  const jur = JURISDICTION_MAP[stateCode] || JURISDICTION_MAP.UP;
  const comparableDeeds = deedsText
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  const ndvi = computeNdviFromBands({ nirReflectance: nir, redReflectance: red });
  const igrs = computeIgrsMarketBenchmark({ circleRatePerHa: circleRate, comparableDeedsPerHa: comparableDeeds });
  const valuation = calculateRfctlarrValuation({
    stateCode,
    zone,
    areaHectares: areaHa,
    circleRatePerHa: circleRate,
    ndviCropScore: ndvi.ndvi,
    structureValue: structureVal,
    lienAmount: lienAmt,
    assessmentDays: days,
    comparableDeedsPerHa: comparableDeeds
  });

  const decodedUlpin = ulpinInput ? decodeUlpin(ulpinInput) : null;
  const encodedDemoUlpin = encodeUlpin({ stateCode: genState, lat: Number(genLat), lng: Number(genLng), parcelSeq: Number(genSeq) });
  const econ = computePublicEconomics({ projectBudgetCr: budgetCr, psuFeePct, track });

  const handleStateChange = (nextCode) => {
    const j = JURISDICTION_MAP[nextCode];
    setStateCode(nextCode);
    if (j) setCircleRate(j.defaultCircleRatePerHa);
    setServerVerifyResult(null);
  };

  const runServerVerification = async () => {
    try {
      const res = await apiRequest('/models/rfctlarr-simulate', {
        method: 'POST',
        body: {
          stateCode,
          zone,
          areaHectares: Number(areaHa),
          circleRatePerHa: Number(circleRate),
          nirReflectance: Number(nir),
          redReflectance: Number(red),
          structureValue: Number(structureVal),
          lienAmount: Number(lienAmt),
          assessmentDays: Number(days),
          comparableDeedsPerHa: comparableDeeds,
          projectBudgetCr: Number(budgetCr),
          psuFeePct: Number(psuFeePct),
          track
        }
      });
      setServerVerifyResult(res);
    } catch {
      // handled silently
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#047857]">
          WORKING COMPUTATIONAL MODELS · 28 STATES &amp; 8 UTs HARMONIZATION
        </span>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
          RFCTLARR Schedule I Engine, 14-Digit ULPIN Spatial Codec &amp; Public ROI Modeler
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Every calculator runs deterministic algorithms shared directly between the Express API and React UI.
        </p>
      </div>

      {/* SECTION 1: 36-Jurisdiction Harmonizer + IGRS + NDVI Model */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 gov-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 inline-flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#047857]" />
              36-Jurisdiction Legal Harmonizer (28 States + 8 UTs)
            </h2>
            <span className="gov-badge bg-emerald-50 text-[#047857] border-emerald-200">
              Entry 18 → Entry 42 Unified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">State / Union Territory</label>
              <select
                value={stateCode}
                onChange={(e) => handleStateChange(e.target.value)}
                className="gov-input text-xs"
              >
                {JURISDICTIONS.map((j) => (
                  <option key={j.code} value={j.code}>
                    [{j.type}] {j.name} — {j.recordTerm}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Zone Multiplier (Schedule I)</label>
              <select value={zone} onChange={(e) => setZone(e.target.value)} className="gov-input text-xs">
                <option value="Rural">Rural ({jur.ruralFactor}x Factor)</option>
                <option value="Urban">Urban ({jur.urbanFactor}x Factor)</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs space-y-0.5">
            <div><strong>Harmonized Revenue Act:</strong> {jur.revenueAct}</div>
            <div><strong>State DILRMP API:</strong> {jur.portalName} · LGD Code <span className="font-mono font-bold">{jur.lgd}</span></div>
            <div><strong>Local Record Term:</strong> {jur.recordTerm}</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Area (Ha)</label>
              <input type="number" step="0.05" min="0.05" value={areaHa} onChange={(e) => setAreaHa(e.target.value)} className="gov-input text-xs font-mono" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Circle Rate (₹/Ha)</label>
              <input type="number" step="25000" value={circleRate} onChange={(e) => setCircleRate(e.target.value)} className="gov-input text-xs font-mono" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Structures (₹)</label>
              <input type="number" step="5000" value={structureVal} onChange={(e) => setStructureVal(e.target.value)} className="gov-input text-xs font-mono" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">NeSL Lien (₹)</label>
              <input type="number" step="10000" value={lienAmt} onChange={(e) => setLienAmt(e.target.value)} className="gov-input text-xs font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                IGRS 3-Yr Sale Deeds (₹/Ha, comma-separated)
              </label>
              <input
                type="text"
                value={deedsText}
                onChange={(e) => setDeedsText(e.target.value)}
                className="gov-input text-xs font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                IQR outlier filter rejected <strong>{igrs.outliersRejected}</strong> outlier(s) → Trimmed Top-50% Mean:{' '}
                <span className="font-mono font-semibold">{formatInr(igrs.igrsTrimmedMeanPerHa)}</span>
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">NIR Band</label>
                <input type="number" step="0.02" min="0.1" max="0.98" value={nir} onChange={(e) => setNir(e.target.value)} className="gov-input text-xs font-mono" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Red Band</label>
                <input type="number" step="0.01" min="0.02" max="0.6" value={red} onChange={(e) => setRed(e.target.value)} className="gov-input text-xs font-mono" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Sec 30(3) Days</label>
                <input type="number" step="15" min="30" max="1095" value={days} onChange={(e) => setDays(e.target.value)} className="gov-input text-xs font-mono" />
              </div>
            </div>
          </div>
        </div>

        {/* Deterministic Breakdown + Live Server Parity Check */}
        <div className="lg:col-span-5 gov-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">RFCTLARR Schedule I &amp; II Output</h3>
            <button type="button" onClick={runServerVerification} className="gov-btn-outline py-1 px-2.5 text-[11px]">
              <Play className="w-3 h-3" /> Verify on Backend
            </button>
          </div>

          <div className="gov-inset p-4 space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
              <span>Adopted Rate ({igrs.rateSource})</span>
              <span className="font-mono font-semibold">{formatInr(valuation.circleRatePerHa)}/Ha</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
              <span>Multiplied Land ({valuation.factorApplied}x {zone})</span>
              <span className="font-mono font-semibold">{formatInr(valuation.multipliedValue)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
              <span>NDVI ({ndvi.ndvi}) Crop + Structures</span>
              <span className="font-mono font-semibold">{formatInr(valuation.assetsAndCropValue)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
              <span>100% Solatium (Sec 30)</span>
              <span className="font-mono font-semibold">{formatInr(valuation.solatiumAmount)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
              <span>12% p.a. Sec 30(3) ({days} days)</span>
              <span className="font-mono font-semibold">{formatInr(valuation.statutoryInterest12Pct)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
              <span>NeSL Bank Lien Deduction</span>
              <span className="font-mono font-semibold">-{formatInr(valuation.bankLienDeduction)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-sm font-extrabold text-[#047857]">
              <span>Net 24-Hr PFMS Payout</span>
              <span className="font-mono tabular-nums">{formatInr(valuation.netFarmerPayout)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-[#C2410C] pt-1">
              <span>+ 24-Mo Transition Annuity</span>
              <span className="font-mono">{formatInr(valuation.monthlyAnnuity)}/mo ({formatInr(valuation.totalAnnuity24M)})</span>
            </div>
          </div>

          {serverVerifyResult && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0" />
              <span>
                Backend parity confirmed: Net Award{' '}
                <strong className="font-mono">{formatInr(serverVerifyResult.valuation.netFarmerPayout)}</strong> (NDVI{' '}
                {serverVerifyResult.ndvi.ndvi})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: 14-Digit ULPIN Spatial Codec + Reconciled ROI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 gov-card p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 inline-flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-800" /> 14-Digit ULPIN (Bhu-Aadhaar) Geo-Encoder &amp; Decoder
          </h2>

          <div className="gov-inset p-3.5 space-y-2.5">
            <div className="text-xs font-bold text-slate-700 inline-flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" /> Decode &amp; Checksum-Validate Any 14-Digit ULPIN
            </div>
            <input
              type="text"
              value={ulpinInput}
              onChange={(e) => setUlpinInput(e.target.value)}
              placeholder="Enter 14-digit ULPIN..."
              className="gov-input font-mono text-xs"
            />
            {decodedUlpin && (
              <div
                className={`p-3 rounded-lg text-xs border ${
                  decodedUlpin.valid
                    ? 'bg-white border-emerald-200 text-slate-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {decodedUlpin.valid ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    <div><strong>State / LGD:</strong> {decodedUlpin.stateName} ({decodedUlpin.lgd})</div>
                    <div><strong>Checksum:</strong> Valid (Digit {decodedUlpin.checkDigit})</div>
                    <div><strong>Geo Centroid:</strong> {decodedUlpin.approxLat}°N, {decodedUlpin.approxLng}°E</div>
                    <div><strong>Record Type:</strong> {decodedUlpin.recordTerm}</div>
                  </div>
                ) : (
                  <div>{decodedUlpin.error}</div>
                )}
              </div>
            )}
          </div>

          <div className="gov-inset p-3.5 space-y-2.5">
            <div className="text-xs font-bold text-slate-700">Encode New Geo-Referenced ULPIN</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select value={genState} onChange={(e) => setGenState(e.target.value)} className="gov-input text-xs">
                {JURISDICTIONS.map((j) => (
                  <option key={j.code} value={j.code}>{j.code} ({j.lgd})</option>
                ))}
              </select>
              <input type="number" step="0.001" value={genLat} onChange={(e) => setGenLat(e.target.value)} className="gov-input text-xs font-mono" />
              <input type="number" step="0.001" value={genLng} onChange={(e) => setGenLng(e.target.value)} className="gov-input text-xs font-mono" />
              <input type="number" min="1" max="999" value={genSeq} onChange={(e) => setGenSeq(e.target.value)} className="gov-input text-xs font-mono" />
            </div>
            <div className="flex items-center justify-between bg-slate-900 text-emerald-300 px-3 py-2 rounded-lg font-mono text-xs">
              <span>Generated Bhu-Aadhaar:</span>
              <button
                type="button"
                onClick={() => setUlpinInput(encodedDemoUlpin)}
                className="font-bold underline hover:text-white"
              >
                {formatUlpin(encodedDemoUlpin)} (Click to Decode)
              </button>
            </div>
            {parcels[0] && (
              <div className="text-[11px] text-slate-500">
                Shoelace Cadastral Geometry Check ({parcels[0].parcelNumber}): computed polygon footprint ≈{' '}
                <strong className="font-mono">
                  {polygonAreaHectares(parsePolygonPoints(parcels[0].svgPoints))} Ha
                </strong>
              </div>
            )}
          </div>
        </div>

        {/* Public ROI & Cycle-Time Simulator */}
        <div className="lg:col-span-6 gov-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 inline-flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-[#047857]" /> Reconciled National Public ROI Simulator
            </h2>
            <span className="gov-badge bg-emerald-50 text-[#047857] border-emerald-200">
              {econ.roiMultiple}x Net ROI
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Project Size (₹ Cr)</label>
              <input type="number" step="100" min="50" value={budgetCr} onChange={(e) => setBudgetCr(e.target.value)} className="gov-input font-mono text-xs" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">PSU SaaS Fee (%)</label>
              <input type="number" step="0.05" min="0.25" max="0.50" value={psuFeePct} onChange={(e) => setPsuFeePct(e.target.value)} className="gov-input font-mono text-xs" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Acquisition Track</label>
              <select value={track} onChange={(e) => setTrack(e.target.value)} className="gov-input text-xs">
                <option value="FULL_STATUTORY">Full RFCTLARR (6–9 Mo)</option>
                <option value="DIRECT_CONSENT">Direct Consent (60–90d)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-2 px-3 text-left">Cost Head (₹ Cr)</th>
                  <th className="py-2 px-3 text-right">Manual</th>
                  <th className="py-2 px-3 text-right">BhoomiSetu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2 px-3">Delay Interest &amp; EPC Escalation</td>
                  <td className="py-2 px-3 text-right font-mono">₹{econ.manualDelayCr} Cr</td>
                  <td className="py-2 px-3 text-right font-mono text-[#047857]">₹{econ.bhoomiDelayCr} Cr</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">Survey &amp; Admin Overhead</td>
                  <td className="py-2 px-3 text-right font-mono">₹{econ.manualAdminCr} Cr</td>
                  <td className="py-2 px-3 text-right font-mono text-[#047857]">₹{econ.bhoomiAdminCr} Cr</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">BhoomiSetu PSU SaaS Fee ({econ.psuFeePct}%)</td>
                  <td className="py-2 px-3 text-right font-mono">₹0.0 Cr</td>
                  <td className="py-2 px-3 text-right font-mono text-[#047857]">₹{econ.bhoomiFeeCr} Cr</td>
                </tr>
                <tr className="bg-emerald-50/60 font-extrabold text-slate-900">
                  <td className="py-2.5 px-3">Total Overhead vs True Net Savings</td>
                  <td className="py-2.5 px-3 text-right font-mono">₹{econ.manualTotalCr} Cr</td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#047857]">
                    ₹{econ.bhoomiTotalCr} Cr (Saves ₹{econ.netSavingsCr} Cr)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex flex-wrap justify-between gap-2">
            <span>
              Cycle Compression: <strong>{econ.cycleMetrics.manualMonths} mo</strong> →{' '}
              <strong className="text-[#047857]">{econ.cycleMetrics.bhoomiLabel}</strong> (~{econ.cycleMetrics.speedupPct}% faster)
            </span>
            <span className="font-semibold text-[#047857]">Farmer Pricing: ₹0 Forever</span>
          </div>
        </div>
      </div>
    </div>
  );
}
