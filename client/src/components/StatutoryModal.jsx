import React, { useState } from 'react';
import { X, Printer, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { formatInr, formatUlpin } from '../lib/format';

export function ESIGNModal({ parcel, onClose, onConfirm }) {
  const [otp, setOtp] = useState('482910');
  const [submitting, setSubmitting] = useState(false);

  if (!parcel) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(parcel, otp);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full overflow-hidden shadow-xl">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <h3 className="text-sm font-bold">UIDAI Aadhaar VID Tokenized e-Sign</h3>
          <button type="button" onClick={onClose} className="text-slate-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3 text-xs text-slate-700">
          <span className="gov-badge bg-emerald-50 text-[#047857] border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" /> DPDP Act 2023 Compliant · Zero Raw Aadhaar
          </span>
          <div className="gov-inset p-3 space-y-1.5">
            <div><strong>Landowner:</strong> {parcel.farmerName}</div>
            <div><strong>Parcel:</strong> {parcel.parcelNumber} ({parcel.village})</div>
            <div><strong>14-Digit ULPIN:</strong> <span className="font-mono">{formatUlpin(parcel.ulpin)}</span></div>
            <div><strong>Tokenized VID:</strong> <span className="font-mono">{parcel.aadhaarVid}</span></div>
            <div>
              <strong>Schedule I Award:</strong>{' '}
              <span className="text-[#047857] font-bold">{formatInr(parcel.valuation.netFarmerPayout)}</span> +{' '}
              <strong>{formatInr(parcel.valuation.monthlyAnnuity)}/mo</strong> × 24 mo
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              6-Digit Aadhaar Biometric / OTP Token (Sandbox: 482910)
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="gov-input font-mono text-center tracking-widest"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            Signing generates an HMAC-SHA256 verifiable consent receipt anchored in the MeghRaj SHA-256 audit log.
          </p>
        </div>
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="gov-btn-outline">
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || otp.trim().length < 4}
            onClick={handleConfirm}
            className="gov-btn-emerald"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {submitting ? 'Signing...' : 'Verify OTP & Sign Sec 2(2) Consent'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CertificateModal({ parcel, onClose }) {
  if (!parcel) return null;
  const v = parcel.valuation;
  const isPaid = parcel.disbursementStatus === 'CREDITED_PFMS';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between no-print">
          <h3 className="text-sm font-bold">
            Statutory Record — {parcel.parcelNumber} ({formatUlpin(parcel.ulpin)})
          </h3>
          <button type="button" onClick={onClose} className="text-slate-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="border-2 border-slate-900 rounded-lg p-5 bg-[#FCFDFB] space-y-4">
            <div className="text-center border-b-2 border-[#047857] pb-3">
              <div className="text-[10px] font-extrabold tracking-widest text-[#047857] uppercase">
                BHOOMI-SETU · NATIONAL DIGITAL LAND ACQUISITION PORTAL (RFCTLARR ACT 2013)
              </div>
              <h2 className="text-base font-extrabold text-slate-900 mt-1">
                {isPaid
                  ? 'PFMS 24-HR DBT RECEIPT & DILRMP MUTATION CERTIFICATE'
                  : 'STATUTORY SCHEDULE I LAND AWARD & ESCROW RECORD'}
              </h2>
              <div className="text-xs text-slate-600 mt-0.5">
                {parcel.recordType} · District {parcel.district} ({parcel.stateCode}) · ULPIN{' '}
                <span className="font-mono font-semibold">{formatUlpin(parcel.ulpin)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-800">
              <div><strong>Parcel / Khata:</strong> {parcel.parcelNumber} ({parcel.khataNumber})</div>
              <div><strong>Area / Zone:</strong> {parcel.areaHectares} Ha ({parcel.zone})</div>
              <div><strong>Landowner:</strong> {parcel.farmerName}</div>
              <div><strong>Tokenized VID:</strong> <span className="font-mono">{parcel.aadhaarVid}</span></div>
              <div><strong>PFMS Bank Account:</strong> {parcel.bankAccountMasked}</div>
              <div><strong>PFMS UTR:</strong> <span className="font-mono font-semibold">{parcel.pfmsUtr || 'PENDING RELEASE'}</span></div>
              <div><strong>DILRMP RoR Status:</strong> <span className="font-mono">{parcel.mutationStatus}</span></div>
              <div><strong>PMKVY 4.0 (NSDC):</strong> {parcel.pmKaushalEnrolled ? parcel.pmKaushalTrack : 'Eligible (Unenrolled)'}</div>
            </div>

            <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                <span>1. Base Market Rate ({parcel.areaHectares} Ha × {formatInr(v.circleRatePerHa)}/Ha)</span>
                <span className="font-mono tabular-nums">{formatInr(v.baseMarketValue)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                <span>2. Schedule I Multiplier ({v.factorApplied}x {v.zone})</span>
                <span className="font-mono tabular-nums">{formatInr(v.multipliedValue)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                <span>3. ISRO NDVI Crop + LiDAR Structural Assets</span>
                <span className="font-mono tabular-nums">{formatInr(v.assetsAndCropValue)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                <span>4. Statutory 100% Solatium (Sec 30(1))</span>
                <span className="font-mono tabular-nums">{formatInr(v.solatiumAmount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                <span>5. 12% p.a. Statutory Additional Amount (Sec 30(3))</span>
                <span className="font-mono tabular-nums">{formatInr(v.statutoryInterest12Pct)}</span>
              </div>
              {v.bankLienDeduction > 0 && (
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200 text-orange-700">
                  <span>6. Less NeSL / CERSAI Bank Lien Settlement</span>
                  <span className="font-mono tabular-nums">-{formatInr(v.bankLienDeduction)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-sm font-extrabold text-[#047857]">
                <span>Net Beneficiary PFMS Payout</span>
                <span className="font-mono tabular-nums">{formatInr(v.netFarmerPayout)}</span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold">
              + Schedule II Transition Annuity: {formatInr(v.monthlyAnnuity)}/month × 24 months ({formatInr(v.totalAnnuity24M)} total)
            </div>

            {parcel.consentReceiptHmac && (
              <div className="text-[10px] font-mono text-slate-500 break-all">
                HMAC-SHA256 e-Sign Receipt: {parcel.consentReceiptHmac}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 no-print">
          <button type="button" onClick={onClose} className="gov-btn-outline">
            Close
          </button>
          <button type="button" onClick={() => window.print()} className="gov-btn-primary">
            <Printer className="w-3.5 h-3.5" /> Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}
