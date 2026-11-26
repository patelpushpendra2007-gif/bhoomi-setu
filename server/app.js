import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import {
  JURISDICTIONS,
  JURISDICTION_MAP,
  CORRIDOR_SECTORS,
  PMKVY_COURSES,
  INDIA_STACK_GATEWAYS,
  DECK_BENCHMARKS
} from '../shared/revenueCodes.js';
import {
  encodeUlpin,
  decodeUlpin,
  evaluateParcelCorridorIntersection,
  polygonAreaHectares
} from '../shared/ulpinSpatial.js';
import {
  calculateRfctlarrValuation,
  computeNdviFromBands,
  computeIgrsMarketBenchmark
} from '../shared/rfctlarrEngine.js';
import {
  validateDisbursementGate,
  computeCorridorReadiness,
  ACQUISITION_TRACKS
} from '../shared/statutoryEngine.js';
import { computePublicEconomics } from '../shared/economicsModel.js';
import { db } from './db.js';
import {
  signAuthToken,
  sanitizeUser,
  hashPassword,
  comparePassword,
  requireAuth,
  requireRole,
  verifyStakeholderCredential
} from './auth.js';
import { generateVidToken, signStatutoryReceipt } from './auditLedger.js';
import { addSseClient, broadcastEvent } from './sseHub.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));

function generatePfmsUtr(stateCode) {
  const rand = Math.floor(1000000 + Math.random() * 9000000);
  return `PFMS261126${stateCode}${rand}`;
}

function buildStateSnapshot(opState) {
  const auditSummary = db.getAuditSummary(opState);
  const corridorsWithReadiness = opState.corridors.map((c) => {
    const cParcels = opState.parcels.filter((p) => p.projectId === c.id);
    return {
      ...c,
      readiness: computeCorridorReadiness(cParcels)
    };
  });

  return {
    corridors: corridorsWithReadiness,
    parcels: opState.parcels,
    objections: opState.objections,
    auditIntegrity: auditSummary.integrity,
    auditLogs: auditSummary.entries,
    metrics: opState.metrics,
    gateways: INDIA_STACK_GATEWAYS,
    cloudStatus: {
      primaryDc: 'MeghRaj NIC Cloud — New Delhi (Active)',
      disasterRecovery: 'NIC Cloud — Hyderabad (Active-Active)',
      rpoMinutes: '< 5 min',
      rtoMinutes: '< 30 min',
      uptimeSla: '99.95%',
      compliance: 'DPDP Act 2023 + AES-256 + UIDAI VID'
    },
    serverTime: new Date().toISOString()
  };
}

function executeParcelAction(opState, actionType, parcelId, body = {}, actor = null) {
  const parcel = opState.parcels.find((p) => p.id === parcelId);

  if (actionType === 'CONSENT') {
    if (!parcel) throw new Error('Parcel not found');
    const vid = body.vidToken || parcel.aadhaarVid || generateVidToken(parcel.id);
    parcel.consentSigned = true;
    parcel.consentTimestamp = new Date().toISOString();
    parcel.consentReceiptHmac = signStatutoryReceipt({
      parcelId: parcel.id,
      ulpin: parcel.ulpin,
      vid,
      ts: parcel.consentTimestamp
    });
    if (parcel.stage < 2) parcel.stage = 2;
    if (parcel.stage === 2 && !parcel.neslLienFlag && !parcel.disputeFlag && !parcel.forestGeoFenceAlert) {
      parcel.stage = 3;
      parcel.disbursementStatus = 'ESCROW_READY';
    }
    parcel.smsHistory.push(
      `Stage 2: Aadhaar VID (${vid}) e-Sign verified [HMAC ${parcel.consentReceiptHmac.slice(0, 10)}]. Award ₹${parcel.valuation.netFarmerPayout.toLocaleString('en-IN')} queued.`
    );
    db.appendAuditEntry(opState, {
      actorId: actor?.credential_code || parcel.farmerName.toUpperCase().replace(/\s+/g, '-'),
      actorRole: actor?.role || 'farmer',
      action: 'AADHAAR_VID_ESIGN_CONSENT',
      parcelId: parcel.id,
      detail: `Sec 2(2) Consent signed for ${parcel.parcelNumber} (ULPIN ${parcel.ulpin}) via VID tokenization.`,
      vidToken: vid
    });
    return parcel;
  }

  if (actionType === 'VALUATION') {
    if (!parcel) throw new Error('Parcel not found');
    let ndviScore = Number(body.ndviCropScore ?? parcel.valuation.ndviCropScore);
    if (body.nirReflectance !== undefined && body.redReflectance !== undefined) {
      const ndviObj = computeNdviFromBands({
        nirReflectance: Number(body.nirReflectance),
        redReflectance: Number(body.redReflectance)
      });
      ndviScore = ndviObj.ndvi;
      parcel.nirReflectance = ndviObj.nir;
      parcel.redReflectance = ndviObj.red;
    }

    const updated = calculateRfctlarrValuation({
      stateCode: body.stateCode || parcel.stateCode,
      zone: body.zone || parcel.zone,
      areaHectares: Number(body.areaHectares ?? parcel.areaHectares),
      circleRatePerHa: Number(body.circleRatePerHa ?? parcel.valuation.circleRatePerHa),
      sroTrendMultiplier: Number(body.sroTrendMultiplier ?? parcel.valuation.sroTrendMultiplier),
      ndviCropScore: ndviScore,
      structureValue: Number(body.structureValue ?? parcel.valuation.structureValue),
      cropValueOverride: body.cropValueOverride !== undefined ? Number(body.cropValueOverride) : null,
      lienAmount: Number(body.lienAmount ?? parcel.valuation.bankLienDeduction),
      assessmentDays: Number(body.assessmentDays ?? parcel.valuation.assessmentDays ?? 365),
      comparableDeedsPerHa: body.comparableDeedsPerHa || parcel.comparableDeedsPerHa || []
    });
    parcel.zone = updated.zone;
    parcel.areaHectares = updated.areaHectares;
    parcel.valuation = updated;
    parcel.neslLienFlag = updated.bankLienDeduction > 0;
    if (parcel.stage < 3 && parcel.consentSigned && !parcel.forestGeoFenceAlert) {
      parcel.stage = 3;
      parcel.disbursementStatus = parcel.disputeFlag ? 'LOCKED_COURT_ESCROW' : 'ESCROW_READY';
    }
    parcel.smsHistory.push(
      `Stage 3: RFCTLARR Schedule I Award updated to ₹${updated.netFarmerPayout.toLocaleString('en-IN')} (+ ₹${updated.monthlyAnnuity.toLocaleString('en-IN')}/mo annuity).`
    );
    db.appendAuditEntry(opState, {
      actorId: actor?.credential_code || 'CALA-UP-044',
      actorRole: actor?.role || 'officer',
      action: 'SCHEDULE_I_VALUATION_SIGNED',
      parcelId: parcel.id,
      detail: `Schedule I Award recalculated for ${parcel.parcelNumber}: Net ₹${updated.netFarmerPayout.toLocaleString('en-IN')}, Solatium ₹${updated.solatiumAmount.toLocaleString('en-IN')}, Annuity ₹${updated.monthlyAnnuity.toLocaleString('en-IN')}/mo.`,
      vidToken: actor?.vid_token || 'CALA-DSC-UP44'
    });
    return parcel;
  }

  if (actionType === 'APPROVE_DBT') {
    const gate = validateDisbursementGate(parcel, opState.objections);
    if (!gate.allowed) {
      const err = new Error(gate.reason);
      err.status = gate.status;
      throw err;
    }
    if (!parcel.consentSigned) {
      parcel.consentSigned = true;
      parcel.consentTimestamp = new Date().toISOString();
      parcel.consentReceiptHmac = signStatutoryReceipt({
        parcelId: parcel.id,
        ulpin: parcel.ulpin,
        vid: parcel.aadhaarVid
      });
    }
    parcel.collectorApproved = true;
    parcel.stage = 5;
    parcel.disbursementStatus = 'CREDITED_PFMS';
    parcel.pfmsUtr = generatePfmsUtr(parcel.stateCode);
    parcel.mutationStatus =
      parcel.stateCode === 'MH' ? 'MAHABHULEKH_SYNC_DONE' : 'DILRMP_ULPIN_MUTATED';
    parcel.neslLienFlag = false;
    parcel.smsHistory.push(
      `Stage 4: ₹${parcel.valuation.netFarmerPayout.toLocaleString('en-IN')} credited via PFMS UTR ${parcel.pfmsUtr} (24-Hr DBT).`,
      `Stage 5: Transition Annuity ₹${parcel.valuation.monthlyAnnuity.toLocaleString('en-IN')}/mo active for 24 months. ULPIN RoR mutated.`
    );
    db.appendAuditEntry(opState, {
      actorId: actor?.credential_code || `DM-${parcel.district.toUpperCase()}`,
      actorRole: 'collector',
      action: 'PFMS_24HR_DBT_AND_DILRMP_MUTATION',
      parcelId: parcel.id,
      detail: `Collector sanctioned PFMS DBT ₹${parcel.valuation.netFarmerPayout.toLocaleString('en-IN')} (UTR ${parcel.pfmsUtr}); DILRMP ULPIN mutated; ₹${parcel.valuation.monthlyAnnuity.toLocaleString('en-IN')}/mo annuity live.`,
      vidToken: actor?.vid_token || 'DM-DSC-SIG-2026'
    });
    return parcel;
  }

  if (actionType === 'ESCROW_TOGGLE') {
    if (!parcel) throw new Error('Parcel not found');
    if (parcel.escrowStatus === 'ISOLATED_IN_ESCROW') {
      parcel.disputeFlag = false;
      parcel.escrowStatus = 'TRIBUNAL_RESOLVED';
      parcel.disbursementStatus = 'ESCROW_READY';
      parcel.mutationStatus = 'READY_FOR_DBT';
      parcel.smsHistory.push('LARR / Tribunal Order synced: Sec 77 Escrow unlocked for PFMS DBT release.');
      db.appendAuditEntry(opState, {
        actorId: actor?.credential_code || 'DIGITAL-LARR-TRIBUNAL',
        actorRole: 'collector',
        action: 'SEC77_ESCROW_RELEASED',
        parcelId: parcel.id,
        detail: `Title dispute resolved for ${parcel.parcelNumber}. Sec 77 Escrow unlocked for direct PFMS disbursement.`,
        vidToken: actor?.vid_token || 'TRIBUNAL-DSC-01'
      });
    } else {
      parcel.disputeFlag = true;
      parcel.escrowStatus = 'ISOLATED_IN_ESCROW';
      parcel.disbursementStatus = 'LOCKED_COURT_ESCROW';
      parcel.mutationStatus = 'SEC77_ESCROW_CORRIDOR_CLEARED';
      parcel.disputeReason =
        body.reason ||
        'Title dispute isolated under RFCTLARR Sec 77 Digital Court Escrow; remaining corridor continues unhindered.';
      parcel.smsHistory.push(
        `Sec 77 Escrow Isolation: Award for ${parcel.parcelNumber} deposited safely in Digital Court Escrow.`
      );
      db.appendAuditEntry(opState, {
        actorId: actor?.credential_code || 'NIC-DM-UP09',
        actorRole: 'collector',
        action: 'SEC77_ESCROW_ISOLATION',
        parcelId: parcel.id,
        detail: `${parcel.parcelNumber} isolated under RFCTLARR Sec 77 Escrow (₹${parcel.valuation.grossAward.toLocaleString('en-IN')}); corridor proceeds with zero stay.`,
        vidToken: actor?.vid_token || 'DM-DSC-SIG-2026'
      });
    }
    return parcel;
  }

  if (actionType === 'PM_KAUSHAL') {
    if (!parcel) throw new Error('Parcel not found');
    const course =
      PMKVY_COURSES.find((c) => c.code === body.courseCode) ||
      PMKVY_COURSES.find((c) => c.title === body.track) ||
      PMKVY_COURSES[0];
    parcel.pmKaushalEnrolled = true;
    parcel.pmKaushalTrack = body.track || course.title;
    parcel.smsHistory.push(
      `PMKVY 4.0 (NSDC): Family member enrolled in "${parcel.pmKaushalTrack}" with Schedule II hiring preference.`
    );
    db.appendAuditEntry(opState, {
      actorId: actor?.credential_code || parcel.farmerName.toUpperCase().replace(/\s+/g, '-'),
      actorRole: actor?.role || 'farmer',
      action: 'PMKVY_4_SKILL_ENROLLMENT',
      parcelId: parcel.id,
      detail: `Enrolled beneficiary household in ${parcel.pmKaushalTrack} under Schedule II R&R.`,
      vidToken: parcel.aadhaarVid
    });
    return parcel;
  }

  if (actionType === 'CREATE_OBJECTION') {
    const targetParcel = opState.parcels.find((p) => p.id === (body.parcelId || parcelId)) || opState.parcels[0];
    const obj = {
      id: `SEC15-2026-${105 + opState.objections.length}`,
      parcelId: targetParcel.id,
      parcelNumber: targetParcel.parcelNumber,
      farmerName: targetParcel.farmerName,
      sectionRef: body.sectionRef || 'RFCTLARR Sec 15 (60-Day Window)',
      category: body.category || 'Valuation / Award Verification',
      summary: body.summary || 'Filed via BhoomiTracker for 7–15 day CALA/DM fast-track triage.',
      status: 'OPEN',
      triageStage: 'CALA_TRIAGE_DAY_1_OF_15',
      daysOpen: 1,
      blocksDisbursement: Boolean(body.blocksDisbursement),
      escalatedToDm: false,
      escalatedToLarr: false,
      createdAt: new Date().toISOString()
    };
    opState.objections.unshift(obj);
    db.appendAuditEntry(opState, {
      actorId: actor?.credential_code || targetParcel.farmerName.toUpperCase().replace(/\s+/g, '-'),
      actorRole: actor?.role || 'farmer',
      action: 'SEC15_OBJECTION_FILED',
      parcelId: targetParcel.id,
      detail: `${obj.id} filed (${obj.sectionRef}): ${obj.category}. 7–15 day CALA/DM triage clock started.`,
      vidToken: targetParcel.aadhaarVid
    });
    return obj;
  }

  throw new Error(`Unknown action type: ${actionType}`);
}

// ============================================================================
// PUBLIC HEALTH & REFERENCE METADATA
// ============================================================================
app.get('/api/health', (_req, res) => {
  const op = db.getOperationalState();
  const integrity = db.getAuditSummary(op).integrity;
  res.json({
    ok: true,
    service: 'BHOOMI-SETU v3.0 Full-Stack Backend',
    storage: db.useSqlite ? 'node:sqlite' : 'tmp-json-fallback',
    jurisdictionsCount: JURISDICTIONS.length,
    auditChainValid: integrity.valid,
    auditEntries: integrity.totalEntries,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/reference-data', (_req, res) => {
  res.json({
    jurisdictions: JURISDICTIONS,
    sectors: CORRIDOR_SECTORS,
    pmkvyCourses: PMKVY_COURSES,
    gateways: INDIA_STACK_GATEWAYS,
    benchmarks: DECK_BENCHMARKS,
    acquisitionTracks: ACQUISITION_TRACKS
  });
});

// ============================================================================
// AUTHENTICATION & RBAC
// ============================================================================
app.get('/api/auth/demo-accounts', (_req, res) => {
  res.json({ accounts: db.listDemoAccounts() });
});

app.post('/api/auth/demo-login', (req, res) => {
  const { userId, email, role } = req.body || {};
  let user = userId ? db.getUserById(userId) : email ? db.getUserByEmail(email) : null;
  if (!user && role) {
    const firstByRole = db.listDemoAccounts().find((a) => a.role === role);
    if (firstByRole) user = db.getUserById(firstByRole.id);
  }
  if (!user) return res.status(404).json({ error: 'Demo stakeholder account not found.' });

  const token = signAuthToken(user);
  const op = db.getOperationalState();
  db.appendAuditEntry(op, {
    actorId: user.credential_code || user.id,
    actorRole: user.role,
    action: 'STAKEHOLDER_SSO_LOGIN',
    parcelId: user.linked_parcel_id || 'NATIONAL-CORE',
    detail: `${user.name} (${user.role.toUpperCase()}) authenticated via MeghRaj Sandbox Switcher.`,
    vidToken: user.vid_token || 'MEGHRAJ-SSO'
  });
  db.saveOperationalState(op);

  res.json({ token, user: sanitizeUser(user) });
});

app.post('/api/auth/register', async (req, res) => {
  const {
    name,
    email,
    password,
    role = 'farmer',
    credentialCode = '',
    stateCode = 'UP',
    district = 'Barabanki',
    phone = '',
    preferredLang = 'hi'
  } = req.body || {};

  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ error: 'Full name (minimum 2 characters) is required.' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'A valid official or personal email address is required.' });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  if (!['collector', 'officer', 'farmer', 'agency'].includes(role)) {
    return res.status(400).json({ error: 'Role must be collector, officer, farmer, or agency.' });
  }
  if (db.getUserByEmail(email)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const credCheck = verifyStakeholderCredential(role, credentialCode);
  if (!credCheck.verified) {
    return res.status(400).json({ error: credCheck.error });
  }

  const jur = JURISDICTION_MAP[stateCode] || JURISDICTION_MAP.UP;
  const passwordHash = await hashPassword(String(password));
  const vidToken = role === 'farmer' && credCheck.code.startsWith('VID-') ? credCheck.code : generateVidToken(email);
  const userId = `usr-${role}-${crypto.randomBytes(4).toString('hex')}`;

  const created = db.createUser({
    id: userId,
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    password_hash: passwordHash,
    role,
    credential_code: credCheck.code === 'VID-AUTO-PROVISIONED' ? vidToken : credCheck.code,
    state_code: jur.code,
    district: String(district || jur.name).trim(),
    phone: String(phone || '+91-98XXX-XX100').trim(),
    vid_token: vidToken,
    linked_parcel_id: role === 'farmer' ? 'BS-UP-405' : null,
    preferred_lang: preferredLang || jur.defaultLang || 'hi',
    created_at: new Date().toISOString()
  });

  const token = signAuthToken(created);
  const op = db.getOperationalState();
  db.appendAuditEntry(op, {
    actorId: created.credential_code || created.id,
    actorRole: created.role,
    action: 'STAKEHOLDER_REGISTERED',
    parcelId: 'NATIONAL-CORE',
    detail: `New ${created.role} enrolled in ${jur.name} (${created.district}) with tokenized VID ${vidToken}.`,
    vidToken
  });
  db.saveOperationalState(op);

  res.status(201).json({ token, user: sanitizeUser(created) });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const user = db.getUserByEmail(email);
  if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

  const ok = await comparePassword(String(password), user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });

  const token = signAuthToken(user);
  const op = db.getOperationalState();
  db.appendAuditEntry(op, {
    actorId: user.credential_code || user.id,
    actorRole: user.role,
    action: 'JWT_AUTH_LOGIN',
    parcelId: user.linked_parcel_id || 'NATIONAL-CORE',
    detail: `${user.name} signed in via MeghRaj JWT authentication.`,
    vidToken: user.vid_token || 'JWT-AUTH'
  });
  db.saveOperationalState(op);

  res.json({ token, user: sanitizeUser(user) });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

app.patch('/api/auth/profile', requireAuth, (req, res) => {
  const { name, stateCode, district, phone, preferredLang } = req.body || {};
  const patch = {};
  if (name) patch.name = String(name).trim();
  if (stateCode && JURISDICTION_MAP[stateCode]) patch.state_code = stateCode;
  if (district) patch.district = String(district).trim();
  if (phone) patch.phone = String(phone).trim();
  if (preferredLang) patch.preferred_lang = String(preferredLang).trim();

  const updated = db.updateUser(req.user.id, patch);
  res.json({ user: sanitizeUser(updated) });
});

app.get('/api/auth/verify-credential/:role/:code', (req, res) => {
  const result = verifyStakeholderCredential(req.params.role, decodeURIComponent(req.params.code));
  res.status(result.verified ? 200 : 400).json(result);
});

// ============================================================================
// OPERATIONAL STATE, SSE STREAM & CORRIDORS
// ============================================================================
app.get('/api/state', requireAuth, (_req, res) => {
  const op = db.getOperationalState();
  res.json(buildStateSnapshot(op));
});

app.get('/api/events', requireAuth, (req, res) => {
  addSseClient(res, req.user);
});

app.post('/api/corridors', requireAuth, requireRole('agency', 'collector', 'officer'), (req, res) => {
  const {
    name,
    sector = 'HIGHWAY',
    agency,
    stateCode = 'UP',
    district = 'Lucknow',
    corridorLengthKm = 40,
    budgetCrores = 850,
    acquisitionTrack = 'FULL_STATUTORY'
  } = req.body || {};

  if (!name || String(name).trim().length < 4) {
    return res.status(400).json({ error: 'Corridor name (min 4 characters) is required.' });
  }

  const jur = JURISDICTION_MAP[stateCode] || JURISDICTION_MAP.UP;
  const trackMeta = ACQUISITION_TRACKS[acquisitionTrack] || ACQUISITION_TRACKS.FULL_STATUTORY;
  const op = db.getOperationalState();
  const id = `PRJ-${jur.code}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  const corridor = {
    id,
    name: String(name).trim(),
    sector,
    agency: String(agency || `${jur.name} Infrastructure Authority`).trim(),
    stateCode: jur.code,
    district: String(district).trim(),
    corridorLengthKm: Math.max(1, Number(corridorLengthKm) || 40),
    budgetCrores: Math.max(50, Number(budgetCrores) || 850),
    acquisitionTrack: trackMeta.id,
    targetDays: trackMeta.targetDays,
    elapsedDays: 1,
    corridorShiftMeters: 0,
    kmlUploaded: true,
    siaCompleted: !trackMeta.requiresSia,
    sec11PublishedAt: new Date().toISOString(),
    sec15WindowEndsAt: new Date(Date.now() + trackMeta.sec15WindowDays * 86400000).toISOString(),
    status: 'Active Acquisition'
  };
  op.corridors.unshift(corridor);

  // Auto-extract 3 ULPIN parcels in the selected State/UT with realistic SVG polygons
  const sampleOwners = [
    { name: 'Prakash Narayan Singh', area: 0.55, stage: 3, consent: true, dispute: false, lien: 0 },
    { name: 'Lakshmi Bai & Sons', area: 0.48, stage: 1, consent: false, dispute: false, lien: 0 },
    { name: 'Suresh Chandra Joint Khata', area: 0.62, stage: 3, consent: false, dispute: true, lien: 0 }
  ];
  const polyTemplates = [
    { pts: '130,115 305,108 318,225 142,232', label: { x: 224, y: 170 } },
    { pts: '315,108 495,105 508,220 328,225', label: { x: 412, y: 164 } },
    { pts: '505,105 680,118 674,230 516,220', label: { x: 594, y: 168 } }
  ];

  sampleOwners.forEach((tmpl, idx) => {
    const seq = 701 + idx;
    const lat = 20.5 + (Number(jur.lgd) % 10) * 0.6 + idx * 0.012;
    const lng = 74.2 + (Number(jur.lgd) % 8) * 0.7 + idx * 0.015;
    const ulpin = encodeUlpin({ stateCode: jur.code, lat, lng, parcelSeq: seq });
    const val = calculateRfctlarrValuation({
      stateCode: jur.code,
      zone: 'Rural',
      areaHectares: tmpl.area,
      circleRatePerHa: jur.defaultCircleRatePerHa,
      ndviCropScore: 0.77,
      structureValue: 22000,
      lienAmount: tmpl.lien
    });

    op.parcels.push({
      id: `BS-${jur.code}-${seq}-${crypto.randomBytes(1).toString('hex').toUpperCase()}`,
      projectId: corridor.id,
      ulpin,
      lat,
      lng,
      stateCode: jur.code,
      district: corridor.district,
      tehsil: `${corridor.district} Sadar`,
      village: `Sector-${idx + 1} Revenue Block`,
      recordType: jur.recordTerm,
      parcelNumber: `${jur.recordTerm.split('/')[0].trim()} #${seq}`,
      khataNumber: `RoR-${seq}`,
      farmerName: tmpl.name,
      fatherOrSpouse: 'DILRMP Verified Khatedar',
      aadhaarVid: generateVidToken(`${corridor.id}-${seq}`),
      mobileMasked: `+91-98XXX-XX${710 + idx}`,
      bankAccountMasked: 'SBI A/C •••• 4410 (NPCI APBS Active)',
      ifsc: 'SBIN0001024',
      landClass: 'Irrigated Agricultural Holding',
      zone: 'Rural',
      areaHectares: tmpl.area,
      nirReflectance: 0.76,
      redReflectance: 0.085,
      comparableDeedsPerHa: [jur.defaultCircleRatePerHa * 0.94, jur.defaultCircleRatePerHa],
      stage: tmpl.stage,
      consentSigned: tmpl.consent,
      consentTimestamp: tmpl.consent ? new Date().toISOString() : null,
      consentReceiptHmac: tmpl.consent ? signStatutoryReceipt({ ulpin }) : null,
      collectorApproved: false,
      disbursementStatus: tmpl.dispute
        ? 'LOCKED_COURT_ESCROW'
        : tmpl.consent
          ? 'ESCROW_READY'
          : 'AWAITING_FARMER_CONSENT',
      pfmsUtr: null,
      mutationStatus: tmpl.dispute ? 'SEC77_ESCROW_CORRIDOR_CLEARED' : 'PENDING_DBT',
      disputeFlag: tmpl.dispute,
      disputeReason: tmpl.dispute
        ? 'Co-heir partition claim isolated under Sec 77 Digital Escrow; corridor clear.'
        : null,
      escrowStatus: tmpl.dispute ? 'ISOLATED_IN_ESCROW' : 'NONE',
      neslLienFlag: false,
      isForestZone: false,
      forestGeoFenceAlert: false,
      forestOverlapMeters: 0,
      pmKaushalEnrolled: false,
      pmKaushalTrack: 'Eligible: PMKVY 4.0 Heavy Highway Machinery & Crane Ops',
      valuation: val,
      svgPoints: polyTemplates[idx].pts,
      labelPos: polyTemplates[idx].label,
      smsHistory: [
        `Stage 1: ULPIN ${ulpin} auto-extracted via ${jur.portalName} for ${corridor.name}.`
      ]
    });
  });

  db.appendAuditEntry(op, {
    actorId: req.user.credential_code || req.user.id,
    actorRole: req.user.role,
    action: 'GATISHAKTI_CORRIDOR_LAUNCHED',
    parcelId: corridor.id,
    detail: `Launched ${corridor.name} (${jur.name}, ${corridor.corridorLengthKm} km, ₹${corridor.budgetCrores} Cr) & auto-extracted 3 ULPIN parcels.`,
    vidToken: req.user.vid_token || 'G2G-CORRIDOR'
  });
  db.saveOperationalState(op);
  const snapshot = buildStateSnapshot(op);
  broadcastEvent('state_updated', { reason: 'corridor_created', corridorId: corridor.id });
  res.status(201).json({ corridor, ...snapshot });
});

app.post('/api/corridors/:id/kml-realign', requireAuth, requireRole('agency', 'officer', 'collector'), (req, res) => {
  const op = db.getOperationalState();
  const corridor = op.corridors.find((c) => c.id === req.params.id);
  if (!corridor) return res.status(404).json({ error: 'Corridor not found.' });

  const shiftMeters =
    req.body?.shiftMeters !== undefined
      ? Math.max(-30, Math.min(40, Number(req.body.shiftMeters) || 0))
      : corridor.corridorShiftMeters;

  corridor.corridorShiftMeters = shiftMeters;
  corridor.kmlUploaded = true;
  op.metrics.kmlScansRun += 1;

  const corridorParcels = op.parcels.filter((p) => p.projectId === corridor.id);
  const intersections = corridorParcels.map((p) => {
    const geom = evaluateParcelCorridorIntersection(p, shiftMeters, 60);
    if (p.isForestZone) {
      p.forestOverlapMeters = geom.forestOverlapMeters;
      p.forestGeoFenceAlert = geom.forestGeoFenceAlert;
      if (geom.forestGeoFenceAlert) {
        p.disbursementStatus = 'GEO_FENCE_BLOCKED';
        p.mutationStatus = 'REALIGNMENT_ADVISORY';
        p.forestAlertDetails = `ISRO Bhuvan Geo-Fence Alert: ${geom.forestOverlapMeters}m overlap with Reserve Forest margin. Shift KML corridor +${geom.recommendedNorthShiftM}m North to avoid Wildlife/NGT stay.`;
      } else {
        p.disbursementStatus = 'FOREST_BYPASSED_CLEAR';
        p.mutationStatus = 'NO_ACQUISITION_NEEDED';
        p.forestAlertDetails = `Bypassed cleanly via +${shiftMeters}m North KML realignment (0.0m Reserve Forest overlap).`;
      }
    }
    return geom;
  });

  db.appendAuditEntry(op, {
    actorId: req.user.credential_code || req.user.id,
    actorRole: req.user.role,
    action: 'ISRO_BHUVAN_KML_SCAN',
    parcelId: corridor.id,
    detail: `Corridor KML scanned (alignment shift: ${shiftMeters >= 0 ? `+${shiftMeters}m North` : `${shiftMeters}m South`}); ${corridorParcels.length} ULPIN parcels intersected in 2.4s.`,
    vidToken: req.user.vid_token || 'G2G-ISRO-BHUVAN'
  });
  db.saveOperationalState(op);

  const snapshot = buildStateSnapshot(op);
  broadcastEvent('state_updated', { reason: 'kml_realigned', corridorId: corridor.id });
  res.json({
    corridor,
    intersections,
    scannedCount: corridorParcels.length,
    ...snapshot
  });
});

// ============================================================================
// REAL WORKING COMPUTATIONAL MODEL LAB ENDPOINTS
// ============================================================================
app.post('/api/models/ulpin-lookup', requireAuth, (req, res) => {
  const { mode = 'decode', ulpin, stateCode = 'UP', lat = 26.9248, lng = 81.1912, parcelSeq = 402, svgPoints } =
    req.body || {};

  if (mode === 'encode') {
    const generated = encodeUlpin({ stateCode, lat: Number(lat), lng: Number(lng), parcelSeq: Number(parcelSeq) });
    const decoded = decodeUlpin(generated);
    const areaHa = svgPoints ? polygonAreaHectares(svgPoints.split(/\s+/).map((s) => {
      const [x, y] = s.split(',').map(Number);
      return { x, y };
    }).filter((pt) => Number.isFinite(pt.x) && Number.isFinite(pt.y))) : null;
    return res.json({ encoded: generated, decoded, computedAreaHa: areaHa });
  }

  const decoded = decodeUlpin(ulpin);
  if (!decoded.valid) return res.status(400).json(decoded);

  const op = db.getOperationalState();
  const matchedParcel = op.parcels.find((p) => p.ulpin === decoded.ulpin) || null;
  res.json({ decoded, matchedParcel });
});

app.post('/api/models/rfctlarr-simulate', requireAuth, (req, res) => {
  const {
    stateCode = 'UP',
    zone = 'Rural',
    areaHectares = 0.5,
    circleRatePerHa = 650000,
    nirReflectance = 0.74,
    redReflectance = 0.082,
    structureValue = 20000,
    lienAmount = 0,
    assessmentDays = 365,
    comparableDeedsPerHa = [610000, 625000, 645000, 650000],
    projectBudgetCr = 1000,
    psuFeePct = 0.35,
    track = 'FULL_STATUTORY'
  } = req.body || {};

  const ndvi = computeNdviFromBands({ nirReflectance, redReflectance });
  const igrs = computeIgrsMarketBenchmark({ circleRatePerHa, comparableDeedsPerHa });
  const valuation = calculateRfctlarrValuation({
    stateCode,
    zone,
    areaHectares,
    circleRatePerHa,
    ndviCropScore: ndvi.ndvi,
    structureValue,
    lienAmount,
    assessmentDays,
    comparableDeedsPerHa
  });
  const economics = computePublicEconomics({ projectBudgetCr, psuFeePct, track });
  res.json({ ndvi, igrs, valuation, economics });
});

// ============================================================================
// PARCEL WORKFLOWS: CONSENT, VALUATION, PFMS DBT, SEC 77 ESCROW, PMKVY 4.0, IVRS
// ============================================================================
app.post('/api/parcels/:id/consent', requireAuth, requireRole('farmer', 'officer', 'collector'), (req, res) => {
  try {
    const op = db.getOperationalState();
    const parcel = executeParcelAction(op, 'CONSENT', req.params.id, req.body, req.user);
    db.saveOperationalState(op);
    broadcastEvent('state_updated', { reason: 'consent', parcelId: parcel.id });
    res.json({ parcel, ...buildStateSnapshot(op) });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

app.post('/api/parcels/:id/valuation', requireAuth, requireRole('officer', 'collector'), (req, res) => {
  try {
    const op = db.getOperationalState();
    const parcel = executeParcelAction(op, 'VALUATION', req.params.id, req.body, req.user);
    db.saveOperationalState(op);
    broadcastEvent('state_updated', { reason: 'valuation', parcelId: parcel.id });
    res.json({ parcel, ...buildStateSnapshot(op) });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

app.post('/api/parcels/:id/approve-dbt', requireAuth, requireRole('collector'), (req, res) => {
  try {
    const op = db.getOperationalState();
    const parcel = executeParcelAction(op, 'APPROVE_DBT', req.params.id, req.body, req.user);
    db.saveOperationalState(op);
    broadcastEvent('state_updated', { reason: 'pfms_dbt', parcelId: parcel.id });
    res.json({ parcel, ...buildStateSnapshot(op) });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

app.post('/api/collector/batch-disburse', requireAuth, requireRole('collector'), (req, res) => {
  const op = db.getOperationalState();
  const projectId = req.body?.projectId || null;
  const candidates = op.parcels.filter((p) => {
    if (projectId && p.projectId !== projectId) return false;
    if (!p.consentSigned) return false;
    return validateDisbursementGate(p, op.objections).allowed;
  });

  for (const c of candidates) {
    executeParcelAction(op, 'APPROVE_DBT', c.id, {}, req.user);
  }
  db.saveOperationalState(op);
  broadcastEvent('state_updated', { reason: 'batch_dbt', count: candidates.length });
  res.json({
    disbursedCount: candidates.length,
    disbursedIds: candidates.map((c) => c.id),
    ...buildStateSnapshot(op)
  });
});

app.post('/api/parcels/:id/escrow', requireAuth, requireRole('collector', 'officer'), (req, res) => {
  try {
    const op = db.getOperationalState();
    const parcel = executeParcelAction(op, 'ESCROW_TOGGLE', req.params.id, req.body, req.user);
    db.saveOperationalState(op);
    broadcastEvent('state_updated', { reason: 'escrow', parcelId: parcel.id });
    res.json({ parcel, ...buildStateSnapshot(op) });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

app.post('/api/parcels/:id/pm-kaushal', requireAuth, requireRole('farmer', 'officer', 'collector'), (req, res) => {
  try {
    const op = db.getOperationalState();
    const parcel = executeParcelAction(op, 'PM_KAUSHAL', req.params.id, req.body, req.user);
    db.saveOperationalState(op);
    broadcastEvent('state_updated', { reason: 'pmkvy', parcelId: parcel.id });
    res.json({ parcel, ...buildStateSnapshot(op) });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

app.post('/api/parcels/:id/ivrs-action', requireAuth, (req, res) => {
  const op = db.getOperationalState();
  const parcel = op.parcels.find((p) => p.id === req.params.id);
  if (!parcel) return res.status(404).json({ error: 'Parcel not found.' });

  const key = String(req.body?.key || '1');
  let ivrsPrompt = '';

  if (key === '1') {
    ivrsPrompt = `IVRS Press 1: ${parcel.parcelNumber} (ULPIN ${parcel.ulpin}) is at Stage ${parcel.stage}/5 (${parcel.disbursementStatus}).`;
  } else if (key === '2') {
    const v = parcel.valuation;
    ivrsPrompt = `IVRS Press 2: Schedule I Award ₹${v.netFarmerPayout.toLocaleString('en-IN')} = Multiplied Land ₹${v.multipliedValue.toLocaleString('en-IN')} + 100% Solatium ₹${v.solatiumAmount.toLocaleString('en-IN')} + 12% Interest ₹${v.statutoryInterest12Pct.toLocaleString('en-IN')}. Annuity ₹${v.monthlyAnnuity.toLocaleString('en-IN')}/mo.`;
  } else if (key === '3') {
    if (!parcel.consentSigned && !parcel.disputeFlag && !parcel.forestGeoFenceAlert) {
      executeParcelAction(op, 'CONSENT', parcel.id, { vidToken: parcel.aadhaarVid }, req.user);
      ivrsPrompt = `IVRS Press 3: Aadhaar VID OTP verified via Toll-Free voice line. Consent signed for ${parcel.parcelNumber}!`;
    } else {
      ivrsPrompt = `IVRS Press 3: Consent already recorded or parcel is held under statutory review (${parcel.disbursementStatus}).`;
    }
  } else {
    const obj = executeParcelAction(
      op,
      'CREATE_OBJECTION',
      parcel.id,
      {
        parcelId: parcel.id,
        sectionRef: 'IVRS 7–15 Day CALA Callback',
        category: 'Feature-Phone IVRS Callback Request',
        summary: 'Landowner pressed 4 on toll-free IVRS requesting CALA / CSC Bhoomi Mitra field callback.'
      },
      req.user
    );
    ivrsPrompt = `IVRS Press 4: Ticket ${obj.id} logged for 7–15 day CALA/DM callback on ${parcel.mobileMasked}.`;
  }

  parcel.smsHistory.push(ivrsPrompt);
  db.saveOperationalState(op);
  broadcastEvent('state_updated', { reason: 'ivrs', parcelId: parcel.id });
  res.json({ key, ivrsPrompt, parcel, ...buildStateSnapshot(op) });
});

// ============================================================================
// SEC 15 OBJECTIONS, 7-15 DAY CALA/DM TRIAGE & SEC 51 LARR AUTHORITY
// ============================================================================
app.post('/api/objections', requireAuth, (req, res) => {
  try {
    const op = db.getOperationalState();
    const objection = executeParcelAction(op, 'CREATE_OBJECTION', req.body?.parcelId, req.body, req.user);
    db.saveOperationalState(op);
    broadcastEvent('state_updated', { reason: 'objection_created', objectionId: objection.id });
    res.status(201).json({ objection, ...buildStateSnapshot(op) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/objections/:id/triage', requireAuth, requireRole('officer', 'collector'), (req, res) => {
  const op = db.getOperationalState();
  const obj = op.objections.find((o) => o.id === req.params.id);
  if (!obj) return res.status(404).json({ error: 'Objection ticket not found.' });

  obj.status = 'ESCALATED_DM';
  obj.escalatedToDm = true;
  obj.daysOpen = Math.max(obj.daysOpen, 7);
  obj.triageStage = 'DM_7_TO_15_DAY_SLA_ACTIVE';

  db.appendAuditEntry(op, {
    actorId: req.user.credential_code || req.user.id,
    actorRole: req.user.role,
    action: 'CALA_DM_7_15_DAY_TRIAGE',
    parcelId: obj.parcelId,
    detail: `${obj.id} (${obj.parcelNumber}) fast-tracked to District Collector 7–15 day triage hearing.`,
    vidToken: req.user.vid_token || 'DM-DSC-SIG-2026'
  });
  db.saveOperationalState(op);
  broadcastEvent('state_updated', { reason: 'objection_triage', objectionId: obj.id });
  res.json(buildStateSnapshot(op));
});

app.post('/api/objections/:id/escalate-larr', requireAuth, requireRole('collector', 'officer'), (req, res) => {
  const op = db.getOperationalState();
  const obj = op.objections.find((o) => o.id === req.params.id);
  if (!obj) return res.status(404).json({ error: 'Objection ticket not found.' });

  obj.status = 'REFERRED_LARR_SEC51';
  obj.escalatedToDm = true;
  obj.escalatedToLarr = true;
  obj.daysOpen = 15;
  obj.triageStage = 'LARR_AUTHORITY_SEC51';

  db.appendAuditEntry(op, {
    actorId: req.user.credential_code || req.user.id,
    actorRole: req.user.role,
    action: 'SEC51_LARR_AUTHORITY_REFERRAL',
    parcelId: obj.parcelId,
    detail: `${obj.id} (${obj.parcelNumber}) referred to statutory LARR Authority under RFCTLARR Sec 51 after 15-day DM triage.`,
    vidToken: req.user.vid_token || 'DM-DSC-SIG-2026'
  });
  db.saveOperationalState(op);
  broadcastEvent('state_updated', { reason: 'objection_larr', objectionId: obj.id });
  res.json(buildStateSnapshot(op));
});

app.post('/api/objections/:id/resolve', requireAuth, requireRole('collector', 'officer'), (req, res) => {
  const op = db.getOperationalState();
  const obj = op.objections.find((o) => o.id === req.params.id);
  if (!obj) return res.status(404).json({ error: 'Objection ticket not found.' });

  obj.status = 'RESOLVED';
  obj.blocksDisbursement = false;
  obj.triageStage = 'RESOLVED_WITHIN_SLA';

  db.appendAuditEntry(op, {
    actorId: req.user.credential_code || req.user.id,
    actorRole: req.user.role,
    action: 'SEC15_OBJECTION_RESOLVED',
    parcelId: obj.parcelId,
    detail: `${obj.id} (${obj.parcelNumber}) resolved by Collectorate / CALA within statutory SLA.`,
    vidToken: req.user.vid_token || 'DM-DSC-SIG-2026'
  });
  db.saveOperationalState(op);
  broadcastEvent('state_updated', { reason: 'objection_resolved', objectionId: obj.id });
  res.json(buildStateSnapshot(op));
});

// ============================================================================
// CRYPTOGRAPHIC AUDIT LEDGER, OFFLINE SYNC & RESET
// ============================================================================
app.get('/api/audit', requireAuth, (_req, res) => {
  const op = db.getOperationalState();
  res.json(db.getAuditSummary(op));
});

app.post('/api/audit/tamper', requireAuth, (_req, res) => {
  const op = db.getOperationalState();
  if (!op.metrics.tamperBackup && op.auditLogs.length > 2) {
    const idx = Math.min(3, op.auditLogs.length - 1);
    op.metrics.tamperBackup = {
      index: idx,
      originalDetail: op.auditLogs[idx].detail
    };
    op.auditLogs[idx].detail =
      '[UNAUTHORIZED SQL EDIT ATTEMPT] Circle rate reduced silently by 40% & timestamp backdated.';
    op.metrics.tamperSimulationActive = true;
    db.saveOperationalState(op);
    broadcastEvent('state_updated', { reason: 'audit_tampered' });
  }
  res.json(buildStateSnapshot(op));
});

app.post('/api/audit/restore', requireAuth, (_req, res) => {
  const op = db.getOperationalState();
  const backup = op.metrics.tamperBackup;
  if (backup && op.auditLogs[backup.index]) {
    op.auditLogs[backup.index].detail = backup.originalDetail;
  }
  op.metrics.tamperBackup = null;
  op.metrics.tamperSimulationActive = false;
  db.saveOperationalState(op);
  broadcastEvent('state_updated', { reason: 'audit_restored' });
  res.json(buildStateSnapshot(op));
});

app.post('/api/sync-queue', requireAuth, (req, res) => {
  const op = db.getOperationalState();
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  let synced = 0;
  for (const item of items) {
    try {
      executeParcelAction(op, item.actionType, item.parcelId, item.payload || {}, req.user);
      synced += 1;
    } catch {
      // Ignore stale or conflicting queued action while preserving valid records
    }
  }
  op.metrics.offlineSyncCount += synced;
  db.saveOperationalState(op);
  broadcastEvent('state_updated', { reason: 'offline_sync', synced });
  res.json({ synced, ...buildStateSnapshot(op) });
});

app.post('/api/reset', requireAuth, (_req, res) => {
  const fresh = db.resetOperationalState();
  broadcastEvent('state_updated', { reason: 'reset' });
  res.json({ message: 'BhoomiSetu operational state reset cleanly.', ...buildStateSnapshot(fresh) });
});

// ============================================================================
// STATIC FRONTEND & SPA FALLBACK
// ============================================================================
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

export default app;
