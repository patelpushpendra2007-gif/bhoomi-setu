import test from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import http from 'node:http';

import { JURISDICTIONS, JURISDICTION_MAP } from '../shared/revenueCodes.js';
import {
  encodeUlpin,
  decodeUlpin,
  polygonAreaHectares,
  parsePolygonPoints,
  evaluateParcelCorridorIntersection
} from '../shared/ulpinSpatial.js';
import {
  calculateRfctlarrValuation,
  computeNdviFromBands,
  computeIgrsMarketBenchmark
} from '../shared/rfctlarrEngine.js';
import { computePublicEconomics } from '../shared/economicsModel.js';
import { verifyAuditChain, computeAuditHash } from '../server/auditLedger.js';
import app from '../server/app.js';

function reqJson(apiPath, { method = 'GET', token, body } = {}) {
  return new Promise((resolve, reject) => {
    const payloadStr = body ? JSON.stringify(body) : '';
    const req = new PassThrough();
    req.url = `/api${apiPath}`;
    req.originalUrl = `/api${apiPath}`;
    req.method = method;
    req.headers = { host: 'localhost', 'content-type': 'application/json' };
    if (token) req.headers.authorization = `Bearer ${token}`;
    if (payloadStr) req.headers['content-length'] = String(Buffer.byteLength(payloadStr));
    req.connection = { remoteAddress: '127.0.0.1' };
    req.socket = req.connection;

    const res = new http.ServerResponse({ method, headers: {} });
    const chunks = [];
    res.write = (chunk, enc, cb) => {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, enc));
      if (typeof enc === 'function') enc();
      else if (typeof cb === 'function') cb();
      return true;
    };
    res.end = (chunk, enc, cb) => {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, enc));
      const raw = Buffer.concat(chunks).toString('utf8');
      if (typeof enc === 'function') enc();
      else if (typeof cb === 'function') cb();
      try {
        resolve({ status: res.statusCode, data: JSON.parse(raw) });
      } catch {
        reject(new Error(`Invalid JSON (${res.statusCode}): ${raw}`));
      }
    };

    app(req, res);
    if (payloadStr) req.push(payloadStr);
    req.push(null);
  });
}

test('Federal Coverage: all 28 States & 8 UTs (36 jurisdictions) present and valid', () => {
  assert.equal(JURISDICTIONS.length, 36);
  const states = JURISDICTIONS.filter((j) => j.type === 'State');
  const uts = JURISDICTIONS.filter((j) => j.type === 'UT');
  assert.equal(states.length, 28);
  assert.equal(uts.length, 8);
  assert.ok(JURISDICTION_MAP.UP && JURISDICTION_MAP.MH && JURISDICTION_MAP.DL && JURISDICTION_MAP.LA);
});

test('14-Digit ULPIN (Bhu-Aadhaar) Encoder/Decoder, Checksum & Spatial Geometry Solver', () => {
  const ulpin = encodeUlpin({ stateCode: 'UP', lat: 26.9248, lng: 81.1912, parcelSeq: 402 });
  assert.equal(ulpin.length, 14);
  assert.ok(/^\d{14}$/.test(ulpin));

  const decoded = decodeUlpin(ulpin);
  assert.equal(decoded.valid, true);
  assert.equal(decoded.stateCode, 'UP');
  assert.equal(decoded.parcelSeq, 402);
  assert.ok(Math.abs(decoded.approxLat - 26.9248) < 0.02);

  // Tamper one digit -> checksum must fail
  const tampered = ulpin.slice(0, 13) + String((Number(ulpin[13]) + 1) % 10);
  assert.equal(decodeUlpin(tampered).valid, false);

  // Shoelace polygon area check (at 2.0m/SVG unit scale, 130x100 parcel = ~5.2 Ha schematic block)
  const ha = polygonAreaHectares(parsePolygonPoints('125,112 255,104 268,204 140,214'));
  assert.ok(ha > 4.0 && ha < 6.0);

  // Forest overlap solver: at 0m overlap > 0; at +20m North overlap === 0
  const forestParcel = {
    id: 'BS-UP-406',
    ulpin,
    areaHectares: 0.3,
    isForestZone: true,
    svgPoints: '546,195 688,195 696,315 552,308'
  };
  const atZero = evaluateParcelCorridorIntersection(forestParcel, 0, 60);
  assert.equal(atZero.forestGeoFenceAlert, true);
  assert.ok(atZero.forestOverlapMeters > 10);

  const atNorth20 = evaluateParcelCorridorIntersection(forestParcel, 20, 60);
  assert.equal(atNorth20.forestGeoFenceAlert, false);
  assert.equal(atNorth20.forestOverlapMeters, 0);
});

test('RFCTLARR Schedule I Math, NDVI Spectral Model, IGRS IQR Filter & Reconciled ₹183.5 Cr ROI', () => {
  const ndvi = computeNdviFromBands({ nirReflectance: 0.74, redReflectance: 0.082 });
  assert.ok(ndvi.ndvi > 0.75);

  const igrs = computeIgrsMarketBenchmark({
    circleRatePerHa: 650000,
    comparableDeedsPerHa: [610000, 625000, 645000, 650000, 2400000]
  });
  assert.equal(igrs.outliersRejected, 1);
  assert.equal(igrs.adoptedRatePerHa, 650000);

  // Exact Khasra #402 ₹14,50,000 verification
  const val402 = calculateRfctlarrValuation({
    stateCode: 'UP',
    zone: 'Rural',
    areaHectares: 0.5,
    circleRatePerHa: 650000,
    ndviCropScore: 0.8,
    structureValue: 20000,
    cropValueOverride: 16000,
    lienAmount: 0
  });
  assert.equal(val402.netFarmerPayout, 1450000);
  assert.equal(val402.monthlyAnnuity, 8000);

  // Slide 10 Reconciled Public ROI verification
  const econ = computePublicEconomics({ projectBudgetCr: 1000, psuFeePct: 0.35, track: 'FULL_STATUTORY' });
  assert.equal(econ.manualTotalCr, 195);
  assert.equal(econ.bhoomiTotalCr, 11.5);
  assert.equal(econ.netSavingsCr, 183.5);
  assert.equal(econ.roiMultiple, 52.4);
});

test('SHA-256 Audit Chain Integrity & Tamper Detection', () => {
  const c0 = {
    id: 'AUD-1',
    parcel_id: 'BS-UP-402',
    actor_id: 'DM',
    actor_role: 'collector',
    action: 'INIT',
    detail: 'Clean record',
    vid_token: 'DM-1',
    prev_hash: '0'.repeat(64),
    created_at: '2026-11-26T00:00:00Z'
  };
  c0.entry_hash = computeAuditHash(c0);
  assert.equal(verifyAuditChain([c0]).valid, true);

  const altered = [{ ...c0, detail: 'Silent tamper' }];
  assert.equal(verifyAuditChain(altered).valid, false);
});

test('Full-Stack HTTP API: JWT Auth, RBAC, Statutory Escrow/Forest Blocks, PFMS DBT, IVRS & Audit', async () => {
  // 1. Unauthenticated access blocked (401)
  const unauthRes = await reqJson('/state');
  assert.equal(unauthRes.status, 401);

  // 2. Register new farmer + login verification
  const regEmail = `farmer.${Date.now()}@bhoomi.in`;
  const regRes = await reqJson('/auth/register', {
    method: 'POST',
    body: {
      name: 'Mahesh Kumar',
      email: regEmail,
      password: 'Password123',
      role: 'farmer',
      stateCode: 'UP',
      district: 'Barabanki'
    }
  });
  assert.equal(regRes.status, 201);
  assert.ok(regRes.data.token);
  const farmerToken = regRes.data.token;

  // 3. Farmer RBAC blocks Collector PFMS DBT approval (403)
  const forbiddenDbt = await reqJson('/parcels/BS-UP-402/approve-dbt', {
    method: 'POST',
    token: farmerToken,
    body: {}
  });
  assert.equal(forbiddenDbt.status, 403);

  // 4. Sign Khasra #405 consent + IVRS DTMF action + PMKVY 4.0 enrollment
  const sign405 = await reqJson('/parcels/BS-UP-405/consent', {
    method: 'POST',
    token: farmerToken,
    body: { vidToken: 'VID-3109-6428-9920' }
  });
  assert.equal(sign405.status, 200);
  assert.equal(sign405.data.parcel.consentSigned, true);

  const pmkvyRes = await reqJson('/parcels/BS-UP-405/pm-kaushal', {
    method: 'POST',
    token: farmerToken,
    body: { courseCode: 'PMKVY4-SOL-02' }
  });
  assert.equal(pmkvyRes.status, 200);
  assert.equal(pmkvyRes.data.parcel.pmKaushalEnrolled, true);

  const ivrsRes = await reqJson('/parcels/BS-UP-402/ivrs-action', {
    method: 'POST',
    token: farmerToken,
    body: { key: '2' }
  });
  assert.equal(ivrsRes.status, 200);
  assert.ok(ivrsRes.data.ivrsPrompt.includes('14,50,000'));

  // 5. Collector login via seeded account -> Verify Sec 77 Escrow & Forest Geo-Fence block DBT (409)
  const colLogin = await reqJson('/auth/demo-login', {
    method: 'POST',
    body: { role: 'collector' }
  });
  assert.equal(colLogin.status, 200);
  const collectorToken = colLogin.data.token;

  const escrowBlock = await reqJson('/parcels/BS-UP-403/approve-dbt', {
    method: 'POST',
    token: collectorToken,
    body: {}
  });
  assert.equal(escrowBlock.status, 409);

  const forestBlock = await reqJson('/parcels/BS-UP-406/approve-dbt', {
    method: 'POST',
    token: collectorToken,
    body: {}
  });
  assert.equal(forestBlock.status, 409);

  // 6. Collector approves Khasra #402 PFMS DBT -> Stage 5 + UTR + DILRMP mutation
  const pay402 = await reqJson('/parcels/BS-UP-402/approve-dbt', {
    method: 'POST',
    token: collectorToken,
    body: {}
  });
  assert.equal(pay402.status, 200);
  assert.equal(pay402.data.parcel.stage, 5);
  assert.equal(pay402.data.parcel.disbursementStatus, 'CREDITED_PFMS');
  assert.ok(pay402.data.parcel.pfmsUtr.startsWith('PFMS261126UP'));

  // 7. Agency realigns KML corridor +20m North -> clears Forest Geo-Fence on #406
  const agencyLogin = await reqJson('/auth/demo-login', {
    method: 'POST',
    body: { role: 'agency' }
  });
  const realignRes = await reqJson('/corridors/PRJ-NH44-UP/kml-realign', {
    method: 'POST',
    token: agencyLogin.data.token,
    body: { shiftMeters: 20 }
  });
  assert.equal(realignRes.status, 200);
  const updated406 = realignRes.data.parcels.find((p) => p.id === 'BS-UP-406');
  assert.equal(updated406.forestGeoFenceAlert, false);
  assert.equal(updated406.forestOverlapMeters, 0);

  // 8. Tamper simulation catches unauthorized edit and restores cleanly
  const tamperRes = await reqJson('/audit/tamper', { method: 'POST', token: collectorToken, body: {} });
  assert.equal(tamperRes.data.auditIntegrity.valid, false);
  const restoreRes = await reqJson('/audit/restore', { method: 'POST', token: collectorToken, body: {} });
  assert.equal(restoreRes.data.auditIntegrity.valid, true);

  // 9. Clean reset
  const resetRes = await reqJson('/reset', { method: 'POST', token: collectorToken, body: {} });
  assert.equal(resetRes.status, 200);
  assert.equal(resetRes.data.parcels.find((p) => p.id === 'BS-UP-402').stage, 3);
});
