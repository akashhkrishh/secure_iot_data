import type { Patient, SensorReading } from '../types';
import { Topbar } from './Topbar';
import { LiveGraph } from './LiveGraph';
import { Trash2, Edit2, History, Activity, Calendar, Droplet, Check } from 'lucide-react';

interface PatientDetailViewProps {
  sp: Patient | null;
  espOnline: boolean;
  onBack: () => void;
  onDeletePatient: (mobile: string) => void;
  ask: (opts: any) => void;
  
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  editForm: any;
  setEditForm: React.Dispatch<React.SetStateAction<any>>;
  editErrors: Record<string, string>;
  setEditErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onUpdatePatient: () => Promise<void>;
  
  isCapturing: boolean;
  countdown: number;
  triggerReading: () => Promise<void>;
  sampleCount: React.MutableRefObject<number>;
  
  hrData: number[];
  tempData: number[];
  spo2Data: number[];
  
  history: SensorReading[];
  deleteReading: (id: number) => Promise<void>;
  deleteAllReadings: () => Promise<void>;
}

const calcAge = (dob?: string | null) => {
  if (!dob) return '—';
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) + ' yrs';
};

const initials = (n: string) => n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
const avatarGrad = (g?: string) => g === 'Male' ? 'from-blue-500 to-indigo-600' : g === 'Female' ? 'from-pink-500 to-rose-600' : 'from-slate-500 to-slate-700';

const hrStatus = (hr: number) => hr < 60 ? { l: 'Low HR', c: 'text-amber-400 bg-amber-400/10 border-amber-500/30' } : hr > 100 ? { l: 'High HR', c: 'text-red-400 bg-red-400/10 border-red-500/30' } : { l: 'Normal', c: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30' };
const spo2Status = (s: number) => s < 95 ? { l: 'Low', c: 'text-amber-400 bg-amber-400/10 border-amber-500/30' } : { l: 'Normal', c: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30' };

export function PatientDetailView({
  sp, espOnline, onBack, onDeletePatient, ask,
  editMode, setEditMode, editForm, setEditForm, editErrors, setEditErrors, onUpdatePatient,
  isCapturing, countdown, triggerReading, sampleCount,
  hrData, tempData, spo2Data,
  history, deleteReading, deleteAllReadings
}: PatientDetailViewProps) {
  if (!sp) return null;

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: '#060B18' }}>
      <Topbar label={sp.name} espOnline={espOnline} back={onBack} />

      {/* HERO BANNER */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#0a1120]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10 blur-[80px] bg-gradient-to-br ${avatarGrad(sp.gender)}`} />
        </div>
        <div className="relative max-w-7xl mx-auto px-8 py-8 flex flex-col lg:flex-row lg:items-center gap-8">
          {/* Identity */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${avatarGrad(sp.gender)} flex items-center justify-center text-white font-extrabold text-3xl flex-shrink-0 shadow-lg shadow-black/40 ring-4 ring-white/5`}>
              {initials(sp.name)}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{sp.name}</h1>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-xs font-semibold text-slate-300 bg-white/10 px-3 py-1 rounded-full">{sp.gender || 'Unknown'}</span>
                <span className="text-xs font-semibold text-slate-300 bg-white/10 px-3 py-1 rounded-full flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {calcAge(sp.dob)}</span>
                {sp.blood_group && <span className="text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full flex items-center gap-1.5"><Droplet className="w-3 h-3" /> {sp.blood_group}</span>}
                <span className="text-xs text-slate-500 font-mono ml-2 border border-white/10 px-2 py-1 rounded-md">{sp.mobile}</span>
              </div>
            </div>
          </div>
          {/* Last vitals */}
          <div className="lg:ml-auto flex items-center gap-3 flex-wrap">
            {sp.latest_reading ? (
              <>
                {([
                  { label: 'Heart Rate', val: sp.latest_reading.hr, unit: 'BPM', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', bd: 'rgba(244,63,94,0.2)' },
                  { label: 'Temperature', val: sp.latest_reading.temp, unit: '°C', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', bd: 'rgba(245,158,11,0.2)' },
                  { label: 'SpO₂', val: sp.latest_reading.spo2, unit: '%', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', bd: 'rgba(56,189,248,0.2)' },
                ] as const).map(s => (
                  <div key={s.label} className="flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-md" style={{ background: s.bg, borderColor: s.bd }}>
                    <div>
                      <p className="text-xs text-slate-400 font-medium mb-1 opacity-80">{s.label}</p>
                      <p className="text-3xl font-extrabold leading-none tracking-tight" style={{ color: s.color }}>
                        {s.unit === '°C' ? s.val.toFixed(1) : s.val}
                        <span className="text-sm font-medium text-slate-500 ml-1">{s.unit}</span>
                      </p>
                    </div>
                  </div>
                ))}
                <div className="w-full text-right mt-1">
                  <p className="text-xs text-slate-500 font-medium flex items-center justify-end gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    Last reading: {sp.latest_reading.timestamp}
                  </p>
                </div>
              </>
            ) : (
              <div className="px-6 py-4 rounded-2xl border border-dashed border-white/10 text-slate-500 text-sm glass-card flex items-center gap-2">
                <Activity className="w-4 h-4 opacity-50" /> No initial telemetry recorded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-8 py-8 flex gap-8 w-full flex-1 items-start">
        {/* LEFT SIDEBAR */}
        <aside className="w-72 flex-shrink-0 space-y-5 sticky top-24">
          <div className="rounded-2xl border p-6 glass-card shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Patient Info
              </p>
              {!editMode
                ? <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-all border border-indigo-500/20">
                    <Edit2 className="w-3.5 h-3.5" />Edit
                  </button>
                : <div className="flex gap-2">
                    <button onClick={() => { setEditMode(false); setEditForm({ name: sp?.name || '', gender: sp?.gender || '', dob: sp?.dob || '', blood_group: sp?.blood_group || '', address: sp?.address || '' }); }}
                      className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors font-medium">Cancel</button>
                    <button onClick={onUpdatePatient} className="flex items-center gap-1 text-xs font-bold text-white px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md">
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                  </div>
              }
            </div>
            {!editMode ? (
              <div className="space-y-4">
                {[
                  { label: 'Mobile', value: sp?.mobile || '' },
                  { label: 'DOB', value: sp?.dob || '' },
                  { label: 'Age', value: calcAge(sp?.dob) },
                  { label: 'Blood Group', value: sp?.blood_group || '' },
                  { label: 'Address', value: sp?.address || '' },
                ].map(f => (
                  <div key={f.label} className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{f.label}</span>
                    <span className="text-sm text-slate-200 font-medium">{f.value || '—'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {editErrors._server && <p className="text-red-400 text-[11px] bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20 animate-in fade-in">{editErrors._server}</p>}

                <div>
                  <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Name *</label>
                  <input type="text" value={editForm.name}
                    onChange={e => { setEditForm((p: any) => ({ ...p, name: e.target.value })); setEditErrors((p: any) => ({ ...p, name: '' })); }}
                    className={`w-full bg-black/20 border ${editErrors.name ? 'border-red-500/60' : 'border-white/10'} focus:border-indigo-500 rounded-lg px-3 py-2 text-white text-sm outline-none`} />
                  {editErrors.name && <p className="text-red-400 text-[10px] mt-1">{editErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Gender *</label>
                  <select value={editForm.gender}
                    onChange={e => { setEditForm((p: any) => ({ ...p, gender: e.target.value })); setEditErrors((p: any) => ({ ...p, gender: '' })); }}
                    className={`w-full bg-black/20 border ${editErrors.gender ? 'border-red-500/60' : 'border-white/10'} rounded-lg px-3 py-2 text-white text-sm outline-none`}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                  {editErrors.gender && <p className="text-red-400 text-[10px] mt-1">{editErrors.gender}</p>}
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Date of Birth</label>
                  <input type="date" value={editForm.dob} max={new Date().toISOString().split('T')[0]}
                    onChange={e => { setEditForm((p: any) => ({ ...p, dob: e.target.value })); setEditErrors((p: any) => ({ ...p, dob: '' })); }}
                    className={`w-full bg-black/20 border ${editErrors.dob ? 'border-red-500/60' : 'border-white/10'} focus:border-indigo-500 rounded-lg px-3 py-2 text-white text-sm outline-none [color-scheme:dark]`} />
                  {editErrors.dob && <p className="text-red-400 text-[10px] mt-1">{editErrors.dob}</p>}
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Blood Group</label>
                  <input type="text" list="edit-blood-list" value={editForm.blood_group}
                    onChange={e => { setEditForm((p: any) => ({ ...p, blood_group: e.target.value })); setEditErrors((p: any) => ({ ...p, blood_group: '' })); }}
                    className={`w-full bg-black/20 border ${editErrors.blood_group ? 'border-red-500/60' : 'border-white/10'} focus:border-indigo-500 rounded-lg px-3 py-2 text-white text-sm outline-none`} />
                  <datalist id="edit-blood-list">{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g} value={g} />)}</datalist>
                  {editErrors.blood_group && <p className="text-red-400 text-[10px] mt-1">{editErrors.blood_group}</p>}
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Address</label>
                  <input type="text" value={editForm.address}
                    onChange={e => { setEditForm((p: any) => ({ ...p, address: e.target.value })); setEditErrors((p: any) => ({ ...p, address: '' })); }}
                    className={`w-full bg-black/20 border ${editErrors.address ? 'border-red-500/60' : 'border-white/10'} focus:border-indigo-500 rounded-lg px-3 py-2 text-white text-sm outline-none`} />
                  {editErrors.address && <p className="text-red-400 text-[10px] mt-1">{editErrors.address}</p>}
                </div>
              </div>
            )}
          </div>

          <button onClick={() => ask({ title: `Delete ${sp.name}?`, message: 'Permanently removes this patient and ALL reading history. Cannot be undone.', confirmLabel: 'Delete Patient', onConfirm: () => onDeletePatient(sp.mobile) })}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-red-400 hover:text-white border border-red-500/20 hover:bg-red-600 hover:border-red-600 transition-all shadow-md group">
            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> Delete Patient Record
          </button>
        </aside>

        {/* RIGHT MAIN */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Trigger card with countdown */}
          <div className="rounded-2xl border overflow-hidden glass-card shadow-xl relative">
            <div className="flex items-center justify-between px-6 py-6">
              <div>
                <h2 className="font-extrabold text-white text-xl tracking-tight flex items-center gap-2">
                  <Activity className="w-6 h-6 text-indigo-400" /> Live Telemetry Capture
                </h2>
                <p className="text-sm text-slate-400 mt-1 font-medium">30-second measurement window · Node broadcasts every 500ms</p>
              </div>

              {isCapturing ? (
                <div className="flex items-center gap-5 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md">
                  <div className="relative w-14 h-14 flex-shrink-0">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                      <circle cx="28" cy="28" r="24" fill="none"
                        stroke="#f43f5e" strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 24}`}
                        strokeDashoffset={`${2 * Math.PI * 24 * (1 - countdown / 30)}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.9s linear' }}
                        className="drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-white font-extrabold text-lg leading-none">
                      {countdown}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center justify-end gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                      Recording
                    </p>
                    <p className="text-slate-300 text-sm font-medium">{sampleCount.current} samples</p>
                  </div>
                </div>
              ) : (
                <button onClick={triggerReading} disabled={!espOnline}
                  className={`flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-base transition-all ${!espOnline ? 'opacity-40 cursor-not-allowed grayscale' : 'hover:opacity-90 active:scale-[0.97] bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 text-white'}`}>
                  <Activity className="w-5 h-5" />
                  Start 30s Reading
                </button>
              )}
            </div>

            {isCapturing && (
              <div className="h-1.5 w-full bg-black/40 relative">
                <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.6)]"
                  style={{ width: `${(countdown / 30) * 100}%`, transition: 'width 0.9s linear' }} />
              </div>
            )}
          </div>

          {/* Live graphs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <LiveGraph data={hrData} color="#f43f5e" label="Heart Rate" unit="BPM" min={40} max={160} isCapturing={isCapturing} />
            <LiveGraph data={tempData} color="#f59e0b" label="Temperature" unit="°C" min={35} max={40} isCapturing={isCapturing} />
            <LiveGraph data={spo2Data} color="#38bdf8" label="SpO2" unit="%" min={90} max={100} isCapturing={isCapturing} />
          </div>

          {/* History table */}
          <div className="rounded-2xl border overflow-hidden glass-card shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <History className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Reading History</h3>
                  <p className="text-xs text-slate-400 font-medium">{history.length} record{history.length !== 1 ? 's' : ''} saved</p>
                </div>
              </div>
              {history.length > 0 && (
                <button onClick={() => ask({ title: 'Delete All Readings?', message: `Permanently erase all ${history.length} reading(s) for ${sp?.name}? Patient record stays.`, confirmLabel: 'Delete All', onConfirm: deleteAllReadings })}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all">
                  <Trash2 className="w-4 h-4" /> Clear All
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-slate-300 text-base font-medium tracking-wide">No readings recorded yet</p>
                <p className="text-slate-500 text-sm mt-1.5">Press <span className="text-indigo-400 font-semibold">Start 30s Reading</span> to capture telemetry</p>
              </div>
            ) : (
              <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 z-10 backdrop-blur-md bg-[#08101e]/90 shadow-sm">
                    <tr>
                      {['#', 'Date & Time', 'Heart Rate', 'Temp', 'SpO₂', 'HR Status', 'SpO₂ Status', ''].map(h => (
                        <th key={h} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap first:pl-6 last:pr-6 border-b border-white/10">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.map((r, i) => {
                      const hs = hrStatus(r.hr), ss = spo2Status(r.spo2);
                      return (
                        <tr key={r.id ?? i} className="hover:bg-white/[0.03] transition-colors group">
                          <td className="px-6 py-4 text-slate-500 font-mono text-xs font-medium">{history.length - i}</td>
                          <td className="px-6 py-4 text-slate-300 font-medium whitespace-nowrap">{r.timestamp}</td>
                          <td className="px-6 py-4"><span className="text-rose-400 font-bold text-base">{r.hr}</span><span className="text-slate-500 text-xs ml-1">BPM</span></td>
                          <td className="px-6 py-4"><span className="text-amber-400 font-bold text-base">{r.temp}</span><span className="text-slate-500 text-xs ml-1">°C</span></td>
                          <td className="px-6 py-4"><span className="text-sky-400 font-bold text-base">{r.spo2}</span><span className="text-slate-500 text-xs ml-1">%</span></td>
                          <td className="px-6 py-4"><span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${hs.c}`}>{hs.l}</span></td>
                          <td className="px-6 py-4"><span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${ss.c}`}>{ss.l}</span></td>
                          <td className="px-6 py-4 text-right">
                            {r.id !== undefined && (
                              <button onClick={() => ask({ title: 'Delete Reading?', message: `Remove reading from ${r.timestamp}? Cannot be undone.`, confirmLabel: 'Delete', onConfirm: () => deleteReading(r.id!) })}
                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
