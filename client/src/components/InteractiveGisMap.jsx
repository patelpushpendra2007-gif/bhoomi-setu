import React, { useState } from 'react';
import { buildCorridorCenterline } from '@shared/ulpinSpatial';
import { formatInrCompact, formatUlpin } from '../lib/format';

function getParcelFill(parcel, ndviLayer) {
  if (parcel.forestGeoFenceAlert) {
    return { fill: 'rgba(185, 28, 28, 0.48)', stroke: '#f87171', badge: `FOREST (${parcel.forestOverlapMeters}m)` };
  }
  if (parcel.isForestZone && !parcel.forestGeoFenceAlert) {
    return { fill: 'rgba(16, 185, 129, 0.25)', stroke: '#6ee7b7', badge: 'FOREST BYPASSED' };
  }
  if (parcel.disputeFlag || parcel.escrowStatus === 'ISOLATED_IN_ESCROW') {
    return { fill: 'rgba(217, 119, 6, 0.48)', stroke: '#fbbf24', badge: 'SEC 77 ESCROW' };
  }
  if (parcel.neslLienFlag) {
    return { fill: 'rgba(194, 65, 12, 0.46)', stroke: '#fb923c', badge: 'NeSL LIEN' };
  }
  if (parcel.stage >= 4 || parcel.disbursementStatus === 'CREDITED_PFMS') {
    return { fill: 'rgba(4, 120, 87, 0.58)', stroke: '#34d399', badge: 'PFMS PAID' };
  }
  if (ndviLayer) {
    const score = parcel.valuation?.ndviCropScore || 0.72;
    return {
      fill: score >= 0.75 ? 'rgba(22, 163, 74, 0.52)' : 'rgba(132, 204, 22, 0.45)',
      stroke: '#bef264',
      badge: `NDVI ${score}`
    };
  }
  if (parcel.stage === 3) {
    return { fill: 'rgba(30, 64, 175, 0.42)', stroke: '#93c5fd', badge: 'AWARD READY' };
  }
  return { fill: 'rgba(100, 116, 139, 0.44)', stroke: '#cbd5e1', badge: 'AWAITING e-SIGN' };
}

export default function InteractiveGisMap({
  parcels = [],
  selectedParcelId,
  onSelectParcel,
  corridorShiftMeters = 0,
  scanning = false,
  onRunScan
}) {
  const [layers, setLayers] = useState({
    cadastral: true,
    corridor: true,
    ndvi: false,
    forest: true
  });

  const toggleLayer = (k) => setLayers((prev) => ({ ...prev, [k]: !prev[k] }));
  const { p0, p1, p2 } = buildCorridorCenterline(corridorShiftMeters);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {[
            ['cadastral', 'ULPIN Parcels'],
            ['corridor', 'PM GatiShakti RoW'],
            ['ndvi', 'ISRO NDVI Layer'],
            ['forest', 'MoEFCC Forest Fence']
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleLayer(key)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                layers[key]
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {onRunScan && (
          <button
            type="button"
            onClick={onRunScan}
            disabled={scanning}
            className="gov-btn-amber py-1.5 px-3 text-xs"
          >
            {scanning ? 'Scanning Bhuvan KML...' : 'Run 2.4s Bhuvan KML Scan'}
          </button>
        )}
      </div>

      <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-[#0D1F1A]">
        <svg viewBox="0 0 800 365" className="w-full h-auto block" role="img" aria-label="ISRO Bhuvan Cadastral Map">
          <defs>
            <pattern id="bhuvanGridV3" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(167, 243, 208, 0.08)" strokeWidth="1" />
            </pattern>
            <radialGradient id="satBaseV3" cx="45%" cy="45%" r="75%">
              <stop offset="0%" stopColor="#16352C" />
              <stop offset="70%" stopColor="#0E241E" />
              <stop offset="100%" stopColor="#091714" />
            </radialGradient>
          </defs>

          <rect width="800" height="365" fill="url(#satBaseV3)" />
          <rect width="800" height="365" fill="url(#bhuvanGridV3)" />

          {/* Topographic Canal */}
          <path
            d="M 20,295 Q 240,280 480,330 T 790,320"
            fill="none"
            stroke="rgba(56, 189, 248, 0.25)"
            strokeWidth="8"
          />
          <text x="48" y="284" fill="rgba(125, 211, 252, 0.65)" fontSize="9.5" fontFamily="monospace">
            SHARDA IRRIGATION CANAL
          </text>

          {/* Parcels */}
          {layers.cadastral &&
            parcels.map((p) => {
              const st = getParcelFill(p, layers.ndvi);
              const isSelected = p.id === selectedParcelId;
              return (
                <g
                  key={p.id}
                  onClick={() => onSelectParcel?.(p.id)}
                  className="cursor-pointer transition-opacity hover:opacity-95"
                >
                  <polygon
                    points={p.svgPoints}
                    fill={st.fill}
                    stroke={isSelected ? '#FFFFFF' : st.stroke}
                    strokeWidth={isSelected ? 3.2 : 1.6}
                  />
                  <text
                    x={p.labelPos.x}
                    y={p.labelPos.y - 8}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="11.5"
                    fontWeight="800"
                  >
                    {p.parcelNumber}
                  </text>
                  <text
                    x={p.labelPos.x}
                    y={p.labelPos.y + 7}
                    textAnchor="middle"
                    fill="#E2E8F0"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {p.isForestZone ? 'Reserve Forest Buffer' : formatInrCompact(p.valuation.netFarmerPayout)}
                  </text>
                  <text
                    x={p.labelPos.x}
                    y={p.labelPos.y + 20}
                    textAnchor="middle"
                    fill="#FDE68A"
                    fontSize="8.5"
                    fontWeight="700"
                  >
                    {st.badge}
                  </text>
                  <text
                    x={p.labelPos.x}
                    y={p.labelPos.y + 32}
                    textAnchor="middle"
                    fill="rgba(203,213,225,0.72)"
                    fontSize="7.5"
                    fontFamily="monospace"
                  >
                    {formatUlpin(p.ulpin).slice(0, 12)}…
                  </text>
                </g>
              );
            })}

          {/* Dynamic 60m Right-of-Way Corridor */}
          {layers.corridor && (
            <g pointerEvents="none">
              <path
                d={`M ${p0.x},${p0.y} Q ${p1.x},${p1.y} ${p2.x},${p2.y}`}
                fill="none"
                stroke="rgba(251, 146, 60, 0.34)"
                strokeWidth="30"
                strokeLinecap="round"
              />
              <path
                d={`M ${p0.x},${p0.y} Q ${p1.x},${p1.y} ${p2.x},${p2.y}`}
                fill="none"
                stroke="#FB923C"
                strokeWidth="2.5"
                strokeDasharray="9 6"
              />
              <text x="72" y={p0.y - 20} fill="#FED7AA" fontSize="10" fontWeight="700">
                PM GATISHAKTI 60m RoW (SHIFT: {corridorShiftMeters >= 0 ? `+${corridorShiftMeters}m N` : `${corridorShiftMeters}m S`})
              </text>
            </g>
          )}

          {/* MoEFCC Forest Geo-Fence */}
          {layers.forest && (
            <g pointerEvents="none">
              <path
                d="M 540,195 C 600,193 675,196 710,242 L 710,336 L 544,330 Z"
                fill="rgba(220, 38, 38, 0.14)"
                stroke="#F87171"
                strokeWidth="1.8"
                strokeDasharray="6 4"
              />
              <text x="550" y="346" fill="#FCA5A5" fontSize="9.5" fontWeight="700">
                MOEFCC FOREST GEO-FENCE BOUNDARY
              </text>
            </g>
          )}

          {/* Telemetry Watermark */}
          <rect
            x="14"
            y="12"
            width="318"
            height="24"
            rx="5"
            fill="rgba(9, 19, 34, 0.84)"
            stroke="rgba(52, 211, 153, 0.35)"
          />
          <text x="24" y="28" fill="#A7F3D0" fontSize="10" fontWeight="700" fontFamily="monospace">
            ISRO BHUVAN + SVAMITVA LiDAR · ULPIN 0.3m LAYER
          </text>

          <rect
            x="616"
            y="12"
            width="170"
            height="24"
            rx="5"
            fill="rgba(9, 19, 34, 0.84)"
            stroke="rgba(255, 255, 255, 0.2)"
          />
          <text x="626" y="28" fill="#CBD5E1" fontSize="10" fontWeight="600" fontFamily="monospace">
            SCALE 1:2500 · WGS84
          </text>
        </svg>

        {scanning && (
          <div className="gis-scan-beam absolute top-0 bottom-0 w-1 bg-emerald-400 shadow-[0_0_20px_#34d399] pointer-events-none" />
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-600">
        {[
          ['#047857', 'PFMS Paid & DILRMP Mutated'],
          ['#1E40AF', 'Schedule I Award Ready'],
          ['#D97706', 'Sec 77 Escrow (Corridor Clear)'],
          ['#C2410C', 'NeSL Bank Lien Split'],
          ['#B91C1C', 'MoEFCC Forest Geo-Fence']
        ].map(([color, text]) => (
          <span key={text} className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: color }} />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
