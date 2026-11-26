import React, { useState } from 'react';
import {
  Volume2,
  CheckCircle2,
  PhoneCall,
  Briefcase,
  MessageSquare,
  FileText,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { FARMER_LANGUAGES } from '@shared/i18n';
import { PMKVY_COURSES } from '@shared/revenueCodes';
import { formatInr, formatUlpin } from '../lib/format';

export default function FarmerView({
  parcels = [],
  selectedParcelId,
  onSelectParcel,
  farmerLang,
  onChangeLang,
  onOpenEsign,
  onEnrollPmkvy,
  onRaiseObjection,
  onIvrsAction,
  onOpenCert,
  busy
}) {
  const farmerParcels = parcels.filter((p) => !p.isForestZone);
  const parcel = farmerParcels.find((p) => p.id === selectedParcelId) || farmerParcels[0];
  const lang = FARMER_LANGUAGES.find((l) => l.code === farmerLang) || FARMER_LANGUAGES[0];

  const [selectedCourse, setSelectedCourse] = useState(PMKVY_COURSES[0].code);
  const [ivrsResponse, setIvrsResponse] = useState('');
  const [voiceActiveText, setVoiceActiveText] = useState('');

  if (!parcel) {
    return <div className="gov-card p-6 text-sm text-slate-600">No farmer parcels found in this corridor.</div>;
  }

  const v = parcel.valuation;

  const handleVoiceAssist = () => {
    const msg = lang.voiceSummary(
      parcel,
      v.netFarmerPayout.toLocaleString('en-IN'),
      v.monthlyAnnuity.toLocaleString('en-IN')
    );
    setVoiceActiveText(msg);
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(msg);
        utter.lang = lang.speechLang;
        utter.rate = 0.95;
        window.speechSynthesis.speak(utter);
      } catch {
        // visual transcript displayed below
      }
    }
  };

  const handleIvrsPress = async (key) => {
    const prompt = await onIvrsAction(parcel.id, key);
    if (prompt) {
      setIvrsResponse(prompt);
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(prompt);
          utter.lang = 'en-IN';
          window.speechSynthesis.speak(utter);
        } catch {
          // silent
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C2410C]">
            BHOOMITRACKER CITIZEN PORTAL · 12+ INDIAN LANGUAGES &amp; FEATURE-PHONE IVRS
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
            5-Stage Live Farmer Journey &amp; 3-Tier Livelihood Security
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            100% free for farmers · Inspect <strong>Khasra #402 (₹14,50,000)</strong> or sign <strong>Khasra #405</strong> live via Aadhaar VID.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="farmer-parcel-select" className="text-xs font-bold text-slate-700">
            Landowner Record:
          </label>
          <select
            id="farmer-parcel-select"
            value={parcel.id}
            onChange={(e) => onSelectParcel(e.target.value)}
            className="gov-input w-auto text-xs font-semibold"
          >
            {farmerParcels.map((p) => (
              <option key={p.id} value={p.id}>
                {p.parcelNumber} — {p.farmerName} ({formatInr(p.valuation.netFarmerPayout)})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Smartphone BhoomiTracker UI Frame */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900 rounded-[28px] p-3 border-2 border-slate-700 shadow-lg max-w-md mx-auto">
            <div className="bg-[#F8FAFC] rounded-[20px] overflow-hidden">
              <div className="bg-[#065F46] text-white px-4 py-2 flex items-center justify-between text-[11px] font-semibold">
                <span className="inline-flex items-center gap-1">
                  <Smartphone className="w-3 h-3" /> BhoomiTracker PWA
                </span>
                <span>CSC Bhoomi Mitra Ready</span>
              </div>

              <div className="bg-[#047857] text-white px-4 pb-4 pt-2 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{lang.appTitle}</div>
                    <div className="text-[11px] text-emerald-100 truncate">
                      {parcel.farmerName} · {parcel.village}
                    </div>
                  </div>
                  <select
                    value={lang.code}
                    onChange={(e) => onChangeLang(e.target.value)}
                    aria-label="Select Regional Language"
                    className="bg-white/15 border border-white/30 text-white text-xs font-semibold rounded-md px-2 py-1"
                  >
                    {FARMER_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code} className="text-slate-900 bg-white">
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-white/15 border border-white/25 rounded-lg p-2.5 flex items-center justify-between gap-2">
                  <div className="text-xs">
                    <div className="text-emerald-100 text-[10px]">{lang.parcelLabel}</div>
                    <div className="font-bold">{parcel.parcelNumber}</div>
                    <div className="font-mono text-[10px] text-emerald-100">{formatUlpin(parcel.ulpin)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleVoiceAssist}
                    className="bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 shrink-0"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    {lang.voiceBtn}
                  </button>
                </div>

                {voiceActiveText && (
                  <div className="bg-slate-900/50 text-emerald-50 text-[11px] p-2 rounded-lg leading-snug">
                    {voiceActiveText}
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                    <div className="text-[10px] font-bold text-[#047857]">{lang.awardLabel}</div>
                    <div className="text-base font-extrabold text-slate-900 font-mono tabular-nums mt-0.5">
                      {formatInr(v.netFarmerPayout)}
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                    <div className="text-[10px] font-bold text-[#C2410C]">{lang.annuityLabel}</div>
                    <div className="text-base font-extrabold text-slate-900 font-mono tabular-nums mt-0.5">
                      {formatInr(v.monthlyAnnuity)}/mo
                    </div>
                  </div>
                </div>

                {/* 5-Stage Live Journey */}
                <div className="space-y-2">
                  {lang.stages.map((label, idx) => {
                    const num = idx + 1;
                    const done = parcel.stage >= num;
                    const current = parcel.stage + 1 === num;
                    const hints = [
                      `${parcel.parcelNumber} · ${parcel.areaHectares} Ha`,
                      parcel.consentSigned ? `Signed (VID ••••${parcel.aadhaarVid.slice(-4)})` : 'Pending Aadhaar VID e-Sign',
                      `${formatInr(v.netFarmerPayout)} (Schedule I)`,
                      parcel.pfmsUtr ? `PFMS UTR: ${parcel.pfmsUtr}` : 'Queued for Collector PFMS release',
                      `${formatInr(v.monthlyAnnuity)}/mo × 24 mo + PMKVY 4.0`
                    ];
                    return (
                      <div
                        key={num}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs ${
                          done
                            ? 'bg-emerald-50/70 border-emerald-200'
                            : current
                              ? 'bg-amber-50 border-amber-300'
                              : 'bg-white border-slate-200'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 ${
                            done
                              ? 'bg-[#047857] text-white'
                              : current
                                ? 'bg-[#C2410C] text-white'
                                : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {done ? '✓' : num}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900">{label}</div>
                          <div className="text-[11px] text-slate-600 truncate">{hints[idx]}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!parcel.consentSigned && !parcel.disputeFlag ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onOpenEsign(parcel)}
                    className="gov-btn-emerald w-full py-2.5"
                  >
                    {lang.signBtn}
                  </button>
                ) : (
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[#047857] text-xs font-bold text-center">
                    ✓ {lang.signedBadge}
                  </div>
                )}

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onRaiseObjection(parcel)}
                  className="gov-btn-outline w-full"
                >
                  <AlertCircle className="w-3.5 h-3.5" /> {lang.grievanceBtn}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: 3-Tier Livelihood Safety Net & Feature-Phone SMS + IVRS */}
        <div className="lg:col-span-7 space-y-5">
          <div className="gov-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  3-Tier Farmer Financial &amp; Livelihood Safety Net (Schedule II R&amp;R)
                </h2>
                <p className="text-xs text-slate-500">
                  Eliminates Day-1 Rabi/Kharif crop income shock and informal moneylender debt traps
                </p>
              </div>
              <button type="button" onClick={() => onOpenCert(parcel)} className="gov-btn-outline">
                <FileText className="w-3.5 h-3.5" /> Digital Passbook
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#047857]">
                  Tier 1 · Day 1 Capital
                </div>
                <div className="text-lg font-extrabold text-slate-900 font-mono tabular-nums">
                  {formatInr(v.netFarmerPayout)}
                </div>
                <p className="text-xs text-slate-700 leading-snug">
                  24-hour PFMS direct transfer to Aadhaar-seeded {parcel.bankAccountMasked.split('(')[0]} with automated NeSL lien verification.
                </p>
                <span className="gov-badge bg-white text-[#047857] border-emerald-300">
                  {parcel.disbursementStatus === 'CREDITED_PFMS' ? 'PFMS Credited' : 'Escrow Secured'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#C2410C]">
                  Tier 2 · Months 1–24
                </div>
                <div className="text-lg font-extrabold text-slate-900 font-mono tabular-nums">
                  {formatInr(v.monthlyAnnuity)}/mo
                </div>
                <p className="text-xs text-slate-700 leading-snug">
                  Guaranteed 24-month Transition Annuity (Total: <strong>{formatInr(v.totalAnnuity24M)}</strong>) bridging seasonal crop loss.
                </p>
                <span className="gov-badge bg-white text-[#C2410C] border-amber-300">
                  {parcel.stage >= 5 ? 'Annuity Stream Active' : 'Activates on PFMS'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  Tier 3 · Long-Term R&amp;R
                </div>
                <div className="text-sm font-extrabold text-slate-900">PMKVY 4.0 (Skill India / NSDC)</div>
                {parcel.pmKaushalEnrolled ? (
                  <div className="space-y-1.5">
                    <p className="text-xs text-[#047857] font-semibold leading-snug">
                      Enrolled: {parcel.pmKaushalTrack}
                    </p>
                    <span className="gov-badge bg-emerald-50 text-[#047857] border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Priority Hiring Active
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="gov-input py-1.5 text-[11px]"
                    >
                      {PMKVY_COURSES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onEnrollPmkvy(parcel.id, selectedCourse)}
                      className="gov-btn-primary w-full py-1.5 text-[11px]"
                    >
                      <Briefcase className="w-3 h-3" /> Enroll PMKVY 4.0
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Feature-Phone SMS + Toll-Free IVRS Simulator */}
          <div className="gov-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Feature-Phone SMS &amp; Toll-Free Vernacular IVRS Gateway
                </h2>
                <p className="text-xs text-slate-500">
                  Zero smartphone needed · Dial 1800-11-BHOOMI from any basic phone ({parcel.mobileMasked})
                </p>
              </div>
              <span className="gov-badge bg-emerald-50 text-[#047857] border-emerald-200">
                100% Free for Farmers
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* Interactive IVRS Keypad */}
              <div className="md:col-span-5 gov-inset p-3.5 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-700 inline-flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-[#047857]" /> Interactive IVRS DTMF Menu
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['1', 'Press 1: Status'],
                    ['2', 'Press 2: Award ₹'],
                    ['3', 'Press 3: OTP Sign'],
                    ['4', 'Press 4: CALA Call']
                  ].map(([k, lbl]) => (
                    <button
                      key={k}
                      type="button"
                      disabled={busy}
                      onClick={() => handleIvrsPress(k)}
                      className="gov-btn-outline py-2 text-[11px] justify-start"
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
                {ivrsResponse && (
                  <div className="p-2.5 rounded bg-slate-900 text-emerald-200 font-mono text-[11px] leading-snug">
                    {ivrsResponse}
                  </div>
                )}
              </div>

              {/* SMS History Feed */}
              <div className="md:col-span-7 bg-slate-900 text-slate-100 rounded-xl p-3.5 font-mono text-[11px] space-y-2">
                <div className="text-slate-400 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> NIC-BHOOMISETU SMS ({parcel.mobileMasked})
                  </span>
                  <span>{parcel.smsHistory.length} alerts</span>
                </div>
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {parcel.smsHistory.length === 0 ? (
                    <div className="text-slate-400">No SMS alerts dispatched for this parcel.</div>
                  ) : (
                    parcel.smsHistory.slice(-4).map((m, idx) => (
                      <div key={idx} className="bg-slate-800 px-3 py-2 rounded-lg border-l-2 border-emerald-400">
                        {m}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
