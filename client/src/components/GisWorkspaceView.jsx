import React from 'react';
import { FileText, Smartphone, Compass } from 'lucide-react';
import { evaluateParcelCorridorIntersection, polygonAreaHectares, parsePolygonPoints } from '@shared/ulpinSpatial';
import { formatInr, formatUlpin, getParcelBadgeMeta } from '../lib/format';
import InteractiveGisMap from './InteractiveGisMap';

export default function GisWorkspaceView({
  corridor,
  parcels = [],
  selectedParcelId,
  onSelectParcel,
  onRunScan,
  onOpenCert,
  onJumpToFarmer,
  scanning
}) {
  const parcel = parcels.find((p) => p.id === selectedParcelId) || parcels[0];
  if (!parcel) return null;

  const badge = getParcelBadgeMeta(parcel);
  const geom = evaluateParcelCorridorIntersection(parcel, corridor?.corridorShiftMeters || 0, 60);
  const shoelaceHa = polygonAreaHectares(parsePolygonPoints(parcel.svgPoints));

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#047857]">
          GEO-SPATIAL INTELLIGENCE LAYER · ISRO BHUVAN + PM GATISHAKTI NMP
        </span>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
          Cadastral Parcel Polygon Inspector &amp; 14-Digit ULPIN Telemetry
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Click any parcel on the map to inspect real RoW intersection geometry, NeSL lien status, and Reserve Forest buffers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 gov-card p-5">
          <InteractiveGisMap
            parcels={parcels}
            selectedParcelId={parcel.id}
            onSelectParcel={onSelectParcel}
            corridorShiftMeters={corridor?.corridorShiftMeters || 0}
            scanning={scanning}
            onRunScan={onRunScan}
          />
        </div>

        <div className="lg:col-span-5 gov-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Selected Telemetry — {parcel.parcelNumber}</h2>
              <div className="font-mono text-xs text-slate-500 mt-0.5">{formatUlpin(parcel.ulpin)}</div>
            </div>
            <span className={`gov-badge ${badge.cls}`}>{badge.label}</span>
          </div>

          <div className="space-y-2 text-xs text-slate-700">
            <div><strong>Landowner:</strong> {parcel.farmerName} ({parcel.fatherOrSpouse})</div>
            <div><strong>Revenue Location:</strong> {parcel.village}, Tehsil {parcel.tehsil}, {parcel.district} ({parcel.stateCode})</div>
            <div><strong>Centroid Coordinates:</strong> <span className="font-mono">{parcel.lat}°N, {parcel.lng}°E</span></div>
            <div><strong>RoR Area &amp; Schematic Block:</strong> <span className="font-mono">{parcel.areaHectares} Ha</span> (1:2500 Grid ≈ <span className="font-mono">{shoelaceHa} Ha</span>)</div>
            <div><strong>ISRO NDVI Crop Index:</strong> <span className="font-mono font-semibold">{parcel.valuation.ndviCropScore}</span></div>
            <div className="gov-inset p-3 space-y-1">
              <div className="font-bold text-slate-900 inline-flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#C2410C]" /> 60m Corridor RoW Geometry
              </div>
              <div>Intersects RoW: <strong>{geom.intersectsRow ? 'Yes' : 'No'}</strong> ({geom.overlapPct}% vertex coverage · {geom.affectedHectares} Ha)</div>
              {parcel.isForestZone && (
                <div className={geom.forestGeoFenceAlert ? 'text-rose-700 font-semibold' : 'text-[#047857] font-semibold'}>
                  Forest Buffer Overlap: {geom.forestOverlapMeters}m{' '}
                  {geom.recommendedNorthShiftM > 0 ? `(Recommended shift: +${geom.recommendedNorthShiftM}m North)` : '(Cleared)'}
                </div>
              )}
            </div>
            <div>
              <strong>NeSL / CERSAI Check:</strong>{' '}
              {parcel.neslLienFlag ? parcel.neslLienDetails : 'Clear — Zero active mortgage lien'}
            </div>
          </div>

          <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-extrabold text-[#047857]">
            <span>Schedule I Net Payout</span>
            <span className="font-mono">{formatInr(parcel.valuation.netFarmerPayout)}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onOpenCert(parcel)} className="gov-btn-outline">
              <FileText className="w-3.5 h-3.5" /> Statutory Record
            </button>
            <button type="button" onClick={() => onJumpToFarmer(parcel.id)} className="gov-btn-emerald">
              <Smartphone className="w-3.5 h-3.5" /> View in BhoomiTracker
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
