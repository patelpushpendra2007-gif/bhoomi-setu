import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, RotateCcw, Server, Search } from 'lucide-react';
import { DEFENSE_QA } from '@shared/i18n';

export default function AuditStackView({
  auditIntegrity,
  auditLogs = [],
  gateways = [],
  cloudStatus,
  onSimulateTamper,
  onRestoreAudit,
  busy
}) {
  const [qaQuery, setQaQuery] = useState('');
  const valid = auditIntegrity?.valid !== false;

  const filteredQa = DEFENSE_QA.filter(
    (item) =>
      !qaQuery.trim() ||
      item.q.toLowerCase().includes(qaQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(qaQuery.toLowerCase()) ||
      item.cat.toLowerCase().includes(qaQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#047857]">
            SOVEREIGN DPI ARCHITECTURE · LIGHTWEIGHT SHA-256 AUDIT TRAIL
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
            MeghRaj NIC Cloud Ledger, India Stack G2G Gateways &amp; Defense Guide
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Replaces heavy Hyperledger consensus bloat with deterministic SHA-256 hash-chaining &amp; UIDAI VID HMAC signatures (RPO &lt; 5m).
          </p>
        </div>

        <div>
          {valid ? (
            <button
              type="button"
              disabled={busy}
              onClick={onSimulateTamper}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white"
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Simulate Unauthorized SQL Edit
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={onRestoreAudit}
              className="gov-btn-emerald"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore Cryptographic Chain
            </button>
          )}
        </div>
      </div>

      {/* Integrity Banner */}
      <div
        className={`gov-card p-4 border-l-4 flex flex-wrap items-center justify-between gap-3 ${
          valid ? 'border-l-[#047857] bg-emerald-50/40' : 'border-l-rose-700 bg-rose-50'
        }`}
      >
        <div className="flex items-start gap-3">
          {valid ? (
            <ShieldCheck className="w-5 h-5 text-[#047857] shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          )}
          <div>
            <div className={`text-sm font-bold ${valid ? 'text-[#047857]' : 'text-rose-800'}`}>
              {valid
                ? 'SHA-256 AUDIT CHAIN INTEGRITY VERIFIED (0 TAMPERING)'
                : `SECURITY BREACH DETECTED AT ENTRY #${auditIntegrity?.brokenIndex}`}
            </div>
            <p className="text-xs text-slate-700 mt-0.5">{auditIntegrity?.reason}</p>
          </div>
        </div>
        <span className={`gov-badge ${valid ? 'bg-emerald-100 text-[#047857] border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'}`}>
          {auditIntegrity?.totalEntries || auditLogs.length} Hash-Chained Entries
        </span>
      </div>

      {/* Audit Entries */}
      <div className="gov-card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">Immutable Hash-Chained Audit Log</h2>
          <span className="text-xs text-slate-500">
            {cloudStatus?.primaryDc} · {cloudStatus?.uptimeSla} SLA
          </span>
        </div>

        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {auditLogs.map((entry) => {
            const isBroken = !valid && entry.id === auditIntegrity?.brokenId;
            return (
              <div
                key={entry.id}
                className={`p-3.5 rounded-lg border border-l-4 text-xs space-y-1.5 ${
                  isBroken
                    ? 'bg-rose-50 border-rose-300 border-l-rose-700'
                    : 'bg-white border-slate-200 border-l-[#047857]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{entry.id}</span>
                    <span className="gov-badge bg-slate-100 text-slate-700 border-slate-300">{entry.action}</span>
                    <span>Target: <strong>{entry.parcel_id}</strong></span>
                  </div>
                  <span>
                    Actor: <strong>{entry.actor_id}</strong> ({entry.actor_role}) · VID{' '}
                    <span className="font-mono">{entry.vid_token}</span>
                  </span>
                </div>
                <div className={`font-semibold ${isBroken ? 'text-rose-800' : 'text-slate-900'}`}>
                  {entry.detail}
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded p-2 font-mono text-[10px] text-slate-600 break-all">
                  <div><strong>PrevHash:</strong> {entry.prev_hash}</div>
                  <div><strong>SHA-256 :</strong> {entry.entry_hash}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Authorized India Stack Gateways */}
      <div className="gov-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 inline-flex items-center gap-2">
            <Server className="w-4 h-4 text-[#047857]" /> National India Stack G2G Interoperability Gateways
          </h2>
          <span className="gov-badge bg-emerald-50 text-[#047857] border-emerald-200">
            {gateways.length} / {gateways.length} Online
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px]">
                <th className="py-2.5 px-4">Gateway</th>
                <th className="py-2.5 px-4">Coverage</th>
                <th className="py-2.5 px-4">Statutory Function</th>
                <th className="py-2.5 px-4 text-right">Latency</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {gateways.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-bold text-slate-900">{g.name}</td>
                  <td className="py-2.5 px-4 text-slate-700">{g.scope}</td>
                  <td className="py-2.5 px-4 text-slate-600">{g.purpose}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{g.latencyMs} ms</td>
                  <td className="py-2.5 px-4">
                    <span className="gov-badge bg-emerald-50 text-[#047857] border-emerald-200">{g.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel Cross-Examination Defense */}
      <div className="gov-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">Panel Cross-Examination Reference</h2>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={qaQuery}
              onChange={(e) => setQaQuery(e.target.value)}
              placeholder="Filter Q&A..."
              className="gov-input pl-8 py-1.5 text-xs w-56"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredQa.map((item, idx) => (
            <div key={idx} className="gov-inset p-3.5 space-y-1.5">
              <span className="gov-badge bg-slate-900 text-white border-slate-900">{item.cat}</span>
              <div className="text-xs font-bold text-slate-900">{item.q}</div>
              <p className="text-xs text-slate-600 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
