import type { Patient } from '../types';
import { Topbar } from './Topbar';
import { Users, Activity, CheckCircle2, XCircle, UserPlus, Droplet, Trash2 } from 'lucide-react';

interface DashboardViewProps {
  patients: Patient[];
  espOnline: boolean;
  onLogout: () => void;
  onOpenPatient: (p: Patient) => void;
  onDeletePatient: (mobile: string) => void;
  ask: (opts: any) => void;
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onRegister: (e: React.FormEvent) => Promise<void>;
  regError: string;
}

const calcAge = (dob?: string | null) => {
  if (!dob) return '—';
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) + ' yrs';
};

const initials = (n: string) => n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
const avatarGrad = (g?: string) => g === 'Male' ? 'from-blue-500 to-indigo-600' : g === 'Female' ? 'from-pink-500 to-rose-600' : 'from-slate-500 to-slate-700';

export function DashboardView({
  patients, espOnline, onLogout, onOpenPatient, onDeletePatient, ask,
  form, setForm, formErrors, setFormErrors, onRegister, regError
}: DashboardViewProps) {
  
  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: '#060B18' }}>
      <Topbar label="Patient Overview" espOnline={espOnline} onLogout={onLogout} />

      {/* Hero Stats Row */}
      <div className="bg-[#0a1120] border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="flex items-center gap-5 glass-card rounded-2xl p-5 hover:border-indigo-500/30 transition-colors">
            <div className="w-14 h-14 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
              <Users className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">Total Patients</p>
              <p className="text-3xl font-bold text-white tracking-tight">{patients.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-5 glass-card rounded-2xl p-5 hover:border-emerald-500/30 transition-colors">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center border shadow-inner ${espOnline ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
              {espOnline ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <XCircle className="w-6 h-6 text-rose-400" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">Node Status</p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${espOnline ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-500'}`} />
                <p className="text-2xl font-bold text-white tracking-tight leading-tight">{espOnline ? 'Connected' : 'Offline'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-5 glass-card rounded-2xl p-5 hover:border-sky-500/30 transition-colors">
            <div className="w-14 h-14 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20 shadow-inner">
              <Activity className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">System Activity</p>
              <p className="text-2xl font-bold text-white tracking-tight leading-tight">Ready</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Patient Grid */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Active Patients
              </h2>
            </div>

            {patients.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 py-24 text-center glass-card">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-300 text-base font-medium">No patients currently enrolled</p>
                <p className="text-slate-500 text-sm mt-1">Use the form on the right to admit a patient.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {patients.map(p => (
                  <div key={p.mobile} className="relative rounded-3xl border transition-all group hover:border-indigo-500/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-900/20 overflow-hidden glass-card cursor-pointer"
                    onClick={() => onOpenPatient(p)}>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    <div className="p-6 relative z-10">
                      <div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGrad(p.gender)} flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0 shadow-lg`}>
                          {initials(p.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-lg group-hover:text-indigo-300 transition-colors truncate">{p.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">{calcAge(p.dob)}</span>
                            <span className="text-xs text-slate-500">{p.gender}</span>
                          </div>
                        </div>
                      </div>

                      {p.latest_reading ? (
                        <div className="grid grid-cols-3 gap-2 text-center mt-2">
                          <div className="bg-rose-500/5 rounded-xl py-2 px-1 border border-rose-500/10">
                            <p className="text-xs text-rose-300/70 mb-0.5 flex items-center justify-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"/>HR</p>
                            <p className="font-bold text-rose-400 text-base">{p.latest_reading.hr}</p>
                          </div>
                          <div className="bg-amber-500/5 rounded-xl py-2 px-1 border border-amber-500/10">
                            <p className="text-xs text-amber-300/70 mb-0.5 flex items-center justify-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"/>Temp</p>
                            <p className="font-bold text-amber-400 text-base">{p.latest_reading.temp}°</p>
                          </div>
                          <div className="bg-sky-500/5 rounded-xl py-2 px-1 border border-sky-500/10">
                            <p className="text-xs text-sky-300/70 mb-0.5 flex items-center justify-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-500"/>SpO₂</p>
                            <p className="font-bold text-sky-400 text-base">{p.latest_reading.spo2}%</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white/[0.02] rounded-xl py-3 text-center border border-dashed border-white/10 mt-2">
                          <p className="text-xs text-slate-500">Awaiting initial telemetry</p>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        ask({ 
                          title: `Delete ${p.name}?`, 
                          message: 'Permanently removes this patient and ALL reading history. Cannot be undone.', 
                          confirmLabel: 'Delete', 
                          onConfirm: () => onDeletePatient(p.mobile) 
                        });
                      }}
                      className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 w-9 h-9 rounded-xl flex items-center justify-center bg-[#0d1526] text-slate-400 hover:text-white border border-white/10 hover:bg-red-600 hover:border-red-500 transition-all shadow-lg"
                      title="Delete patient">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Registration Form Sidebar */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="rounded-3xl border overflow-hidden shadow-2xl glass-card">
              <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-r from-indigo-500/10 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-inner">
                    <UserPlus className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">Admit Patient</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Register new record</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <form onSubmit={onRegister} className="space-y-4.5" noValidate>
                  {regError && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl px-4 py-3 animate-in shake">{regError}</div>}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name *</label>
                    <input type="text" placeholder="John Doe" value={form.name}
                      onChange={e => { setForm((p: any) => ({ ...p, name: e.target.value })); setFormErrors((p: any) => ({ ...p, name: '' })); }}
                      className={`w-full bg-[#0a1120]/50 border ${formErrors.name ? 'border-red-500/60 ring-1 ring-red-500/20' : 'border-white/10'} focus:border-indigo-500 focus:bg-white/[0.02] rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none transition-all text-sm`} />
                    {formErrors.name && <p className="text-red-400 text-[11px] mt-1.5">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Mobile Number *</label>
                    <input type="tel" placeholder="9876543210" value={form.mobile} maxLength={10}
                      onChange={e => { setForm((p: any) => ({ ...p, mobile: e.target.value.replace(/\D/g, '') })); setFormErrors((p: any) => ({ ...p, mobile: '' })); }}
                      className={`w-full bg-[#0a1120]/50 border ${formErrors.mobile ? 'border-red-500/60 ring-1 ring-red-500/20' : 'border-white/10'} focus:border-indigo-500 focus:bg-white/[0.02] rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none transition-all text-sm`} />
                    {formErrors.mobile && <p className="text-red-400 text-[11px] mt-1.5">{formErrors.mobile}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Gender *</label>
                    <div className="relative">
                      <select value={form.gender} onChange={e => { setForm((p: any) => ({ ...p, gender: e.target.value })); setFormErrors((p: any) => ({ ...p, gender: '' })); }}
                        className={`w-full bg-[#0a1120]/50 border ${formErrors.gender ? 'border-red-500/60 ring-1 ring-red-500/20' : 'border-white/10'} focus:border-indigo-500 rounded-xl px-4 py-3 text-white outline-none transition-all text-sm appearance-none cursor-pointer`}>
                        <option value="" disabled>Select gender</option><option>Male</option><option>Female</option><option>Other</option>
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                    {formErrors.gender && <p className="text-red-400 text-[11px] mt-1.5">{formErrors.gender}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date of Birth</label>
                      <input type="date" value={form.dob} max={new Date().toISOString().split('T')[0]}
                        onChange={e => { setForm((p: any) => ({ ...p, dob: e.target.value })); setFormErrors((p: any) => ({ ...p, dob: '' })); }}
                        className={`w-full bg-[#0a1120]/50 border ${formErrors.dob ? 'border-red-500/60 ring-1 ring-red-500/20' : 'border-white/10'} focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-300 outline-none transition-all text-sm [color-scheme:dark]`} />
                      {formErrors.dob && <p className="text-red-400 text-[11px] mt-1.5">{formErrors.dob}</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        Blood Group <Droplet className="w-3 h-3 text-rose-500" />
                      </label>
                      <input type="text" placeholder="O+" list="blood-list" value={form.blood_group}
                        onChange={e => { setForm((p: any) => ({ ...p, blood_group: e.target.value })); setFormErrors((p: any) => ({ ...p, blood_group: '' })); }}
                        className={`w-full bg-[#0a1120]/50 border ${formErrors.blood_group ? 'border-red-500/60 ring-1 ring-red-500/20' : 'border-white/10'} focus:border-indigo-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none transition-all text-sm`} />
                      <datalist id="blood-list">{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g} value={g} />)}</datalist>
                      {formErrors.blood_group && <p className="text-red-400 text-[11px] mt-1.5">{formErrors.blood_group}</p>}
                    </div>
                  </div>

                  <button type="submit" className="w-full py-3.5 rounded-xl font-bold text-sm text-white hover:opacity-90 active:scale-[0.98] transition-all mt-4 shadow-lg shadow-indigo-500/25 leading-none bg-gradient-to-r from-indigo-500 to-indigo-600">
                    Register Patient
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
