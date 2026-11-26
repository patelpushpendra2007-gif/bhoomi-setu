import React, { useCallback, useEffect, useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { apiRequest, getStoredToken, openEventStream, setStoredToken } from './lib/api';
import AuthPortal from './components/AuthPortal';
import StatusHeader from './components/StatusHeader';
import CollectorView from './components/CollectorView';
import OfficerView from './components/OfficerView';
import FarmerView from './components/FarmerView';
import AgencyView from './components/AgencyView';
import GisWorkspaceView from './components/GisWorkspaceView';
import ModelsLabView from './components/ModelsLabView';
import AuditStackView from './components/AuditStackView';
import { CertificateModal, ESIGNModal } from './components/StatutoryModal';

const OFFLINE_QUEUE_KEY = 'bhoomi_setu_offline_queue_v3';

export default function App() {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(getStoredToken()));
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [snapshot, setSnapshot] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [corridorId, setCorridorId] = useState('PRJ-NH44-UP');
  const [selectedParcelId, setSelectedParcelId] = useState('BS-UP-402');
  const [farmerLang, setFarmerLang] = useState('hi');
  const [offlineMode, setOfflineMode] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [certParcel, setCertParcel] = useState(null);
  const [esignParcel, setEsignParcel] = useState(null);
  const [tourStep, setTourStep] = useState(null);

  const showToast = useCallback((text, tone = 'info') => {
    setToast({ id: Date.now(), text, tone });
    setTimeout(() => {
      setToast((cur) => (cur && Date.now() - cur.id >= 3800 ? null : cur));
    }, 4000);
  }, []);

  useEffect(() => {
    apiRequest('/auth/demo-accounts', { token: '' })
      .then((res) => setDemoAccounts(res.accounts || []))
      .catch(() => {});
  }, []);

  const refreshState = useCallback(async (authTok = token) => {
    if (!authTok) return;
    const data = await apiRequest('/state', { token: authTok });
    setSnapshot(data);
    if (data.corridors?.length && !data.corridors.some((c) => c.id === corridorId)) {
      setCorridorId(data.corridors[0].id);
    }
  }, [token, corridorId]);

  useEffect(() => {
    if (!token) {
      setAuthLoading(false);
      return;
    }
    setAuthLoading(true);
    apiRequest('/auth/me', { token })
      .then(async (res) => {
        setUser(res.user);
        setFarmerLang(res.user.preferredLang || 'hi');
        if (res.user.linkedParcelId) setSelectedParcelId(res.user.linkedParcelId);
        await refreshState(token);
      })
      .catch(() => {
        setStoredToken(null);
        setToken(null);
        setUser(null);
      })
      .finally(() => setAuthLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;
    return openEventStream(token, (evt) => {
      if (evt === 'state_updated') {
        refreshState(token).catch(() => {});
      }
    });
  }, [token, user, refreshState]);

  // Sync URL cleanly for /login and role paths
  useEffect(() => {
    if (!user) {
      if (window.location.pathname !== '/login') {
        window.history.replaceState({}, '', '/login');
      }
      return;
    }
    const targetPath =
      activeTab === 'dashboard' ? `/${user.role}` : `/${activeTab}`;
    if (window.location.pathname !== targetPath) {
      window.history.replaceState({}, '', targetPath);
    }
  }, [user, activeTab]);

  const handleAuthenticated = ({ token: newTok, user: newUser }) => {
    setStoredToken(newTok);
    setToken(newTok);
    setUser(newUser);
    setActiveTab('dashboard');
    setFarmerLang(newUser.preferredLang || 'hi');
    if (newUser.linkedParcelId) setSelectedParcelId(newUser.linkedParcelId);
    showToast(`Signed in as ${newUser.name} (${newUser.role.toUpperCase()}).`);
  };

  const handleSwitchRole = async (role) => {
    setBusy(true);
    try {
      const data = await apiRequest('/auth/demo-login', {
        method: 'POST',
        token: '',
        body: { role }
      });
      handleAuthenticated(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setSnapshot(null);
    setTourStep(null);
  };

  const saveQueue = (q) => {
    setOfflineQueue(q);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q));
  };

  const handleToggleOffline = async () => {
    if (!offlineMode) {
      setOfflineMode(true);
      showToast('Switched to Offline CSC Field Mode. Farmer actions will queue locally.', 'warn');
      return;
    }
    setOfflineMode(false);
    if (offlineQueue.length > 0) {
      try {
        const res = await apiRequest('/sync-queue', {
          method: 'POST',
          body: { items: offlineQueue }
        });
        setSnapshot(res);
        saveQueue([]);
        showToast(`Reconnected to MeghRaj NIC Cloud! Synced ${res.synced} queued actions.`);
      } catch (err) {
        showToast(err.message, 'error');
      }
    } else {
      await refreshState();
      showToast('MeghRaj NIC Cloud Online.');
    }
  };

  const runAction = async (path, body = {}, offlineMeta = null) => {
    if (offlineMode) {
      if (!offlineMeta) {
        showToast('Online connection required for Collector / Treasury server actions.', 'warn');
        return null;
      }
      const nextQ = [...offlineQueue, { id: Date.now(), ...offlineMeta, payload: body }];
      saveQueue(nextQ);
      showToast(`Queued offline for CSC sync (${nextQ.length} pending).`, 'warn');
      return null;
    }

    setBusy(true);
    try {
      const res = await apiRequest(path, { method: 'POST', body });
      if (res.corridors) setSnapshot(res);
      else await refreshState();
      return res;
    } catch (err) {
      showToast(err.message, 'error');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const activeCorridor =
    snapshot?.corridors?.find((c) => c.id === corridorId) || snapshot?.corridors?.[0] || null;
  const corridorParcels = (snapshot?.parcels || []).filter(
    (p) => !activeCorridor || p.projectId === activeCorridor.id
  );

  const handleSelectCorridor = (nextId) => {
    setCorridorId(nextId);
    const first = (snapshot?.parcels || []).find((p) => p.projectId === nextId);
    if (first) setSelectedParcelId(first.id);
  };

  const handleKmlScan = async () => {
    if (!activeCorridor) return;
    setScanning(true);
    setTimeout(async () => {
      setScanning(false);
      const res = await runAction(`/corridors/${activeCorridor.id}/kml-realign`, {
        shiftMeters: activeCorridor.corridorShiftMeters || 0
      });
      if (res) {
        showToast(`ISRO Bhuvan KML scanned ${res.scannedCount} ULPIN parcels in 2.4s.`);
      }
    }, 1200);
  };

  const TOUR_STEPS = [
    {
      role: 'agency',
      tab: 'dashboard',
      title: 'Step 1/5 · PM GatiShakti KML & Forest Geo-Fence Solver',
      desc: 'Shift the 60m corridor +20m North to eliminate the 18m MoEFCC Reserve Forest overlap on Khasra #406 automatically.',
      actionLabel: 'Shift +20m North & Re-Scan',
      run: () => activeCorridor && runAction(`/corridors/${activeCorridor.id}/kml-realign`, { shiftMeters: 20 })
    },
    {
      role: 'officer',
      tab: 'models',
      title: 'Step 2/5 · 36-State Harmonizer & Schedule I Engine',
      desc: 'Inspect how 28 States & 8 UTs map onto RFCTLARR Schedule I (1x–2x + 100% Solatium + 12% Sec 30(3) + IGRS + NDVI).',
      actionLabel: 'Open Officer Valuation',
      run: async () => setActiveTab('dashboard')
    },
    {
      role: 'farmer',
      tab: 'dashboard',
      parcelId: 'BS-UP-405',
      title: 'Step 3/5 · BhoomiTracker 12-Language UI & Aadhaar VID e-Sign',
      desc: 'Sign Sec 2(2) consent for Kamla Devi (Khasra #405) via zero-PII Aadhaar VID tokenization.',
      actionLabel: 'Sign Khasra #405 Consent',
      run: () => runAction('/parcels/BS-UP-405/consent', { vidToken: 'VID-3109-6428-9920' })
    },
    {
      role: 'collector',
      tab: 'dashboard',
      parcelId: 'BS-UP-402',
      title: 'Step 4/5 · 1-Click 24-Hr PFMS DBT & DILRMP Auto-Mutation',
      desc: 'Sanction Khasra #402 (₹14,50,000 + ₹8,000/mo annuity). Sec 77 isolates disputed Khasra #403 with zero corridor stay.',
      actionLabel: 'Release ₹14.50L PFMS DBT',
      run: () => runAction('/parcels/BS-UP-402/approve-dbt', {})
    },
    {
      role: 'collector',
      tab: 'audit',
      title: 'Step 5/5 · Lightweight SHA-256 Cryptographic Audit Proof',
      desc: 'Simulate an unauthorized SQL edit and watch MeghRaj SHA-256 chain validation catch the breach instantaneously.',
      actionLabel: 'Simulate Tamper Attack',
      run: () => runAction('/audit/tamper', {})
    }
  ];

  const activateTourStep = async (idx) => {
    const step = TOUR_STEPS[idx];
    setTourStep(idx);
    if (user?.role !== step.role) {
      await handleSwitchRole(step.role);
    }
    setActiveTab(step.tab);
    if (step.parcelId) setSelectedParcelId(step.parcelId);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FB] text-slate-600 text-sm font-semibold">
        Verifying MeghRaj JWT Session...
      </div>
    );
  }

  if (!user) {
    return <AuthPortal onAuthenticated={handleAuthenticated} demoAccounts={demoAccounts} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FB]">
      <StatusHeader
        user={user}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        corridors={snapshot?.corridors || []}
        activeCorridorId={activeCorridor?.id || corridorId}
        onSelectCorridor={handleSelectCorridor}
        offlineMode={offlineMode}
        offlineQueueCount={offlineQueue.length}
        onToggleOffline={handleToggleOffline}
        auditValid={snapshot?.auditIntegrity?.valid !== false}
        onStartTour={() => activateTourStep(0)}
        onSwitchRole={handleSwitchRole}
        onReset={async () => {
          saveQueue([]);
          setOfflineMode(false);
          const res = await runAction('/reset', {});
          if (res) showToast('Demo state reset cleanly to initial benchmarks.');
        }}
        onLogout={handleLogout}
      />

      {/* Guided Jury Tour Banner */}
      {tourStep !== null && (
        <div className="bg-amber-50 border-b border-amber-300 px-4 sm:px-6 py-2.5 no-print">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs">
              <div className="font-extrabold text-slate-900">{TOUR_STEPS[tourStep].title}</div>
              <div className="text-slate-700">{TOUR_STEPS[tourStep].desc}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => TOUR_STEPS[tourStep].run()}
                className="gov-btn-emerald py-1.5 px-3 text-xs"
              >
                {TOUR_STEPS[tourStep].actionLabel}
              </button>
              <button
                type="button"
                onClick={() => activateTourStep((tourStep + 1) % TOUR_STEPS.length)}
                className="gov-btn-outline py-1.5 px-3 text-xs"
              >
                Next <ArrowRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setTourStep(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {!snapshot ? (
          <div className="gov-card p-8 text-center text-sm text-slate-600">
            Loading synchronized national land acquisition ledger...
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && user.role === 'collector' && (
              <CollectorView
                corridor={activeCorridor}
                parcels={corridorParcels}
                objections={snapshot.objections}
                selectedParcelId={selectedParcelId}
                onSelectParcel={setSelectedParcelId}
                onApproveDbt={async (id) => {
                  const res = await runAction(`/parcels/${id}/approve-dbt`, {});
                  if (res) showToast(`24-Hr PFMS DBT credited (${res.parcel?.pfmsUtr}) & DILRMP mutated!`);
                }}
                onBatchDisburse={async () => {
                  const res = await runAction('/collector/batch-disburse', { projectId: activeCorridor?.id });
                  if (res) showToast(`Batch PFMS DBT released for ${res.disbursedCount} consented parcels.`);
                }}
                onToggleEscrow={async (id) => {
                  const res = await runAction(`/parcels/${id}/escrow`, {});
                  if (res) showToast('Sec 77 Digital Court Escrow status updated.');
                }}
                onOpenCert={setCertParcel}
                onOpenGis={() => setActiveTab('gis')}
                onTriageObjection={(id) => runAction(`/objections/${id}/triage`, {})}
                onEscalateLarr={(id) => runAction(`/objections/${id}/escalate-larr`, {})}
                onResolveObjection={(id) => runAction(`/objections/${id}/resolve`, {})}
                busy={busy}
              />
            )}

            {activeTab === 'dashboard' && user.role === 'officer' && (
              <OfficerView
                corridor={activeCorridor}
                parcels={corridorParcels}
                selectedParcelId={selectedParcelId}
                onSelectParcel={setSelectedParcelId}
                onRunScan={handleKmlScan}
                onSaveValuation={async (id, payload) => {
                  const res = await runAction(`/parcels/${id}/valuation`, payload);
                  if (res) showToast(`Schedule I Award signed & persisted for ${res.parcel.parcelNumber}.`);
                }}
                onOpenCert={setCertParcel}
                scanning={scanning}
                busy={busy}
              />
            )}

            {activeTab === 'dashboard' && user.role === 'farmer' && (
              <FarmerView
                parcels={snapshot.parcels}
                selectedParcelId={selectedParcelId}
                onSelectParcel={setSelectedParcelId}
                farmerLang={farmerLang}
                onChangeLang={setFarmerLang}
                onOpenEsign={setEsignParcel}
                onEnrollPmkvy={async (id, courseCode) => {
                  const res = await runAction(
                    `/parcels/${id}/pm-kaushal`,
                    { courseCode },
                    { actionType: 'PM_KAUSHAL', parcelId: id }
                  );
                  if (res) showToast('Enrolled in official PMKVY 4.0 (NSDC) Livelihood Track!');
                }}
                onRaiseObjection={async (parcel) => {
                  const res = await runAction(
                    '/objections',
                    {
                      parcelId: parcel.id,
                      category: 'Sec 15 Valuation / Payout Review',
                      summary: `Submitted via BhoomiTracker (${farmerLang.toUpperCase()}) for 7–15 day CALA triage.`
                    },
                    { actionType: 'CREATE_OBJECTION', parcelId: parcel.id }
                  );
                  if (res) showToast(`Sec 15 Objection ${res.objection.id} filed (7–15d triage started).`);
                }}
                onIvrsAction={async (id, key) => {
                  const res = await runAction(`/parcels/${id}/ivrs-action`, { key });
                  return res?.ivrsPrompt || '';
                }}
                onOpenCert={setCertParcel}
                busy={busy}
              />
            )}

            {activeTab === 'dashboard' && user.role === 'agency' && (
              <AgencyView
                corridor={activeCorridor}
                parcels={corridorParcels}
                selectedParcelId={selectedParcelId}
                onSelectParcel={setSelectedParcelId}
                onKmlRealign={async (id, shift) => {
                  setScanning(true);
                  setTimeout(async () => {
                    setScanning(false);
                    const res = await runAction(`/corridors/${id}/kml-realign`, { shiftMeters: shift });
                    if (res) showToast(`KML realignment applied (${shift >= 0 ? `+${shift}m N` : `${shift}m S`}).`);
                  }, 900);
                }}
                onCreateCorridor={async (payload) => {
                  const res = await runAction('/corridors', payload);
                  if (res?.corridor) {
                    setCorridorId(res.corridor.id);
                    const first = res.parcels.find((p) => p.projectId === res.corridor.id);
                    if (first) setSelectedParcelId(first.id);
                    showToast(`Corridor "${res.corridor.name}" launched with 3 auto-extracted ULPINs!`);
                    return true;
                  }
                  return false;
                }}
                onOpenCert={setCertParcel}
                scanning={scanning}
                busy={busy}
              />
            )}

            {activeTab === 'gis' && (
              <GisWorkspaceView
                corridor={activeCorridor}
                parcels={corridorParcels}
                selectedParcelId={selectedParcelId}
                onSelectParcel={setSelectedParcelId}
                onRunScan={handleKmlScan}
                onOpenCert={setCertParcel}
                onJumpToFarmer={async (pid) => {
                  await handleSwitchRole('farmer');
                  setSelectedParcelId(pid);
                }}
                scanning={scanning}
              />
            )}

            {activeTab === 'models' && <ModelsLabView parcels={snapshot.parcels} />}

            {activeTab === 'audit' && (
              <AuditStackView
                auditIntegrity={snapshot.auditIntegrity}
                auditLogs={snapshot.auditLogs}
                gateways={snapshot.gateways}
                cloudStatus={snapshot.cloudStatus}
                onSimulateTamper={async () => {
                  const res = await runAction('/audit/tamper', {});
                  if (res) showToast('TAMPER ALERT: SHA-256 verification flagged unauthorized SQL edit!', 'error');
                }}
                onRestoreAudit={async () => {
                  const res = await runAction('/audit/restore', {});
                  if (res) showToast('Cryptographic SHA-256 chain restored and verified.');
                }}
                busy={busy}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <CertificateModal parcel={certParcel} onClose={() => setCertParcel(null)} />
      <ESIGNModal
        parcel={esignParcel}
        onClose={() => setEsignParcel(null)}
        onConfirm={async (parcel) => {
          const res = await runAction(
            `/parcels/${parcel.id}/consent`,
            { vidToken: parcel.aadhaarVid },
            { actionType: 'CONSENT', parcelId: parcel.id }
          );
          if (res) showToast(`Aadhaar VID e-Sign verified for ${parcel.parcelNumber}!`);
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 rounded-xl shadow-lg text-xs font-semibold text-white border-l-4 ${
            toast.tone === 'error'
              ? 'bg-slate-900 border-l-rose-500'
              : toast.tone === 'warn'
                ? 'bg-slate-900 border-l-amber-500'
                : 'bg-slate-900 border-l-emerald-500'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
