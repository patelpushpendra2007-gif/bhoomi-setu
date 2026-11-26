/**
 * Complete 28 States + 8 Union Territories (36 Jurisdictions) Legal Harmonization Registry.
 * Maps Entry 18 (State Land List) revenue systems into unified Entry 42 / RFCTLARR Act 2013
 * Schedule I multipliers, ULPIN (Bhu-Aadhaar) LGD codes, and State RoR API portals.
 */

export const JURISDICTIONS = [
  // 28 States
  { code: 'AP', lgd: '28', type: 'State', name: 'Andhra Pradesh', revenueAct: 'AP Rights in Land & Pattadar Pass Books Act, 1971', portalName: 'Meebhoomi (DILRMP / Webland)', recordTerm: 'Adangal / 1B / Survey No.', ruralFactor: 1.5, urbanFactor: 1.0, defaultCircleRatePerHa: 680000, defaultAnnuityMonthly: 10000, defaultLang: 'te' },
  { code: 'AR', lgd: '12', type: 'State', name: 'Arunachal Pradesh', revenueAct: 'Arunachal Pradesh Land Settlement & Records Act, 2000', portalName: 'AR Land Records (DILRMP)', recordTerm: 'LPC / Dag & Patta No.', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 420000, defaultAnnuityMonthly: 8500, defaultLang: 'en' },
  { code: 'AS', lgd: '18', type: 'State', name: 'Assam', revenueAct: 'Assam Land & Revenue Regulation, 1886 (Mission Basundhara)', portalName: 'Dharitree (Mission Basundhara API)', recordTerm: 'Dag / Patta / Jamabandi', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 540000, defaultAnnuityMonthly: 9000, defaultLang: 'as' },
  { code: 'BR', lgd: '10', type: 'State', name: 'Bihar', revenueAct: 'Bihar Land Mutation Act, 2011 (Harmonized w/ RFCTLARR)', portalName: 'Bihar Bhumi (Jamabandi API)', recordTerm: 'Jamabandi / Khata / Khesra', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 580000, defaultAnnuityMonthly: 8500, defaultLang: 'hi' },
  { code: 'CG', lgd: '22', type: 'State', name: 'Chhattisgarh', revenueAct: 'CG Land Revenue Code, 1959', portalName: 'Bhuiyan (DILRMP Sync)', recordTerm: 'Khasra / B-1 / P-II', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 520000, defaultAnnuityMonthly: 8500, defaultLang: 'hi' },
  { code: 'GA', lgd: '30', type: 'State', name: 'Goa', revenueAct: 'Goa Land Revenue Code, 1968', portalName: 'Dhara / e-Dharni Goa', recordTerm: 'Form I & XIV / Survey No.', ruralFactor: 1.5, urbanFactor: 1.0, defaultCircleRatePerHa: 1250000, defaultAnnuityMonthly: 12500, defaultLang: 'mr' },
  { code: 'GJ', lgd: '24', type: 'State', name: 'Gujarat', revenueAct: 'Gujarat Land Revenue Code, 1879 (RFCTLARR Rules 2016)', portalName: 'AnyRoR Gujarat (e-Dhara)', recordTerm: '7/12 / 8A / Survey No.', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 780000, defaultAnnuityMonthly: 11500, defaultLang: 'gu' },
  { code: 'HR', lgd: '06', type: 'State', name: 'Haryana', revenueAct: 'Punjab Land Revenue Act, 1887 (Haryana Rules)', portalName: 'Jamabandi Haryana (Web-HALRIS)', recordTerm: 'Jamabandi / Khewat / Khasra', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 950000, defaultAnnuityMonthly: 12000, defaultLang: 'hi' },
  { code: 'HP', lgd: '02', type: 'State', name: 'Himachal Pradesh', revenueAct: 'HP Land Revenue Act, 1954', portalName: 'Himbhoomi (DILRMP Sync)', recordTerm: 'Jamabandi / Khasra Girdawari', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 610000, defaultAnnuityMonthly: 9500, defaultLang: 'hi' },
  { code: 'JH', lgd: '20', type: 'State', name: 'Jharkhand', revenueAct: 'CNT/SPT Harmonized & Jharkhand RFCTLARR Rules', portalName: 'Jharbhoomi (DILRMP)', recordTerm: 'Khata / Khatiyan / Plot No.', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 510000, defaultAnnuityMonthly: 8500, defaultLang: 'hi' },
  { code: 'KA', lgd: '29', type: 'State', name: 'Karnataka', revenueAct: 'Karnataka Land Revenue Act, 1964 (RFCTLARR Rules)', portalName: 'Bhoomi Karnataka (RTC API)', recordTerm: 'Pahani / RTC / Survey No.', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 820000, defaultAnnuityMonthly: 11500, defaultLang: 'kn' },
  { code: 'KL', lgd: '32', type: 'State', name: 'Kerala', revenueAct: 'Kerala Land Conservancy & RFCTLARR Rules 2015', portalName: 'ReLIS / E-Rekha Kerala', recordTerm: 'Thandaper / Re-Survey No.', ruralFactor: 1.5, urbanFactor: 1.0, defaultCircleRatePerHa: 1150000, defaultAnnuityMonthly: 13000, defaultLang: 'ml' },
  { code: 'MP', lgd: '23', type: 'State', name: 'Madhya Pradesh', revenueAct: 'MP Land Revenue Code, 1959 (Harmonized)', portalName: 'MP Bhulekh (RCMS Sync)', recordTerm: 'Khasra / B-1 / Khatauni', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 590000, defaultAnnuityMonthly: 8500, defaultLang: 'hi' },
  { code: 'MH', lgd: '27', type: 'State', name: 'Maharashtra', revenueAct: 'Maharashtra Land Revenue Code, 1966 (Harmonized)', portalName: 'Mahabhulekh (7/12 Satbara API)', recordTerm: 'Satbara 7/12 / Gat No.', ruralFactor: 2.0, urbanFactor: 1.25, defaultCircleRatePerHa: 720000, defaultAnnuityMonthly: 12000, defaultLang: 'mr' },
  { code: 'MN', lgd: '14', type: 'State', name: 'Manipur', revenueAct: 'Manipur Land Revenue & Land Reforms Act, 1960', portalName: 'Loucha Pathap (DILRMP)', recordTerm: 'Patta / Dag / Jamabandi', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 450000, defaultAnnuityMonthly: 8500, defaultLang: 'en' },
  { code: 'ML', lgd: '17', type: 'State', name: 'Meghalaya', revenueAct: 'Meghalaya Land Transfer & Autonomous District Rules', portalName: 'Meghalaya RoR (DILRMP)', recordTerm: 'Patta / Holding / Survey No.', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 460000, defaultAnnuityMonthly: 8500, defaultLang: 'en' },
  { code: 'MZ', lgd: '15', type: 'State', name: 'Mizoram', revenueAct: 'Mizoram Land Revenue Act, 2013', portalName: 'Mizoram Land Revenue Portal', recordTerm: 'LSC / Periodic Patta', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 440000, defaultAnnuityMonthly: 8500, defaultLang: 'en' },
  { code: 'NL', lgd: '13', type: 'State', name: 'Nagaland', revenueAct: 'Nagaland Land & Revenue Regulation (Art. 371A Harmonized)', portalName: 'Nagaland Land Registry', recordTerm: 'Patta / Dag No.', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 430000, defaultAnnuityMonthly: 8500, defaultLang: 'en' },
  { code: 'OD', lgd: '21', type: 'State', name: 'Odisha', revenueAct: 'Odisha Survey & Settlement Act, 1958', portalName: 'Bhulekh Odisha (DILRMP)', recordTerm: 'ROR / Khata / Plot No.', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 560000, defaultAnnuityMonthly: 9000, defaultLang: 'or' },
  { code: 'PB', lgd: '03', type: 'State', name: 'Punjab', revenueAct: 'Punjab Land Revenue Act, 1887 (PLRS Harmonized)', portalName: 'Jamabandi Punjab (PLRS API)', recordTerm: 'Jamabandi / Khewat / Khasra', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 920000, defaultAnnuityMonthly: 11500, defaultLang: 'pa' },
  { code: 'RJ', lgd: '08', type: 'State', name: 'Rajasthan', revenueAct: 'Rajasthan Land Revenue Act, 1956 (RFCTLARR Rules)', portalName: 'Apna Khata Rajasthan (DILRMP)', recordTerm: 'Jamabandi / Khasra / Khata', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 600000, defaultAnnuityMonthly: 9000, defaultLang: 'hi' },
  { code: 'SK', lgd: '11', type: 'State', name: 'Sikkim', revenueAct: 'Sikkim Land Revenue & Parcha Rules (Art. 371F)', portalName: 'Sikkim Land Records (DILRMP)', recordTerm: 'Parcha / Khatiyan / Plot No.', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 550000, defaultAnnuityMonthly: 9500, defaultLang: 'en' },
  { code: 'TN', lgd: '33', type: 'State', name: 'Tamil Nadu', revenueAct: 'TN Patta Passbook & RFCTLARR Harmonized Rules', portalName: 'Tamil Nilam (e-Services DILRMP)', recordTerm: 'Patta / Chitta / Survey No.', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 790000, defaultAnnuityMonthly: 11000, defaultLang: 'ta' },
  { code: 'TS', lgd: '36', type: 'State', name: 'Telangana', revenueAct: 'Telangana RoR & Pattadar Passbooks Act (Bhu Bharati)', portalName: 'Bhu Bharati / Dharani (DILRMP)', recordTerm: 'Pahani / Survey No. / Passbook', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 760000, defaultAnnuityMonthly: 10500, defaultLang: 'te' },
  { code: 'TR', lgd: '16', type: 'State', name: 'Tripura', revenueAct: 'Tripura Land Revenue & Land Reforms Act, 1960', portalName: 'Jami Tripura (DILRMP)', recordTerm: 'Khatian / Dag No.', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 480000, defaultAnnuityMonthly: 8500, defaultLang: 'bn' },
  { code: 'UP', lgd: '09', type: 'State', name: 'Uttar Pradesh', revenueAct: 'UP Revenue Code, 2006 (Harmonized w/ RFCTLARR 2013)', portalName: 'UP Bhulekh (DILRMP Sync)', recordTerm: 'Khasra / Khatauni', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 650000, defaultAnnuityMonthly: 8000, defaultLang: 'hi' },
  { code: 'UK', lgd: '05', type: 'State', name: 'Uttarakhand', revenueAct: 'UK Zamindari Abolition & Land Reforms (UP Code Adapted)', portalName: 'Devbhoomi Bhulekh (DILRMP)', recordTerm: 'Khasra / Khatauni', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 640000, defaultAnnuityMonthly: 9500, defaultLang: 'hi' },
  { code: 'WB', lgd: '19', type: 'State', name: 'West Bengal', revenueAct: 'WB Land Reforms Act, 1955 (Harmonized)', portalName: 'Banglarbhumi (DILRMP Sync)', recordTerm: 'Khatian / Dag No.', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 670000, defaultAnnuityMonthly: 9500, defaultLang: 'bn' },

  // 8 Union Territories
  { code: 'AN', lgd: '35', type: 'UT', name: 'Andaman & Nicobar Islands', revenueAct: 'A&N Islands Land Revenue & Land Reforms Reg, 1966', portalName: 'Dweep Bhumi (DILRMP)', recordTerm: 'Survey No. / Patta', ruralFactor: 1.5, urbanFactor: 1.0, defaultCircleRatePerHa: 540000, defaultAnnuityMonthly: 9500, defaultLang: 'en' },
  { code: 'CH', lgd: '04', type: 'UT', name: 'Chandigarh', revenueAct: 'Punjab Land Revenue Act (Chandigarh UT)', portalName: 'Chandigarh Estate / DILRMP', recordTerm: 'Jamabandi / Khasra No.', ruralFactor: 1.5, urbanFactor: 1.0, defaultCircleRatePerHa: 1850000, defaultAnnuityMonthly: 14000, defaultLang: 'pa' },
  { code: 'DN', lgd: '26', type: 'UT', name: 'Dadra & Nagar Haveli and Daman & Diu', revenueAct: 'DNH & DD Land Revenue Regulation', portalName: 'DNHDD e-Dhara (DILRMP)', recordTerm: '7/12 / Survey No.', ruralFactor: 1.5, urbanFactor: 1.0, defaultCircleRatePerHa: 720000, defaultAnnuityMonthly: 10500, defaultLang: 'gu' },
  { code: 'DL', lgd: '07', type: 'UT', name: 'NCT of Delhi', revenueAct: 'Delhi Land Reforms Act, 1954 (Urbanized & RFCTLARR)', portalName: 'DLRC Delhi (DILRMP Sync)', recordTerm: 'Khasra / Khatauni / Lal Dora', ruralFactor: 1.5, urbanFactor: 1.0, defaultCircleRatePerHa: 2400000, defaultAnnuityMonthly: 15000, defaultLang: 'hi' },
  { code: 'JK', lgd: '01', type: 'UT', name: 'Jammu & Kashmir', revenueAct: 'J&K Land Revenue Act, Svt. 1996 (Harmonized)', portalName: 'Aapki Zameen Aapki Nigrani', recordTerm: 'Jamabandi / Khasra / Girdawari', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 620000, defaultAnnuityMonthly: 9500, defaultLang: 'hi' },
  { code: 'LA', lgd: '37', type: 'UT', name: 'Ladakh', revenueAct: 'Ladakh Land Revenue Regulation (Harmonized)', portalName: 'Ladakh DILRMP Registry', recordTerm: 'Jamabandi / Khasra No.', ruralFactor: 2.0, urbanFactor: 1.0, defaultCircleRatePerHa: 480000, defaultAnnuityMonthly: 9500, defaultLang: 'en' },
  { code: 'LD', lgd: '31', type: 'UT', name: 'Lakshadweep', revenueAct: 'Lakshadweep Land Revenue & Tenancy Reg, 1965', portalName: 'Lakshadweep Land Registry', recordTerm: 'Survey No. / Cowle Patta', ruralFactor: 1.5, urbanFactor: 1.0, defaultCircleRatePerHa: 690000, defaultAnnuityMonthly: 10000, defaultLang: 'ml' },
  { code: 'PY', lgd: '34', type: 'UT', name: 'Puducherry', revenueAct: 'Pondicherry Settlement Act, 1970', portalName: 'Nilam Puducherry (DILRMP)', recordTerm: 'Patta / Cadastre / R.S. No.', ruralFactor: 1.5, urbanFactor: 1.0, defaultCircleRatePerHa: 850000, defaultAnnuityMonthly: 11000, defaultLang: 'ta' }
];

export const JURISDICTION_MAP = Object.fromEntries(JURISDICTIONS.map((j) => [j.code, j]));

export const CORRIDOR_SECTORS = [
  { id: 'HIGHWAY', label: 'National / State Highway (NHAI / PWD)', agencyPrefix: 'NHAI' },
  { id: 'RAILWAYS', label: 'Dedicated Freight / High-Speed Rail', agencyPrefix: 'DFCCIL / IR' },
  { id: 'METRO', label: 'Urban Metro Rail Transit', agencyPrefix: 'METRO' },
  { id: 'POWER', label: 'High-Voltage Transmission & Solar Grid', agencyPrefix: 'PGCIL' },
  { id: 'INDUSTRIAL', label: 'PM GatiShakti MMLP & Industrial Corridor', agencyPrefix: 'NICDC' }
];

export const PMKVY_COURSES = [
  {
    code: 'PMKVY4-CON-01',
    title: 'PMKVY 4.0 · Heavy Highway Machinery & Crane Operations',
    sector: 'Infrastructure & Logistics',
    provider: 'NSDC / Skill India Digital Hub',
    durationWeeks: 12,
    stipendSupport: 'Priority EPC Contractor Placement + Schedule II R&R'
  },
  {
    code: 'PMKVY4-SOL-02',
    title: 'PMKVY 4.0 · Solar PV Grid & Smart Tolling Technician',
    sector: 'Green Energy & EV Highways',
    provider: 'Skill Council for Green Jobs (NSDC)',
    durationWeeks: 10,
    stipendSupport: 'Guaranteed Corridor O&M Interview + Toolkit Grant'
  },
  {
    code: 'PMKVY4-AGR-03',
    title: 'PMKVY 4.0 · Precision Drone Survey & Agri-Allied Micro-Enterprise',
    sector: 'AgriTech & Rural Enterprise',
    provider: 'ASCI / NSDC + MUDRA Linkage',
    durationWeeks: 8,
    stipendSupport: 'MUDRA Micro-Enterprise Credit Enablement'
  },
  {
    code: 'PMKVY4-LOG-04',
    title: 'PMKVY 4.0 · MMLP Warehouse & Cold-Chain Supervisor',
    sector: 'PM GatiShakti Freight Hubs',
    provider: 'Logistics Sector Skill Council (NSDC)',
    durationWeeks: 10,
    stipendSupport: 'Schedule II Family Employment Priority Quota'
  }
];

export const INDIA_STACK_GATEWAYS = [
  {
    id: 'GW-DILRMP',
    name: 'DILRMP & ULPIN (Bhu-Aadhaar)',
    scope: '28 States & 8 UTs (36 Jurisdictions)',
    latencyMs: 112,
    status: 'SYNCED',
    purpose: '14-digit Bhu-Aadhaar parcel lookup, Khasra/Satbara/Patta sync & automatic RoR mutation'
  },
  {
    id: 'GW-BHUVAN',
    name: 'ISRO Bhuvan + PM GatiShakti NMP',
    scope: '0.3m Satellite + Drone LiDAR',
    latencyMs: 138,
    status: 'ONLINE',
    purpose: 'Corridor KML intersection, NDVI multi-spectral crop yield & MoEFCC forest geo-fencing'
  },
  {
    id: 'GW-UIDAI',
    name: 'UIDAI Aadhaar e-Sign & VID Gateway',
    scope: 'NPCI Tokenized Consent',
    latencyMs: 79,
    status: 'TOKENIZED',
    purpose: 'Zero-PII 16-digit Virtual ID biometric/OTP consent e-Sign + DigiLocker award push'
  },
  {
    id: 'GW-PFMS',
    name: 'PFMS / NPCI APBS & Sec 77 Escrow',
    scope: '24-Hour Direct Benefit Transfer',
    latencyMs: 91,
    status: 'ACTIVE',
    purpose: 'Direct Aadhaar-seeded award credit, 24-mo transition annuity & Sec 77 disputed escrow pool'
  },
  {
    id: 'GW-NESL',
    name: 'NeSL / CERSAI Lien Registry',
    scope: 'Scheduled Commercial & RRB Banks',
    latencyMs: 124,
    status: 'VERIFIED',
    purpose: 'Automated KCC / mortgage encumbrance detection & split settlement clearance'
  },
  {
    id: 'GW-IGRS',
    name: 'State IGRS Sub-Registrar Feed',
    scope: '3-Year Comparable Sale Deeds',
    latencyMs: 105,
    status: 'STREAMING',
    purpose: 'Outlier-trimmed 3-year market rate determination per RFCTLARR Section 26(1)'
  }
];

export const DECK_BENCHMARKS = {
  statutoryCycleTarget: '6–9 Months',
  directConsentTarget: '60–90 Days',
  legacyCycleBaseline: '4.5 Years (54 Months)',
  netSavingsPer1000Cr: 183.5,
  psuFeePctAvg: 0.35,
  publicRoiMultiple: 52.4,
  pfmsTurnaroundHours: 24,
  jurisdictionsLabel: '28 States & 8 UTs',
  annuityRangeLabel: '₹8,000–₹15,000 / mo × 24 Mo'
};
