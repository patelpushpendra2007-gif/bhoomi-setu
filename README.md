# BHOOMI-SETU (भूमि-सेतु) · v3.0 Full-Stack GovTech & AgriTech Prototype

> **Unified National Digital Land Acquisition & Farmer Livelihood Ecosystem (Viksit Bharat 2047 · RFCTLARR Act 2013)**

Compressing statutory land acquisition from **4.5 years (54 months)** to **6–9 months** (**60–90 days** for direct-consent corridors) with **24-hour PFMS Direct Benefit Transfer** across **28 States & 8 Union Territories (36 Jurisdictions)**—delivering **₹183.5 Cr net public savings per ₹1,000 Cr project (52.4x ROI)** after a transparent **0.35%** PSU SaaS fee, while remaining **100% free for farmers**.

---

## Tech Stack & Architecture

- **Frontend:** React 18 + Vite + Tailwind CSS v3 (*Administrative Modernism* light GovTech design system), PWA Service Worker + Offline CSC Sync Queue, Web Speech API 12-Language Voice Guide.
- **Backend:** Express.js (`server/app.js`, `api/index.js` Vercel Serverless entrypoint), **SQLite (`node:sqlite`)** local persistence with automatic `/tmp` JSON store fallback on Vercel, **JWT + `bcryptjs` authentication** with strict role-based access control (`collector`, `officer`, `farmer`, `agency`), and **Server-Sent Events (SSE)** live sync.
- **Shared Deterministic Models (`shared/`):**
  1. **36-Jurisdiction Legal Harmonizer (`shared/revenueCodes.js`):** Maps all 28 States + 8 UTs (`Khasra`, `Satbara 7/12`, `Patta`, `Jamabandi`, `Pahani/RTC`, `Adangal`, `Dharani/Bhu Bharati`, `AnyRoR`, etc.) into RFCTLARR Schedule I rules & LGD codes.
  2. **14-Digit ULPIN (Bhu-Aadhaar) Spatial Codec & GIS Solver (`shared/ulpinSpatial.js`):** Geo-referenced ULPIN encoder/decoder with weighted checksum, Shoelace polygon area calculation, 60m Right-of-Way intersection, and MoEFCC Reserve Forest overlap solver (`+20m North` alignment shift clears Khasra #406 overlap from `18.0m` to `0.0m`).
  3. **RFCTLARR Schedule I + IGRS + ISRO NDVI Model (`shared/rfctlarrEngine.js`):** Computes `NDVI = (NIR - Red) / (NIR + Red)`, IQR-outlier-trimmed top-50% IGRS 3-year sale deeds, `1x–2x` Schedule I multiplier + `100%` Solatium + `12% p.a.` Sec 30(3) interest, NeSL/CERSAI bank lien split, and Schedule II `₹8,000–₹15,000/mo × 24 mo` Transition Annuity.
  4. **Statutory State Machine & Sec 77 Escrow (`shared/statutoryEngine.js`):** Enforces Forest Geo-Fence blocks, Sec 77 Digital Court Escrow isolation, Sec 15 (60-day objection window), 7–15 day CALA/DM triage, and Sec 51 LARR Authority referral.
  5. **Lightweight SHA-256 Audit Ledger (`server/auditLedger.js`):** Replaces heavy Hyperledger consensus bloat with deterministic SHA-256 hash chaining + UIDAI VID HMAC-SHA256 e-Sign receipts on MeghRaj NIC Cloud.

---

## Local Development & Verification

```bash
npm install
npm test            # Run all unit, spatial, crypto, and HTTP API tests
npm run dev         # Start Express API (port 3050) + Vite HMR (port 5173)
npm run build       # Build production frontend to dist/
npm run build:vercel # Build Vercel Build Output v3 bundle (.vercel/output)
```

### Seeded Stakeholder Accounts (Password: `BhoomiSetu@2026`)
- **District Collector (DM):** `collector@bhoomi.gov.in` (`NIC-DM-UP09`)
- **Land Acquisition Officer (CALA):** `officer@bhoomi.gov.in` (`CALA-UP-044`)
- **Farmer Beneficiary (Khasra #402):** `rameshwar@farmer.in` (`VID-4820-3391-8421`)
- **Farmer Beneficiary (Khasra #405):** `kamla@farmer.in` (`VID-3109-6428-9920`)
- **Infra Agency (NHAI):** `nhai@gatishakti.gov.in` (`NHAI-G2G-01`)
