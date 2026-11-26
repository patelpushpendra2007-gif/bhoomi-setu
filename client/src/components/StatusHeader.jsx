import React from 'react';
import {
  Landmark,
  Wifi,
  WifiOff,
  Play,
  RotateCcw,
  LogOut,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

const ROLE_SWITCH_OPTIONS = [
  { role: 'collector', label: 'Collector (DM)' },
  { role: 'officer', label: 'Officer (CALA)' },
  { role: 'farmer', label: 'Farmer (BhoomiTracker)' },
  { role: 'agency', label: 'Infra Agency (NHAI)' }
];

export default function StatusHeader({
  user,
  activeTab,
  onSelectTab,
  corridors,
  activeCorridorId,
  onSelectCorridor,
  offlineMode,
  offlineQueueCount,
  onToggleOffline,
  auditValid,
  onStartTour,
  onSwitchRole,
  onReset,
  onLogout
}) {
  const tabs = [
    { id: 'dashboard', label: `${user.role === 'farmer' ? 'BhoomiTracker' : user.role === 'collector' ? 'Collector Desk' : user.role === 'officer' ? 'Officer GIS & Award' : 'Agency Portal'}` },
    { id: 'gis', label: 'ISRO Bhuvan GIS' },
    { id: 'models', label: 'Working Models & 36-State Law' },
    { id: 'audit', label: 'MeghRaj Audit & Defense', alert: !auditValid }
  ];

  return (
    <header className="sticky top-0 z-40 no-print">
      {/* Primary Sovereign Masthead */}
      <div className="bg-[#0F172A] text-white border-b border-slate-800 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-[#047857] border border-emerald-400/30 flex items-center justify-center">
                <Landmark className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-extrabold tracking-tight leading-none">
                  BHOOMI-SETU <span className="text-amber-400 font-bold">भूमि-सेतु</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {user.name} · <span className="font-mono text-slate-300">{user.credentialCode}</span>
                </div>
              </div>
            </button>
          </div>

          {/* Seamless Multi-Role Switcher (Real JWT Swap) */}
          <div className="hidden xl:flex items-center bg-slate-800/90 border border-slate-700 rounded-full p-1 gap-0.5">
            {ROLE_SWITCH_OPTIONS.map((opt) => (
              <button
                key={opt.role}
                type="button"
                onClick={() => onSwitchRole(opt.role)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  user.role === opt.role
                    ? 'bg-[#047857] text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleOffline}
              title="Toggle Rural CSC Offline PWA Field Mode"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                offlineMode
                  ? 'bg-amber-950/70 border-amber-500/60 text-amber-200'
                  : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              }`}
            >
              {offlineMode ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{offlineMode ? 'Offline CSC Mode' : 'MeghRaj Online'}</span>
              {offlineQueueCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold tabular-nums">
                  {offlineQueueCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onStartTour}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#C2410C] hover:bg-[#9A3412] text-white transition-colors"
            >
              <Play className="w-3 h-3" />
              <span>Jury Tour</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              title="Reset operational state"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Navigation & Active Corridor Context Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <nav className="flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.id === 'audit' &&
                  (tab.alert ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  ))}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            <label htmlFor="header-corridor-select" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Corridor:
            </label>
            <select
              id="header-corridor-select"
              value={activeCorridorId}
              onChange={(e) => onSelectCorridor(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900"
            >
              {corridors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.stateCode})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
