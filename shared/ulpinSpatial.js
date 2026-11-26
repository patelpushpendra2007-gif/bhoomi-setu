/**
 * Real 14-Digit ULPIN (Bhu-Aadhaar) Spatial Encoder/Decoder & 2D GIS Corridor Intersection Engine.
 * Implements deterministic geo-referenced 14-character parcel identifiers, Shoelace polygon area math,
 * point-to-segment corridor buffer intersection, and MoEFCC Reserve Forest overlap solver.
 */

import { JURISDICTION_MAP } from './revenueCodes.js';

const LGD_TO_STATE = Object.fromEntries(
  Object.values(JURISDICTION_MAP).map((j) => [j.lgd, j.code])
);

/**
 * Generates a deterministic 14-digit Bhu-Aadhaar ULPIN encoding:
 *   [0..1]  2-digit LGD State/UT code (e.g., 09 = UP, 27 = MH)
 *   [2..5]  4-digit quantized latitude micro-grid (06.0°–38.0° N -> 0000..9999)
 *   [6..9]  4-digit quantized longitude micro-grid (68.0°–98.0° E -> 0000..9999)
 *   [10..12] 3-digit parcel sequence code
 *   [13]    1-digit weighted modulo-10 spatial checksum
 */
export function encodeUlpin({ stateCode = 'UP', lat = 26.925, lng = 81.192, parcelSeq = 402 }) {
  const jur = JURISDICTION_MAP[stateCode] || JURISDICTION_MAP.UP;
  const lgd = jur.lgd.padStart(2, '0');

  const normLat = Math.max(0, Math.min(9999, Math.round(((lat - 6.0) / 32.0) * 9999)));
  const normLng = Math.max(0, Math.min(9999, Math.round(((lng - 68.0) / 30.0) * 9999)));
  const seq = Math.max(1, Math.min(999, Math.abs(Math.round(Number(parcelSeq) || 1))))
    .toString()
    .padStart(3, '0');

  const base13 = `${lgd}${String(normLat).padStart(4, '0')}${String(normLng).padStart(4, '0')}${seq}`;
  const checkDigit = computeUlpinCheckDigit(base13);
  return `${base13}${checkDigit}`;
}

export function computeUlpinCheckDigit(digits13) {
  let sum = 0;
  for (let i = 0; i < digits13.length; i++) {
    const d = Number(digits13[i]) || 0;
    sum += d * ((i % 3) + 1);
  }
  return String((10 - (sum % 10)) % 10);
}

/**
 * Validates and decodes a 14-digit ULPIN (Bhu-Aadhaar) back into State LGD & approximate centroid.
 */
export function decodeUlpin(rawUlpin) {
  const clean = String(rawUlpin || '').replace(/[\s-]/g, '');
  if (!/^\d{14}$/.test(clean)) {
    return {
      valid: false,
      ulpin: clean,
      error: 'ULPIN (Bhu-Aadhaar) must be exactly 14 numeric digits.'
    };
  }

  const base13 = clean.slice(0, 13);
  const providedCheck = clean[13];
  const expectedCheck = computeUlpinCheckDigit(base13);
  if (providedCheck !== expectedCheck) {
    return {
      valid: false,
      ulpin: clean,
      error: `Spatial checksum mismatch (expected check digit ${expectedCheck}, got ${providedCheck}).`
    };
  }

  const lgd = clean.slice(0, 2);
  const stateCode = LGD_TO_STATE[lgd] || null;
  const jur = stateCode ? JURISDICTION_MAP[stateCode] : null;
  const latGrid = Number(clean.slice(2, 6));
  const lngGrid = Number(clean.slice(6, 10));
  const parcelSeq = Number(clean.slice(10, 13));

  const approxLat = Number((6.0 + (latGrid / 9999) * 32.0).toFixed(4));
  const approxLng = Number((68.0 + (lngGrid / 9999) * 30.0).toFixed(4));

  return {
    valid: true,
    ulpin: clean,
    formatted: `${clean.slice(0, 2)}-${clean.slice(2, 6)}-${clean.slice(6, 10)}-${clean.slice(10, 14)}`,
    lgd,
    stateCode,
    stateName: jur ? jur.name : `Unknown LGD (${lgd})`,
    recordTerm: jur ? jur.recordTerm : 'RoR Parcel',
    portalName: jur ? jur.portalName : 'DILRMP National Hub',
    parcelSeq,
    approxLat,
    approxLng,
    checkDigit: providedCheck
  };
}

/**
 * Parses SVG/Cartesian polygon string "x1,y1 x2,y2 ..." into [{x, y}, ...].
 * Scale used in local cadastral SVG space (800x380): 1 SVG unit = 2.0 meters.
 */
export function parsePolygonPoints(svgPoints) {
  return String(svgPoints || '')
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [x, y] = pair.split(',').map(Number);
      return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
    })
    .filter(Boolean);
}

/**
 * Shoelace formula for polygon area in Hectares given SVG pixel-to-meter scale.
 */
export function polygonAreaHectares(points, metersPerUnit = 2.0) {
  if (!points || points.length < 3) return 0;
  let area2 = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area2 += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  const svgArea = Math.abs(area2) / 2;
  const sqMeters = svgArea * metersPerUnit * metersPerUnit;
  return Number((sqMeters / 10000).toFixed(3));
}

export function polygonCentroid(points) {
  if (!points || points.length === 0) return { x: 0, y: 0 };
  const sum = points.reduce((acc, pt) => ({ x: acc.x + pt.x, y: acc.y + pt.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

/**
 * Minimum distance from point P to line segment AB in SVG units.
 */
export function pointToSegmentDistance(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

/**
 * Computes quadratic Bezier centerline samples for a corridor polyline with vertical alignment shift.
 * Positive shiftMeters moves the corridor NORTH (lower SVG y).
 */
export function buildCorridorCenterline(shiftMeters = 0, metersPerUnit = 2.0) {
  const shiftSvgY = -(shiftMeters / metersPerUnit); // North = negative Y in SVG canvas
  const p0 = { x: 60, y: 172 + shiftSvgY };
  const p1 = { x: 380, y: 156 + shiftSvgY };
  const p2 = { x: 735, y: 192 + shiftSvgY };

  const samples = [];
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    samples.push({
      x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
      y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
    });
  }
  return { p0, p1, p2, samples };
}

/**
 * Computes real spatial intersection between a 60m Right-of-Way corridor buffer
 * and a parcel polygon + MoEFCC Protected Reserve Forest buffer.
 */
export function evaluateParcelCorridorIntersection(parcel, shiftMeters = 0, rowWidthMeters = 60) {
  const pts = parsePolygonPoints(parcel.svgPoints);
  const metersPerUnit = 2.0;
  const halfRowUnits = rowWidthMeters / 2 / metersPerUnit; // 30m = 15 SVG units
  const { samples } = buildCorridorCenterline(shiftMeters, metersPerUnit);

  // Sample dense vertices + centroid + edge midpoints to estimate geometric RoW coverage
  const probePoints = [...pts];
  if (pts.length >= 3) {
    probePoints.push(polygonCentroid(pts));
    for (let i = 0; i < pts.length; i++) {
      const next = pts[(i + 1) % pts.length];
      probePoints.push({ x: (pts[i].x + next.x) / 2, y: (pts[i].y + next.y) / 2 });
    }
  }

  let minDistUnits = Infinity;
  let insideRowCount = 0;

  for (const pt of probePoints) {
    let ptMin = Infinity;
    for (let i = 0; i < samples.length - 1; i++) {
      const d = pointToSegmentDistance(pt, samples[i], samples[i + 1]);
      if (d < ptMin) ptMin = d;
    }
    if (ptMin < minDistUnits) minDistUnits = ptMin;
    if (ptMin <= halfRowUnits) insideRowCount++;
  }

  const overlapFraction = probePoints.length > 0 ? insideRowCount / probePoints.length : 0;
  const clearanceMeters = Number((Math.max(0, minDistUnits - halfRowUnits) * metersPerUnit).toFixed(1));
  const intersectsRow = minDistUnits <= halfRowUnits;

  // Check Reserve Forest Geo-Fence (notified forest margin starts south of Y=195 between X=[535..715])
  let forestOverlapMeters = 0;
  if (parcel.isForestZone) {
    for (const s of samples) {
      if (s.x >= 535 && s.x <= 715) {
        const corridorSouthEdgeY = s.y + halfRowUnits;
        const forestNorthBoundaryY = 195;
        if (corridorSouthEdgeY > forestNorthBoundaryY) {
          const depthMeters = (corridorSouthEdgeY - forestNorthBoundaryY) * metersPerUnit;
          if (depthMeters > forestOverlapMeters) forestOverlapMeters = depthMeters;
        }
      }
    }
  }

  forestOverlapMeters = Number(forestOverlapMeters.toFixed(1));
  const recommendedNorthShiftM = forestOverlapMeters > 0 ? Math.ceil(forestOverlapMeters + 2) : 0;

  return {
    parcelId: parcel.id,
    ulpin: parcel.ulpin,
    intersectsRow,
    overlapPct: Math.round(overlapFraction * 100),
    affectedHectares: Number((parcel.areaHectares * Math.max(intersectsRow ? 0.35 : 0, overlapFraction)).toFixed(3)),
    clearanceMeters,
    forestOverlapMeters,
    forestGeoFenceAlert: forestOverlapMeters > 0,
    recommendedNorthShiftM
  };
}
