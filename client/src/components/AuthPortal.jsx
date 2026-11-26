import React, { useEffect, useState } from 'react';
import {
  Landmark,
  ShieldCheck,
  MapPin,
  UserCheck,
  Building2,
  ArrowRight,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { JURISDICTIONS, DECK_BENCHMARKS } from '@shared/revenueCodes';

const ROLE_CARDS = [
  {
    role: 'collector',
    userId: 'usr-collector-up',
    badge: 'DM / COLLECTOR',
    title: 'District Collector / DM',
    desc: '1-Click 24-hr PFMS release, Sec 77 Escrow isolation & 7–15d triage desk',
    icon: Landmark,
    accent: 'bg-slate-900 text-white'
  },
  {
    role: 'officer',
    userId: 'usr-officer-up',
    badge: 'CALA / LAO',
    title: 'Land Acquisition Officer',
    desc: '14-digit ULPIN lookup, ISRO Bhuvan GIS, IGRS + NDVI Schedule I valuation',
    icon: MapPin,
    accent: 'bg-[#047857] text-white'
  },
  {
    role: 'farmer',
    userId: 'usr-farmer-rameshwar',
    badge: 'BHOOMITRACKER',
    title: 'Farmer / Landowner',
    desc: '5-stage live tracking, 12-language Voice + IVRS, VID e-Sign & PMKVY 4.0',
    icon: ShieldCheck,
    accent: 'bg-[#C2410C] text-white'
  },
  {
    role: 'agency',
    userId: 'usr-agency-nhai',
    badge: 'INFRA PSU',
    title: 'Infra Agency (NHAI / Rail)',
    desc: 'PM GatiShakti KML launch, Geo-Fence realignment & ₹183.5 Cr ROI tracker',
    icon: Building2,
    accent: 'bg-slate-700 text-white'
  }
];

export default function AuthPortal({ onAuthenticated, demoAccounts = [] }) {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('collector');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('collector@bhoomi.gov.in');
  const [password, setPassword] = useState('BhoomiSetu@2026');
  const [stateCode, setStateCode] = useState('UP');
  const [district, setDistrict] = useState('Barabanki');
  const [credentialCode, setCredentialCode] = useState('NIC-DM-UP09');
  const [credCheck, setCredCheck] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === 'register') {
      const defaults = {
        collector: 'NIC-DM-UP12',
        officer: 'CALA-UP-052',
        farmer: 'VID-5510-2284-9012',
        agency: 'NHAI-G2G-09'
      };
      setCredentialCode(defaults[role] || '');
    }
  }, [role, mode]);

  useEffect(() => {
    if (mode !== 'register') {
      setCredCheck(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await apiRequest(
          `/auth/verify-credential/${role}/${encodeURIComponent(credentialCode || 'AUTO')}`
        );
        setCredCheck(res);
      } catch (err) {
        setCredCheck({ verified: false, error: err.message });
      }
    }, 240);
    return () => clearTimeout(timer);
  }, [mode, role, credentialCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body =
        mode === 'login'
          ? { email, password }
          : { name, email, password, role, stateCode, district, credentialCode };
      const data = await apiRequest(endpoint, { method: 'POST', body });
      onAuthenticated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (userId) => {
    setError('');
    setLoading(true);
    try {
      const data = await apiRequest('/auth/demo-login', {
        method: 'POST',
        body: { userId }
      });
      onAuthenticated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Left: Sovereign Context, Benchmarks & 1-Click Verified Role Access */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#065F46] text-white flex items-center justify-center shadow-sm border border-emerald-800/20">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                    BHOOMI-SETU <span className="text-[#C2410C] font-bold">भूमि-सेतु</span>
                  </h1>
                  <span className="gov-badge bg-emerald-50 text-[#047857] border-emerald-200">
                    RFCTLARR 2013
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  Unified National Digital Land Acquisition &amp; Farmer Livelihood Ecosystem
                </p>
              </div>
            </div>
            <span className="gov-badge bg-white text-slate-700 border-slate-300">
              MeghRaj NIC Cloud · DPDP 2023
            </span>
          </div>

          <div className="gov-card p-6 space-y-4">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#047857]">
                Viksit Bharat 2047 · National GovTech &amp; AgriTech DPI
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                Compressing statutory acquisition from 4.5 years to 6–9 months (60–90d direct consent) with 24-hour PFMS DBT
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Harmonizing land acquisition across <strong>28 States &amp; 8 UTs</strong> on{' '}
                <strong>14-digit ULPIN (Bhu-Aadhaar)</strong>, <strong>PM GatiShakti NMP</strong>,{' '}
                <strong>ISRO Bhuvan GIS</strong>, <strong>Sec 77 Digital Escrow</strong>, and{' '}
                <strong>PMKVY 4.0</strong>—backed by live SQLite persistence, JWT RBAC, and SHA-256 audit logging.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="gov-inset p-3">
                <div className="text-[11px] font-semibold text-slate-500">Statutory Cycle</div>
                <div className="text-lg font-extrabold text-[#047857] tabular-nums mt-0.5">
                  {DECK_BENCHMARKS.statutoryCycleTarget}
                </div>
                <div className="text-[11px] text-slate-600">60–90d direct consent</div>
              </div>
              <div className="gov-inset p-3">
                <div className="text-[11px] font-semibold text-slate-500">Net Savings / ₹1k Cr</div>
                <div className="text-lg font-extrabold text-slate-900 tabular-nums mt-0.5">
                  ₹{DECK_BENCHMARKS.netSavingsPer1000Cr} Cr
                </div>
                <div className="text-[11px] text-[#047857] font-semibold">
                  {DECK_BENCHMARKS.publicRoiMultiple}x ROI (0.35% fee)
                </div>
              </div>
              <div className="gov-inset p-3">
                <div className="text-[11px] font-semibold text-slate-500">PFMS Bank Credit</div>
                <div className="text-lg font-extrabold text-[#C2410C] tabular-nums mt-0.5">
                  {DECK_BENCHMARKS.pfmsTurnaroundHours} Hrs
                </div>
                <div className="text-[11px] text-slate-600">Sec 77 Escrow DBT</div>
              </div>
              <div className="gov-inset p-3">
                <div className="text-[11px] font-semibold text-slate-500">Federal Coverage</div>
                <div className="text-lg font-extrabold text-slate-900 tabular-nums mt-0.5">
                  28 + 8
                </div>
                <div className="text-[11px] text-slate-600">States &amp; UTs synced</div>
              </div>
            </div>
          </div>

          {/* 1-Click Verified Sandbox Role Launchers */}
          <div className="gov-card p-5 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Instant Stakeholder Access (Seeded SQLite + Signed JWT)
                </h3>
                <p className="text-xs text-slate-500">
                  Enter any role workspace directly for live workflow inspection, or sign in / register on the right.
                </p>
              </div>
              <span className="gov-badge bg-slate-100 text-slate-700 border-slate-300">
                <Lock className="w-3 h-3" /> Zero-PII VID
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLE_CARDS.map((card) => {
                const Icon = card.icon;
                const seeded = demoAccounts.find((a) => a.role === card.role);
                return (
                  <button
                    key={card.role}
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemoLogin(seeded?.id || card.userId)}
                    className="group text-left p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#047857] hover:bg-emerald-50/30 transition-all flex items-start gap-3"
                  >
                    <div className={`w-10 h-10 rounded-lg ${card.accent} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                          {card.badge}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#047857] group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div className="text-sm font-bold text-slate-900 truncate">{card.title}</div>
                      <p className="text-[11px] text-slate-600 leading-snug mt-0.5">{card.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Real Authentication Form (Sign In / Create Account) */}
        <div className="lg:col-span-5">
          <div className="gov-card p-6">
            <div className="flex rounded-lg bg-slate-100 p-1 mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                  mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In (MeghRaj SSO)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                  mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Register Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Stakeholder Portal Role
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        { id: 'collector', label: 'Collector' },
                        { id: 'officer', label: 'CALA/LAO' },
                        { id: 'farmer', label: 'Farmer' },
                        { id: 'agency', label: 'Agency' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setRole(item.id)}
                          className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-colors ${
                            role === item.id
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={role === 'farmer' ? 'Suresh Kumar Patel' : 'Dr. Ananya Verma, IAS'}
                      className="gov-input"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official / Registered Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@bhoomi.gov.in"
                  className="gov-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="gov-input"
                />
                {mode === 'login' && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Demo DM credentials pre-filled (<span className="font-mono">collector@bhoomi.gov.in</span>)
                  </p>
                )}
              </div>

              {mode === 'register' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        State / UT (28+8)
                      </label>
                      <select
                        value={stateCode}
                        onChange={(e) => setStateCode(e.target.value)}
                        className="gov-input"
                      >
                        {JURISDICTIONS.map((j) => (
                          <option key={j.code} value={j.code}>
                            {j.name} ({j.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
                      <input
                        type="text"
                        required
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="gov-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {role === 'collector'
                        ? 'NIC Parichay DM Code'
                        : role === 'officer'
                          ? 'State CALA / LAO Code'
                          : role === 'agency'
                            ? 'PM GatiShakti Agency Code'
                            : 'UIDAI Virtual ID (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={credentialCode}
                      onChange={(e) => setCredentialCode(e.target.value.toUpperCase())}
                      className="gov-input font-mono text-xs"
                    />
                  </div>

                  {credCheck && (
                    <div
                      className={`p-2.5 rounded-lg text-xs border flex items-start gap-2 ${
                        credCheck.verified
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}
                    >
                      {credCheck.verified ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#047857]" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                      )}
                      <span>
                        {credCheck.verified ? credCheck.authority : credCheck.error}
                      </span>
                    </div>
                  )}
                </>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="gov-btn-primary w-full py-2.5 text-sm">
                <UserCheck className="w-4 h-4" />
                {loading
                  ? 'Authenticating...'
                  : mode === 'login'
                    ? 'Sign In & Issue JWT Session'
                    : 'Create Verified Stakeholder Account'}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <span>Zero raw Aadhaar storage (VID Tokenized)</span>
              <span>Offline-First CSC PWA Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
