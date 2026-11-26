import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';

import { calculateRfctlarrValuation } from '../shared/rfctlarrEngine.js';
import { encodeUlpin } from '../shared/ulpinSpatial.js';
import { computeAuditHash, verifyAuditChain, signStatutoryReceipt } from './auditLedger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerless
  ? path.join(os.tmpdir(), 'bhoomi-setu-data')
  : path.resolve(__dirname, '../data');

let sqliteModule = null;
if (!isServerless) {
  try {
    sqliteModule = await import('node:sqlite');
  } catch {
    sqliteModule = null;
  }
}

function buildSeedOperationalState() {
  const now = new Date().toISOString();

  const corridors = [
    {
      id: 'PRJ-NH44-UP',
      name: 'NH-44 Ganga Expressway Feeder (50 km Pilot)',
      sector: 'HIGHWAY',
      agency: 'NHAI (Ministry of Road Transport & Highways)',
      stateCode: 'UP',
      district: 'Barabanki',
      corridorLengthKm: 50,
      budgetCrores: 1000,
      acquisitionTrack: 'DIRECT_CONSENT',
      targetDays: 75,
      elapsedDays: 22,
      corridorShiftMeters: 0,
      kmlUploaded: true,
      siaCompleted: true,
      sec11PublishedAt: '2026-10-15T08:00:00Z',
      sec15WindowEndsAt: '2026-12-14T23:59:59Z',
      status: 'Active Acquisition'
    },
    {
      id: 'PRJ-DFC-MH',
      name: 'Samriddhi-DFCCIL MMLP Freight Link (32 km)',
      sector: 'RAILWAYS',
      agency: 'DFCCIL & Maharashtra Rail Infra',
      stateCode: 'MH',
      district: 'Pune-Ahilyanagar',
      corridorLengthKm: 32,
      budgetCrores: 780,
      acquisitionTrack: 'FULL_STATUTORY',
      targetDays: 210,
      elapsedDays: 68,
      corridorShiftMeters: 0,
      kmlUploaded: true,
      siaCompleted: true,
      sec11PublishedAt: '2026-09-20T08:00:00Z',
      sec15WindowEndsAt: '2026-11-19T23:59:59Z',
      status: 'Disbursement Phase'
    }
  ];

  // Exact RFCTLARR math for Khasra #402 = ₹14,50,000 payout & ₹8,000/mo annuity (matches Deck Slide 07)
  const val402 = calculateRfctlarrValuation({
    stateCode: 'UP',
    zone: 'Rural',
    areaHectares: 0.5,
    circleRatePerHa: 650000,
    sroTrendMultiplier: 1.0,
    ndviCropScore: 0.80,
    structureValue: 20000,
    cropValueOverride: 16000,
    lienAmount: 0,
    comparableDeedsPerHa: [610000, 625000, 640000, 650000]
  });
  val402.monthlyAnnuity = 8000;
  val402.totalAnnuity24M = 8000 * 24;
  val402.totalLifetimeBenefit = val402.netFarmerPayout + val402.totalAnnuity24M;

  const val401 = calculateRfctlarrValuation({
    stateCode: 'UP',
    zone: 'Rural',
    areaHectares: 0.62,
    circleRatePerHa: 650000,
    ndviCropScore: 0.84,
    structureValue: 35000,
    lienAmount: 0,
    comparableDeedsPerHa: [620000, 640000, 650000, 650000]
  });
  val401.monthlyAnnuity = 9500;
  val401.totalAnnuity24M = 9500 * 24;
  val401.totalLifetimeBenefit = val401.netFarmerPayout + val401.totalAnnuity24M;

  const val403 = calculateRfctlarrValuation({
    stateCode: 'UP',
    zone: 'Rural',
    areaHectares: 0.58,
    circleRatePerHa: 650000,
    ndviCropScore: 0.76,
    structureValue: 28000,
    lienAmount: 0,
    comparableDeedsPerHa: [615000, 635000, 650000]
  });

  const val404 = calculateRfctlarrValuation({
    stateCode: 'UP',
    zone: 'Rural',
    areaHectares: 0.45,
    circleRatePerHa: 650000,
    ndviCropScore: 0.71,
    structureValue: 18000,
    lienAmount: 240000,
    comparableDeedsPerHa: [600000, 630000, 650000]
  });

  const val405 = calculateRfctlarrValuation({
    stateCode: 'UP',
    zone: 'Rural',
    areaHectares: 0.4,
    circleRatePerHa: 650000,
    ndviCropScore: 0.78,
    structureValue: 15000,
    lienAmount: 0,
    comparableDeedsPerHa: [620000, 645000, 650000]
  });

  const val406 = calculateRfctlarrValuation({
    stateCode: 'UP',
    zone: 'Rural',
    areaHectares: 0.3,
    circleRatePerHa: 500000,
    ndviCropScore: 0.92,
    structureValue: 0,
    lienAmount: 0
  });

  const valMh118 = calculateRfctlarrValuation({
    stateCode: 'MH',
    zone: 'Rural',
    areaHectares: 0.75,
    circleRatePerHa: 720000,
    sroTrendMultiplier: 1.05,
    ndviCropScore: 0.81,
    structureValue: 55000,
    lienAmount: 0,
    comparableDeedsPerHa: [690000, 710000, 720000]
  });

  const valMh122 = calculateRfctlarrValuation({
    stateCode: 'MH',
    zone: 'Rural',
    areaHectares: 0.52,
    circleRatePerHa: 720000,
    ndviCropScore: 0.74,
    structureValue: 25000,
    lienAmount: 0,
    comparableDeedsPerHa: [680000, 700000, 720000]
  });

  const parcels = [
    {
      id: 'BS-UP-401',
      projectId: 'PRJ-NH44-UP',
      ulpin: encodeUlpin({ stateCode: 'UP', lat: 26.9212, lng: 81.1844, parcelSeq: 401 }),
      lat: 26.9212,
      lng: 81.1844,
      stateCode: 'UP',
      district: 'Barabanki',
      tehsil: 'Nawabganj',
      village: 'Rampur Bhagan',
      recordType: 'Khasra / Khatauni',
      parcelNumber: 'Khasra #401',
      khataNumber: 'Khata-0084',
      farmerName: 'Sunita Devi',
      fatherOrSpouse: 'W/o Late Mahendra Verma',
      aadhaarVid: 'VID-9124-7781-3049',
      mobileMasked: '+91-98XXX-XX412',
      bankAccountMasked: 'SBI A/C •••• 6721 (NPCI APBS Active)',
      ifsc: 'SBIN0004218',
      landClass: 'Irrigated Double-Crop (Wheat/Paddy)',
      zone: 'Rural',
      areaHectares: 0.62,
      nirReflectance: 0.78,
      redReflectance: 0.068,
      comparableDeedsPerHa: [620000, 640000, 650000, 650000],
      stage: 5,
      consentSigned: true,
      consentTimestamp: '2026-11-08T10:14:22Z',
      consentReceiptHmac: signStatutoryReceipt({ parcelId: 'BS-UP-401', vid: 'VID-9124-7781-3049' }),
      collectorApproved: true,
      disbursementStatus: 'CREDITED_PFMS',
      pfmsUtr: 'PFMS261114UP9834102',
      mutationStatus: 'DILRMP_MUTATED_AUTO',
      disputeFlag: false,
      escrowStatus: 'NONE',
      neslLienFlag: false,
      isForestZone: false,
      forestGeoFenceAlert: false,
      forestOverlapMeters: 0,
      pmKaushalEnrolled: true,
      pmKaushalTrack: 'PMKVY 4.0 · Solar PV Grid & Smart Tolling Technician',
      valuation: val401,
      svgPoints: '125,112 255,104 268,204 140,214',
      labelPos: { x: 196, y: 158 },
      smsHistory: [
        'Stage 1: ULPIN Notice served for Khasra #401 under NH-44 Pilot.',
        'Stage 3: Schedule I Award ₹18,62,748 sanctioned.',
        'Stage 4: ₹18,62,748 credited to SBI ••••6721 via PFMS UTR PFMS261114UP9834102.',
        'Stage 5: Transition Annuity ₹9,500/mo × 24 mo + PMKVY 4.0 active.'
      ]
    },
    {
      id: 'BS-UP-402',
      projectId: 'PRJ-NH44-UP',
      ulpin: encodeUlpin({ stateCode: 'UP', lat: 26.9248, lng: 81.1912, parcelSeq: 402 }),
      lat: 26.9248,
      lng: 81.1912,
      stateCode: 'UP',
      district: 'Barabanki',
      tehsil: 'Nawabganj',
      village: 'Rampur Bhagan',
      recordType: 'Khasra / Khatauni',
      parcelNumber: 'Khasra #402',
      khataNumber: 'Khata-0112',
      farmerName: 'Rameshwar Prasad Verma',
      fatherOrSpouse: 'S/o Shri Ramcharan Verma',
      aadhaarVid: 'VID-4820-3391-8421',
      mobileMasked: '+91-94XXX-XX809',
      bankAccountMasked: 'PNB A/C •••• 3914 (NPCI APBS Active)',
      ifsc: 'PUNB0148200',
      landClass: 'Irrigated Multi-Crop + Tubewell',
      zone: 'Rural',
      areaHectares: 0.50,
      nirReflectance: 0.74,
      redReflectance: 0.082,
      comparableDeedsPerHa: [610000, 625000, 640000, 650000],
      stage: 3,
      consentSigned: true,
      consentTimestamp: '2026-11-16T11:42:05Z',
      consentReceiptHmac: signStatutoryReceipt({ parcelId: 'BS-UP-402', vid: 'VID-4820-3391-8421' }),
      collectorApproved: false,
      disbursementStatus: 'ESCROW_READY',
      pfmsUtr: null,
      mutationStatus: 'PENDING_DBT',
      disputeFlag: false,
      escrowStatus: 'NONE',
      neslLienFlag: false,
      isForestZone: false,
      forestGeoFenceAlert: false,
      forestOverlapMeters: 0,
      pmKaushalEnrolled: false,
      pmKaushalTrack: 'Eligible: PMKVY 4.0 Heavy Highway Machinery & Crane Ops',
      valuation: val402,
      svgPoints: '260,104 396,98 408,200 272,204',
      labelPos: { x: 334, y: 152 },
      smsHistory: [
        'Stage 1: Khasra #402 (ULPIN Bhu-Aadhaar) NH-44 corridor me geotag hua.',
        'Stage 2: Aadhaar VID e-Sign consent verified (Zero middlemen).',
        'Stage 3: Schedule I Award ₹14,50,000 + ₹8,000/mo annuity sanction ho gaya hai.'
      ]
    },
    {
      id: 'BS-UP-403',
      projectId: 'PRJ-NH44-UP',
      ulpin: encodeUlpin({ stateCode: 'UP', lat: 26.9281, lng: 81.1984, parcelSeq: 403 }),
      lat: 26.9281,
      lng: 81.1984,
      stateCode: 'UP',
      district: 'Barabanki',
      tehsil: 'Nawabganj',
      village: 'Rampur Bhagan',
      recordType: 'Khasra / Khatauni',
      parcelNumber: 'Khasra #403',
      khataNumber: 'Khata-0149',
      farmerName: 'Harishankar & Co-Heirs',
      fatherOrSpouse: 'Joint Family Partition Claim',
      aadhaarVid: 'VID-6631-1092-5178',
      mobileMasked: '+91-97XXX-XX230',
      bankAccountMasked: 'Sec 77 Court Escrow Pool (SBI)',
      ifsc: 'ESCROW-SBI-UP01',
      landClass: 'Irrigated Agricultural Parcel',
      zone: 'Rural',
      areaHectares: 0.58,
      nirReflectance: 0.71,
      redReflectance: 0.095,
      comparableDeedsPerHa: [615000, 635000, 650000],
      stage: 3,
      consentSigned: false,
      consentTimestamp: null,
      consentReceiptHmac: null,
      collectorApproved: false,
      disbursementStatus: 'LOCKED_COURT_ESCROW',
      pfmsUtr: null,
      mutationStatus: 'SEC77_ESCROW_CORRIDOR_CLEARED',
      disputeFlag: true,
      disputeReason: 'Sibling Partition Suit #2026-CS-441 — Isolated under RFCTLARR Sec 77 Digital Escrow so NH-44 civil works continue with 0 stay.',
      escrowStatus: 'ISOLATED_IN_ESCROW',
      neslLienFlag: false,
      isForestZone: false,
      forestGeoFenceAlert: false,
      forestOverlapMeters: 0,
      pmKaushalEnrolled: false,
      pmKaushalTrack: 'Pending Tribunal Clearance',
      valuation: val403,
      svgPoints: '400,98 536,102 542,196 412,200',
      labelPos: { x: 472, y: 148 },
      smsHistory: [
        'Stage 1: Khasra #403 ULPIN tagged.',
        'Sec 77 Escrow Notice: Title dispute isolated safely in Court Escrow; undisputed corridor cleared.'
      ]
    },
    {
      id: 'BS-UP-404',
      projectId: 'PRJ-NH44-UP',
      ulpin: encodeUlpin({ stateCode: 'UP', lat: 26.9304, lng: 81.2055, parcelSeq: 404 }),
      lat: 26.9304,
      lng: 81.2055,
      stateCode: 'UP',
      district: 'Barabanki',
      tehsil: 'Nawabganj',
      village: 'Daryabad Khas',
      recordType: 'Khasra / Khatauni',
      parcelNumber: 'Khasra #404',
      khataNumber: 'Khata-0203',
      farmerName: 'Mohammed Irfan',
      fatherOrSpouse: 'S/o Shri Abdul Sattar',
      aadhaarVid: 'VID-7721-9045-1182',
      mobileMasked: '+91-99XXX-XX518',
      bankAccountMasked: 'BOB A/C •••• 9182 (NPCI APBS Active)',
      ifsc: 'BARB0BARABA',
      landClass: 'Single-Crop Agricultural',
      zone: 'Rural',
      areaHectares: 0.45,
      nirReflectance: 0.68,
      redReflectance: 0.115,
      comparableDeedsPerHa: [600000, 630000, 650000],
      stage: 2,
      consentSigned: true,
      consentTimestamp: '2026-11-18T14:05:19Z',
      consentReceiptHmac: signStatutoryReceipt({ parcelId: 'BS-UP-404', vid: 'VID-7721-9045-1182' }),
      collectorApproved: false,
      disbursementStatus: 'LIEN_REVIEW_NEEDED',
      pfmsUtr: null,
      mutationStatus: 'PENDING_LIEN_NOC',
      disputeFlag: false,
      escrowStatus: 'NONE',
      neslLienFlag: true,
      neslLienDetails: 'NeSL / CERSAI Flag: Active KCC Loan ₹2,40,000 with Bank of Baroda — Automated split settlement prepared.',
      isForestZone: false,
      forestGeoFenceAlert: false,
      forestOverlapMeters: 0,
      pmKaushalEnrolled: false,
      pmKaushalTrack: 'Eligible: PMKVY 4.0 Agri-Allied Micro-Enterprise + MUDRA',
      valuation: val404,
      svgPoints: '540,102 684,114 678,195 546,195',
      labelPos: { x: 614, y: 148 },
      smsHistory: [
        'Stage 1: Khasra #404 ULPIN geotagged.',
        'NeSL Alert: KCC mortgage ₹2,40,000 verified for direct bank split settlement.'
      ]
    },
    {
      id: 'BS-UP-405',
      projectId: 'PRJ-NH44-UP',
      ulpin: encodeUlpin({ stateCode: 'UP', lat: 26.9255, lng: 81.1928, parcelSeq: 405 }),
      lat: 26.9255,
      lng: 81.1928,
      stateCode: 'UP',
      district: 'Barabanki',
      tehsil: 'Nawabganj',
      village: 'Daryabad Khas',
      recordType: 'Khasra / Khatauni',
      parcelNumber: 'Khasra #405',
      khataNumber: 'Khata-0271',
      farmerName: 'Kamla Devi',
      fatherOrSpouse: 'W/o Shri Ramavatar Yadav',
      aadhaarVid: 'VID-3109-6428-9920',
      mobileMasked: '+91-88XXX-XX174',
      bankAccountMasked: 'Union Bank •••• 2205 (NPCI APBS Active)',
      ifsc: 'UBIN0541920',
      landClass: 'Irrigated Vegetable & Crop Land',
      zone: 'Rural',
      areaHectares: 0.40,
      nirReflectance: 0.73,
      redReflectance: 0.088,
      comparableDeedsPerHa: [620000, 645000, 650000],
      stage: 1,
      consentSigned: false,
      consentTimestamp: null,
      consentReceiptHmac: null,
      collectorApproved: false,
      disbursementStatus: 'AWAITING_FARMER_CONSENT',
      pfmsUtr: null,
      mutationStatus: 'DILRMP_LOCKED',
      disputeFlag: false,
      escrowStatus: 'NONE',
      neslLienFlag: false,
      isForestZone: false,
      forestGeoFenceAlert: false,
      forestOverlapMeters: 0,
      pmKaushalEnrolled: false,
      pmKaushalTrack: 'Eligible: PMKVY 4.0 MMLP Logistics & Retail Kiosk',
      valuation: val405,
      svgPoints: '266,210 412,206 420,308 272,315',
      labelPos: { x: 342, y: 260 },
      smsHistory: [
        'Stage 1: Khasra #405 identified via ISRO Bhuvan & ULPIN scan. Press 3 on Toll-Free IVRS or tap BhoomiTracker to e-Sign consent.'
      ]
    },
    {
      id: 'BS-UP-406',
      projectId: 'PRJ-NH44-UP',
      ulpin: encodeUlpin({ stateCode: 'UP', lat: 26.9319, lng: 81.2089, parcelSeq: 406 }),
      lat: 26.9319,
      lng: 81.2089,
      stateCode: 'UP',
      district: 'Barabanki',
      tehsil: 'Nawabganj',
      village: 'Van-Kshetra Buffer',
      recordType: 'Khasra / Forest Geo-Fence',
      parcelNumber: 'Khasra #406',
      khataNumber: 'Forest-Buffer-09',
      farmerName: 'MoEFCC Notified Reserve Forest Margin',
      fatherOrSpouse: 'Protected Eco-Sensitive Zone',
      aadhaarVid: 'GOV-MOEFCC-ZONE',
      mobileMasked: 'DFO Office Barabanki',
      bankAccountMasked: 'N/A — Protected Geo-Fence',
      ifsc: 'N/A',
      landClass: 'Eco-Sensitive Forest Margin (NDVI 0.92)',
      zone: 'Rural',
      areaHectares: 0.30,
      nirReflectance: 0.86,
      redReflectance: 0.036,
      comparableDeedsPerHa: [500000],
      stage: 1,
      consentSigned: false,
      consentTimestamp: null,
      consentReceiptHmac: null,
      collectorApproved: false,
      disbursementStatus: 'GEO_FENCE_BLOCKED',
      pfmsUtr: null,
      mutationStatus: 'REALIGNMENT_ADVISORY',
      disputeFlag: false,
      escrowStatus: 'NONE',
      neslLienFlag: false,
      isForestZone: true,
      forestGeoFenceAlert: true,
      forestOverlapMeters: 18,
      forestAlertDetails: 'ISRO Bhuvan Geo-Fence Alert: 18m overlap with notified Reserve Forest margin. Shift KML corridor +20m North to eliminate Wildlife/NGT stay.',
      pmKaushalEnrolled: false,
      pmKaushalTrack: 'N/A',
      valuation: val406,
      svgPoints: '546,195 688,195 696,315 552,308',
      labelPos: { x: 620, y: 256 },
      smsHistory: []
    },
    {
      id: 'BS-MH-118',
      projectId: 'PRJ-DFC-MH',
      ulpin: encodeUlpin({ stateCode: 'MH', lat: 18.7492, lng: 74.2814, parcelSeq: 118 }),
      lat: 18.7492,
      lng: 74.2814,
      stateCode: 'MH',
      district: 'Pune',
      tehsil: 'Shirur',
      village: 'Ranjangaon Ganpati',
      recordType: 'Satbara 7/12 / Gat No.',
      parcelNumber: 'Satbara 7/12 #118',
      khataNumber: 'Gat-118/2B',
      farmerName: 'Tukaram Pandurang Patil',
      fatherOrSpouse: 'S/o Shri Pandurang Patil',
      aadhaarVid: 'VID-5518-2901-7410',
      mobileMasked: '+91-98XXX-XX902',
      bankAccountMasked: 'Bank of Maharashtra •••• 5018 (APBS Active)',
      ifsc: 'MAHB0000412',
      landClass: 'Irrigated Sugarcane & Horticulture',
      zone: 'Rural',
      areaHectares: 0.75,
      nirReflectance: 0.79,
      redReflectance: 0.082,
      comparableDeedsPerHa: [690000, 710000, 720000],
      stage: 5,
      consentSigned: true,
      consentTimestamp: '2026-11-12T09:30:00Z',
      consentReceiptHmac: signStatutoryReceipt({ parcelId: 'BS-MH-118', vid: 'VID-5518-2901-7410' }),
      collectorApproved: true,
      disbursementStatus: 'CREDITED_PFMS',
      pfmsUtr: 'PFMS261120MH4412098',
      mutationStatus: 'MAHABHULEKH_SYNC_DONE',
      disputeFlag: false,
      escrowStatus: 'NONE',
      neslLienFlag: false,
      isForestZone: false,
      forestGeoFenceAlert: false,
      forestOverlapMeters: 0,
      pmKaushalEnrolled: true,
      pmKaushalTrack: 'PMKVY 4.0 · MMLP Warehouse & Cold-Chain Supervisor',
      valuation: valMh118,
      svgPoints: '140,120 320,112 332,235 152,244',
      labelPos: { x: 234, y: 178 },
      smsHistory: [
        'Stage 3: Satbara 7/12 #118 Schedule I Award sanctioned.',
        'Stage 4: PFMS UTR PFMS261120MH4412098 credited; Mahabhulekh mutated.'
      ]
    },
    {
      id: 'BS-MH-122',
      projectId: 'PRJ-DFC-MH',
      ulpin: encodeUlpin({ stateCode: 'MH', lat: 19.0044, lng: 74.4421, parcelSeq: 122 }),
      lat: 19.0044,
      lng: 74.4421,
      stateCode: 'MH',
      district: 'Ahilyanagar',
      tehsil: 'Parner',
      village: 'Supa Industrial Corridor',
      recordType: 'Satbara 7/12 / Gat No.',
      parcelNumber: 'Satbara 7/12 #122',
      khataNumber: 'Gat-122/1A',
      farmerName: 'Savitabai Deshmukh',
      fatherOrSpouse: 'W/o Shri Vitthal Deshmukh',
      aadhaarVid: 'VID-8840-1129-6034',
      mobileMasked: '+91-95XXX-XX331',
      bankAccountMasked: 'SBI Pune •••• 8841 (APBS Active)',
      ifsc: 'SBIN0001120',
      landClass: 'Semi-Irrigated Onion & Soyabean',
      zone: 'Rural',
      areaHectares: 0.52,
      nirReflectance: 0.72,
      redReflectance: 0.108,
      comparableDeedsPerHa: [680000, 700000, 720000],
      stage: 3,
      consentSigned: true,
      consentTimestamp: '2026-11-21T16:12:40Z',
      consentReceiptHmac: signStatutoryReceipt({ parcelId: 'BS-MH-122', vid: 'VID-8840-1129-6034' }),
      collectorApproved: false,
      disbursementStatus: 'ESCROW_READY',
      pfmsUtr: null,
      mutationStatus: 'PENDING_DBT',
      disputeFlag: false,
      escrowStatus: 'NONE',
      neslLienFlag: false,
      isForestZone: false,
      forestGeoFenceAlert: false,
      forestOverlapMeters: 0,
      pmKaushalEnrolled: false,
      pmKaushalTrack: 'Eligible: PMKVY 4.0 Solar PV Grid Technician',
      valuation: valMh122,
      svgPoints: '345,112 530,108 542,232 356,238',
      labelPos: { x: 444, y: 174 },
      smsHistory: [
        'Stage 2: Aadhaar VID e-Sign verified on Mahabhulekh sync.',
        'Stage 3: Schedule I Award published — ready for Collector PFMS release.'
      ]
    }
  ];

  const objections = [
    {
      id: 'SEC15-2026-104',
      parcelId: 'BS-UP-404',
      parcelNumber: 'Khasra #404',
      farmerName: 'Mohammed Irfan',
      sectionRef: 'RFCTLARR Sec 15 / NeSL Split',
      category: 'Bank Lien / NeSL Split Verification',
      summary: 'Requested confirmation that only ₹2,40,000 KCC balance routes to Bank of Baroda and remaining award credits directly to personal account.',
      status: 'OPEN',
      triageStage: 'CALA_TRIAGE_DAY_2_OF_15',
      daysOpen: 2,
      blocksDisbursement: false,
      escalatedToDm: false,
      escalatedToLarr: false,
      createdAt: '2026-11-24T09:15:00Z'
    },
    {
      id: 'SEC15-2026-098',
      parcelId: 'BS-UP-403',
      parcelNumber: 'Khasra #403',
      farmerName: 'Harishankar & Co-Heirs',
      sectionRef: 'RFCTLARR Sec 77 & Sec 51',
      category: 'Title Dispute Escrow Release',
      summary: 'Submitted Tehsildar partition settlement memorandum for release from Sec 77 Digital Court Escrow.',
      status: 'ESCALATED_DM',
      triageStage: 'DM_SLA_DAY_9_OF_15',
      daysOpen: 9,
      blocksDisbursement: true,
      escalatedToDm: true,
      escalatedToLarr: false,
      createdAt: '2026-11-17T11:00:00Z'
    }
  ];

  const auditSeeds = [
    {
      actor_id: 'MEGHRAJ-NIC-CORE',
      actor_role: 'system',
      action: 'GENESIS_NODE_INIT',
      parcel_id: 'NATIONAL-CORE',
      detail: 'Initialized MeghRaj NIC Cloud Primary DC (New Delhi) + DR (Hyderabad) under DPDP Act 2023 (RPO < 5m).',
      vid_token: 'SYSTEM-G2G'
    },
    {
      actor_id: 'NHAI-CORRIDOR-01',
      actor_role: 'agency',
      action: 'GATISHAKTI_KML_INGEST',
      parcel_id: 'PRJ-NH44-UP',
      detail: '50 km NH-44 KML ingested on PM GatiShakti; 6 ULPIN (Bhu-Aadhaar) parcels auto-extracted via UP Bhulekh.',
      vid_token: 'G2G-NHAI-AUTH'
    },
    {
      actor_id: 'RAMESHWAR-VERMA',
      actor_role: 'farmer',
      action: 'AADHAAR_VID_ESIGN',
      parcel_id: 'BS-UP-402',
      detail: 'Sec 2(2) Digital Consent signed via zero-PII UIDAI VID tokenization with HMAC-SHA256 receipt.',
      vid_token: 'VID-4820-3391-8421'
    },
    {
      actor_id: 'CALA-UP-044',
      actor_role: 'officer',
      action: 'SCHEDULE_I_AWARD_SIGNED',
      parcel_id: 'BS-UP-402',
      detail: 'Schedule I Award sanctioned ₹14,50,000 (2x Rural + Assets + 100% Solatium + 12% Sec 30(3) Interest).',
      vid_token: 'CALA-DSC-UP44'
    },
    {
      actor_id: 'NIC-DM-UP09',
      actor_role: 'collector',
      action: 'PFMS_DBT_AND_DILRMP_MUTATION',
      parcel_id: 'BS-UP-401',
      detail: '₹18,62,748 credited via PFMS UTR PFMS261114UP9834102; DILRMP auto-mutated; ₹9,500/mo annuity active.',
      vid_token: 'DM-DSC-UP09'
    },
    {
      actor_id: 'NIC-DM-UP09',
      actor_role: 'collector',
      action: 'SEC77_ESCROW_ISOLATION',
      parcel_id: 'BS-UP-403',
      detail: 'Partition suit isolated in RFCTLARR Sec 77 Digital Court Escrow; remaining corridor continues with zero stay.',
      vid_token: 'DM-DSC-UP09'
    }
  ];

  const auditLogs = [];
  auditSeeds.forEach((s, idx) => {
    const id = `AUD-${String(idx + 1).padStart(4, '0')}`;
    const created_at = new Date(Date.now() - (auditSeeds.length - idx) * 3600 * 1000).toISOString();
    const prev_hash = idx === 0 ? '0'.repeat(64) : auditLogs[idx - 1].entry_hash;
    const entry = {
      seq: idx + 1,
      id,
      parcel_id: s.parcel_id,
      actor_id: s.actor_id,
      actor_role: s.actor_role,
      action: s.action,
      detail: s.detail,
      vid_token: s.vid_token,
      prev_hash,
      created_at
    };
    entry.entry_hash = computeAuditHash(entry);
    auditLogs.push(entry);
  });

  return {
    corridors,
    parcels,
    objections,
    auditLogs,
    metrics: {
      kmlScansRun: 1,
      offlineSyncCount: 0,
      tamperSimulationActive: false,
      tamperBackup: null
    },
    seededAt: now
  };
}

class BhoomiStore {
  constructor() {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    this.useSqlite = Boolean(sqliteModule?.DatabaseSync);
    if (this.useSqlite) {
      this.dbPath = path.join(DATA_DIR, 'bhoomi-setu.db');
      this.sqlite = new sqliteModule.DatabaseSync(this.dbPath);
      this.initSqliteSchema();
    } else {
      this.jsonPath = path.join(DATA_DIR, 'bhoomi-setu.json');
      this.mem = this.loadJson();
    }
    this.seedIfEmpty();
  }

  initSqliteSchema() {
    this.sqlite.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        credential_code TEXT,
        state_code TEXT NOT NULL,
        district TEXT NOT NULL,
        phone TEXT,
        vid_token TEXT,
        linked_parcel_id TEXT,
        preferred_lang TEXT DEFAULT 'hi',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY,
        json_value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }

  loadJson() {
    if (fs.existsSync(this.jsonPath)) {
      try {
        return JSON.parse(fs.readFileSync(this.jsonPath, 'utf8'));
      } catch {
        return { users: [], operational: null };
      }
    }
    return { users: [], operational: null };
  }

  saveJson() {
    if (!this.useSqlite) {
      fs.writeFileSync(this.jsonPath, JSON.stringify(this.mem, null, 2));
    }
  }

  seedIfEmpty() {
    const userCount = this.useSqlite
      ? this.sqlite.prepare('SELECT COUNT(*) AS c FROM users').get().c
      : this.mem.users.length;

    if (userCount === 0) {
      const demoPassHash = bcrypt.hashSync('BhoomiSetu@2026', 10);
      const now = new Date().toISOString();
      const seedUsers = [
        {
          id: 'usr-collector-up',
          name: 'Rajeshwari IAS, District Magistrate',
          email: 'collector@bhoomi.gov.in',
          password_hash: demoPassHash,
          role: 'collector',
          credential_code: 'NIC-DM-UP09',
          state_code: 'UP',
          district: 'Barabanki',
          phone: '+91-94150-00109',
          vid_token: 'DM-DSC-SIG-2026',
          linked_parcel_id: null,
          preferred_lang: 'en',
          created_at: now
        },
        {
          id: 'usr-officer-up',
          name: 'Arvind Shukla, Special LAO (CALA)',
          email: 'officer@bhoomi.gov.in',
          password_hash: demoPassHash,
          role: 'officer',
          credential_code: 'CALA-UP-044',
          state_code: 'UP',
          district: 'Barabanki',
          phone: '+91-94150-00441',
          vid_token: 'CALA-DSC-UP44',
          linked_parcel_id: null,
          preferred_lang: 'en',
          created_at: now
        },
        {
          id: 'usr-farmer-rameshwar',
          name: 'Rameshwar Prasad Verma',
          email: 'rameshwar@farmer.in',
          password_hash: demoPassHash,
          role: 'farmer',
          credential_code: 'VID-4820-3391-8421',
          state_code: 'UP',
          district: 'Barabanki',
          phone: '+91-94512-00809',
          vid_token: 'VID-4820-3391-8421',
          linked_parcel_id: 'BS-UP-402',
          preferred_lang: 'hi',
          created_at: now
        },
        {
          id: 'usr-farmer-kamla',
          name: 'Kamla Devi',
          email: 'kamla@farmer.in',
          password_hash: demoPassHash,
          role: 'farmer',
          credential_code: 'VID-3109-6428-9920',
          state_code: 'UP',
          district: 'Barabanki',
          phone: '+91-88401-00174',
          vid_token: 'VID-3109-6428-9920',
          linked_parcel_id: 'BS-UP-405',
          preferred_lang: 'hi',
          created_at: now
        },
        {
          id: 'usr-agency-nhai',
          name: 'Vikramaditya Rao, CGM (NHAI)',
          email: 'nhai@gatishakti.gov.in',
          password_hash: demoPassHash,
          role: 'agency',
          credential_code: 'NHAI-G2G-01',
          state_code: 'UP',
          district: 'Lucknow-Barabanki',
          phone: '+91-98110-10044',
          vid_token: 'G2G-NHAI-AUTH',
          linked_parcel_id: null,
          preferred_lang: 'en',
          created_at: now
        }
      ];

      if (this.useSqlite) {
        const stmt = this.sqlite.prepare(`
          INSERT INTO users (id, name, email, password_hash, role, credential_code, state_code, district, phone, vid_token, linked_parcel_id, preferred_lang, created_at)
          VALUES (@id, @name, @email, @password_hash, @role, @credential_code, @state_code, @district, @phone, @vid_token, @linked_parcel_id, @preferred_lang, @created_at)
        `);
        for (const u of seedUsers) stmt.run(u);
      } else {
        this.mem.users = seedUsers;
        this.saveJson();
      }
    }

    const existingState = this.getOperationalStateRaw();
    if (!existingState) {
      this.saveOperationalState(buildSeedOperationalState());
    }
  }

  getOperationalStateRaw() {
    if (this.useSqlite) {
      const row = this.sqlite.prepare("SELECT json_value FROM app_state WHERE key = 'operational'").get();
      return row ? JSON.parse(row.json_value) : null;
    }
    return this.mem.operational || null;
  }

  getOperationalState() {
    const raw = this.getOperationalStateRaw();
    if (!raw) {
      const fresh = buildSeedOperationalState();
      this.saveOperationalState(fresh);
      return fresh;
    }
    return raw;
  }

  saveOperationalState(opState) {
    const now = new Date().toISOString();
    if (this.useSqlite) {
      this.sqlite
        .prepare(
          `INSERT INTO app_state (key, json_value, updated_at)
           VALUES ('operational', @json_value, @updated_at)
           ON CONFLICT(key) DO UPDATE SET json_value = @json_value, updated_at = @updated_at`
        )
        .run({ json_value: JSON.stringify(opState), updated_at: now });
    } else {
      this.mem.operational = opState;
      this.saveJson();
    }
    return opState;
  }

  resetOperationalState() {
    return this.saveOperationalState(buildSeedOperationalState());
  }

  appendAuditEntry(opState, { actorId, actorRole, action, parcelId, detail, vidToken }) {
    const chain = opState.auditLogs;
    const prev = chain[chain.length - 1];
    const seq = chain.length + 1;
    const id = `AUD-${String(seq).padStart(4, '0')}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const entry = {
      seq,
      id,
      parcel_id: parcelId || 'NATIONAL-CORE',
      actor_id: actorId || 'SYSTEM',
      actor_role: actorRole || 'system',
      action,
      detail,
      vid_token: vidToken || 'SYSTEM-G2G',
      prev_hash: prev ? prev.entry_hash : '0'.repeat(64),
      created_at: new Date().toISOString()
    };
    entry.entry_hash = computeAuditHash(entry);
    chain.push(entry);
    return entry;
  }

  getAuditSummary(opState) {
    const integrity = verifyAuditChain(opState.auditLogs);
    return {
      integrity,
      entries: [...opState.auditLogs].reverse()
    };
  }

  getUserByEmail(email) {
    const clean = String(email || '').trim().toLowerCase();
    return this.useSqlite
      ? this.sqlite.prepare('SELECT * FROM users WHERE lower(email) = ?').get(clean)
      : this.mem.users.find((u) => u.email.toLowerCase() === clean) || null;
  }

  getUserById(id) {
    return this.useSqlite
      ? this.sqlite.prepare('SELECT * FROM users WHERE id = ?').get(id)
      : this.mem.users.find((u) => u.id === id) || null;
  }

  listDemoAccounts() {
    const rows = this.useSqlite
      ? this.sqlite
          .prepare(
            'SELECT id, name, email, role, credential_code, state_code, district, vid_token, linked_parcel_id, preferred_lang FROM users'
          )
          .all()
      : this.mem.users;
    return rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      credentialCode: u.credential_code,
      stateCode: u.state_code,
      district: u.district,
      vidToken: u.vid_token,
      linkedParcelId: u.linked_parcel_id,
      preferredLang: u.preferred_lang
    }));
  }

  createUser(userObj) {
    if (this.useSqlite) {
      this.sqlite
        .prepare(
          `INSERT INTO users (id, name, email, password_hash, role, credential_code, state_code, district, phone, vid_token, linked_parcel_id, preferred_lang, created_at)
           VALUES (@id, @name, @email, @password_hash, @role, @credential_code, @state_code, @district, @phone, @vid_token, @linked_parcel_id, @preferred_lang, @created_at)`
        )
        .run(userObj);
    } else {
      this.mem.users.push(userObj);
      this.saveJson();
    }
    return this.getUserById(userObj.id);
  }

  updateUser(id, patch) {
    const allowed = ['name', 'state_code', 'district', 'phone', 'preferred_lang', 'linked_parcel_id'];
    const entries = Object.entries(patch).filter(([k, v]) => allowed.includes(k) && v !== undefined);
    if (entries.length === 0) return this.getUserById(id);
    if (this.useSqlite) {
      const sets = entries.map(([k]) => `${k} = @${k}`).join(', ');
      const params = Object.fromEntries(entries);
      params.id = id;
      this.sqlite.prepare(`UPDATE users SET ${sets} WHERE id = @id`).run(params);
    } else {
      const u = this.mem.users.find((x) => x.id === id);
      if (u) {
        for (const [k, v] of entries) u[k] = v;
        this.saveJson();
      }
    }
    return this.getUserById(id);
  }
}

export const db = new BhoomiStore();
