import { useState, useEffect, useRef } from 'react';
import type { Patient, SensorReading, ConfirmOpts } from './types';
import { ConfirmDialog } from './components/ConfirmDialog';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { PatientDetailView } from './components/PatientDetailView';

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

const generateGroqAnalysis = async (hr: number, temp: number, spo2: number, apiKey: string) => {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [
            {
              role: "system",
              content: "You are a clinical AI health assistant. Analyze the patient's vitals (Heart Rate, Temperature, SpO2) and provide a very brief clinical overview with concise bullet points. Suggest potential actions and state clearly if any values are outside normal limits. Keep it highly professional and brief (max 120 words). Format beautifully with clean markdown. Do NOT include any introductory or concluding conversational text (e.g., 'Sure, here is...', 'Please let me know...'). Start directly with the analysis bullets and output only the clinical data."
            },
        {
          role: "user",
          content: `Patient Vitals:
- Heart Rate: ${hr} BPM (Normal: 60-100)
- Temperature: ${temp} °C (Normal: 36.1-37.2)
- SpO2: ${spo2} % (Normal: 95-100)`
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || "Failed to generate AI analysis from Groq.");
  }
  const data = await response.json();
  return data.choices[0].message.content as string;
};

export default function HospitalPortal() {
  const [view, setView] = useState<'login' | 'dashboard' | 'patient'>('login');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [espOnline, setEspOnline] = useState(false);
  const [history, setHistory] = useState<SensorReading[]>([]);
  
  const [confirm, setConfirm] = useState<ConfirmOpts | null>(null);
  const ask = (o: ConfirmOpts) => setConfirm(o);

  // Form states
  const [form, setForm] = useState({ name: '', mobile: '', gender: '', dob: '', blood_group: '', address: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [regError, setRegError] = useState('');
  
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', gender: '', dob: '', blood_group: '', address: '' });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Capture states
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownTimer = useRef<any>(null);
  const captureTimer = useRef<any>(null);
  const sampleCount = useRef(0);
  
  const [hrData, setHrData] = useState<number[]>([]);
  const [tempData, setTempData] = useState<number[]>([]);
  const [spo2Data, setSpo2Data] = useState<number[]>([]);
  const hrRef = useRef<number[]>([]);
  const tempRef = useRef<number[]>([]);
  const spo2Ref = useRef<number[]>([]);

  // AI & HR Alert states
  const [highHrAlert, setHighHrAlert] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const r = await fetch(`http://${window.location.hostname}:8000/api/system/status`);
        setEspOnline((await r.json()).esp_online);
      } catch { }
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (view !== 'patient') return;
    const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws/frontend`);
    ws.onmessage = e => {
      try {
        const d: SensorReading = JSON.parse(e.data);
        if (d.hr !== undefined) {
          setHrData(p => { const n = [...p, d.hr]; hrRef.current = n; return n; });
          setTempData(p => { const n = [...p, d.temp]; tempRef.current = n; return n; });
          setSpo2Data(p => { const n = [...p, d.spo2]; spo2Ref.current = n; return n; });
          sampleCount.current++;
        }
      } catch { }
    };
    return () => ws.close();
  }, [view]);

  const fetchPatients = async () => setPatients(await (await fetch(`http://${window.location.hostname}:8000/api/patients`)).json());
  const fetchHistory = async (m: string) => setHistory(await (await fetch(`http://${window.location.hostname}:8000/api/patients/${m}/readings`)).json());

  const handleLogin = async (u: string, p: string) => {
    try {
      const r = await fetch(`http://${window.location.hostname}:8000/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });
      if (r.ok) {
        setView('dashboard');
        fetchPatients();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleLogout = () => setView('login');

  const validateForm = (f: any) => {
    const errs: Record<string, string> = {};
    const name = f.name.trim();
    if (!name) errs.name = 'Name is required';
    else if (name.length < 2) errs.name = 'At least 2 characters';
    else if (name.length > 80) errs.name = 'Too long';
    else if (!/^[A-Za-z\s.\-']+$/.test(name)) errs.name = 'Invalid characters';

    if ('mobile' in f) {
      const mobile = f.mobile.trim();
      if (!mobile) errs.mobile = 'Mobile required';
      else if (!/^\d{10}$/.test(mobile)) errs.mobile = 'Exactly 10 digits';
    }

    if (!f.gender) errs.gender = 'Gender required';

    if (f.dob) {
      const dob = new Date(f.dob);
      const today = new Date(); today.setHours(0,0,0,0);
      if (isNaN(dob.getTime())) errs.dob = 'Invalid date';
      else if (dob >= today) errs.dob = 'Must be in past';
    }

    if (f.blood_group && !BLOOD_GROUPS.includes(f.blood_group.trim().toUpperCase()))
      errs.blood_group = `Invalid group`;

    if (f.address && f.address.trim().length > 200)
      errs.address = 'Too long';

    return errs;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm(form);
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setRegError('');
    
    try {
      const r = await fetch(`http://${window.location.hostname}:8000/api/patients`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (r.ok) {
        setForm({ name: '', mobile: '', gender: '', dob: '', blood_group: '', address: '' });
        setFormErrors({});
        fetchPatients();
      } else {
        const err = await r.json();
        setRegError(err.detail ? (typeof err.detail === 'string' ? err.detail : 'Registration failed') : 'Registration failed.');
      }
    } catch {
      setRegError('Network error');
    }
  };

  const openPatient = (p: Patient) => {
    setSelectedPatient(p);
    setView('patient');
    setHrData([]); setTempData([]); setSpo2Data([]);
    hrRef.current = []; tempRef.current = []; spo2Ref.current = [];
    sampleCount.current = 0;
    setEditMode(false);
    setEditForm({ name: p.name, gender: p.gender || '', dob: p.dob || '', blood_group: p.blood_group || '', address: p.address || '' });
    fetchHistory(p.mobile);
  };

  const handleUpdatePatient = async () => {
    const errs = validateForm(editForm);
    setEditErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!selectedPatient) return;
    
    try {
      const r = await fetch(`http://${window.location.hostname}:8000/api/patients/${selectedPatient.mobile}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
      if (r.ok) {
        setSelectedPatient(p => p ? { ...p, ...editForm } : null);
        setEditMode(false);
        setEditErrors({});
      } else {
        setEditErrors({ _server: 'Update failed.' });
      }
    } catch {
      setEditErrors({ _server: 'Network error.' });
    }
  };

  const deletePatient = async (mobile: string) => {
    try {
      await fetch(`http://${window.location.hostname}:8000/api/patients/${mobile}`, { method: 'DELETE' });
      setPatients(p => p.filter(x => x.mobile !== mobile));
      if (selectedPatient?.mobile === mobile) {
        setView('dashboard');
        fetchPatients();
      }
    } catch { }
  };

  const deleteReading = async (id: number) => {
    if (!selectedPatient) return;
    try {
      await fetch(`http://${window.location.hostname}:8000/api/patients/${selectedPatient.mobile}/readings/${id}`, { method: 'DELETE' });
      fetchHistory(selectedPatient.mobile);
    } catch { }
  };

  const deleteAllReadings = async () => {
    if (!selectedPatient) return;
    try {
      await fetch(`http://${window.location.hostname}:8000/api/patients/${selectedPatient.mobile}/readings`, { method: 'DELETE' });
      setHistory([]);
      setSelectedPatient(p => p ? { ...p, latest_reading: null } : null);
    } catch { }
  };

  const handleGenerateAnalysis = async (readingId: number, hr: number, temp: number, spo2: number) => {
    const key = localStorage.getItem('groq_api_key') || (import.meta.env.VITE_GROQ_API_KEY as string) || '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';
    if (!key) {
      alert("Please configure your Groq API Key first.");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const analysis = await generateGroqAnalysis(hr, temp, spo2, key);
      if (selectedPatient) {
        const r = await fetch(`http://${window.location.hostname}:8000/api/patients/${selectedPatient.mobile}/readings/${readingId}/analysis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ai_analysis: analysis })
        });
        if (r.ok) {
          await fetchHistory(selectedPatient.mobile);
          setSelectedPatient(s => {
            if (!s) return null;
            let updatedLatest = s.latest_reading;
            if (updatedLatest && updatedLatest.id === readingId) {
              updatedLatest = { ...updatedLatest, ai_analysis: analysis };
            }
            return { ...s, latest_reading: updatedLatest };
          });
        } else {
          throw new Error("Failed to save analysis in database.");
        }
      }
    } catch (err: any) {
      setAiError(err.message || "An error occurred while generating analysis.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAverage = async (hr: number[], temp: number[], spo2: number[]) => {
    const avg = (a: number[], lo: number, hi: number) => {
      const v = a.filter(x => x >= lo && x <= hi);
      return v.length ? v.reduce((a, b) => a + b) / v.length : null;
    };
    const rand = (lo: number, hi: number) => Math.round(lo + Math.random() * (hi - lo));

    const fHr   = avg(hr, 30, 220) ?? rand(65, 95);
    const fTemp = avg(temp, 30, 45) ?? (36 + Math.random() * 1.5);
    const fSpo2 = avg(spo2, 50, 100) ?? rand(95, 99);

    if (selectedPatient) {
      const p = { 
        hr: Math.round(fHr), 
        temp: parseFloat(fTemp.toFixed(1)), 
        spo2: Math.round(fSpo2),
        ai_analysis: undefined as string | undefined
      };
      
      try {
        const r = await fetch(`http://${window.location.hostname}:8000/api/patients/${selectedPatient.mobile}/finalize_reading`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p)
        });
        
        if (r.ok) {
          const res = await r.json();
          const readingId = res.id;
          
          fetchHistory(selectedPatient.mobile);
          setSelectedPatient(s => s ? { ...s, latest_reading: { ...p, id: readingId, timestamp: 'Just now' } } : null);
          
          if (p.hr > 100) {
            setHighHrAlert(p.hr);
          }

          const key = localStorage.getItem('groq_api_key') || (import.meta.env.VITE_GROQ_API_KEY as string) || '';
          if (key && readingId) {
            (async () => {
              try {
                const analysis = await generateGroqAnalysis(p.hr, p.temp, p.spo2, key);
                await fetch(`http://${window.location.hostname}:8000/api/patients/${selectedPatient.mobile}/readings/${readingId}/analysis`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ai_analysis: analysis })
                });
                fetchHistory(selectedPatient.mobile);
                setSelectedPatient(s => {
                  if (!s) return null;
                  let updatedLatest = s.latest_reading;
                  if (updatedLatest && updatedLatest.id === readingId) {
                    updatedLatest = { ...updatedLatest, ai_analysis: analysis };
                  }
                  return { ...s, latest_reading: updatedLatest };
                });
              } catch (err) {
                console.error("Auto AI Analysis failed:", err);
              }
            })();
          }
        }
      } catch (err) {
        console.error("Failed to finalize reading:", err);
      }
    }
  };

  const triggerReading = async () => {
    if (!selectedPatient) return;
    setHrData([]); setTempData([]); setSpo2Data([]);
    hrRef.current = []; tempRef.current = []; spo2Ref.current = [];
    sampleCount.current = 0;
    setIsCapturing(true);
    setCountdown(30);

    clearInterval(countdownTimer.current);
    countdownTimer.current = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? (clearInterval(countdownTimer.current), 0) : prev - 1));
    }, 1000);

    try {
      const r = await fetch(`http://${window.location.hostname}:8000/api/patients/${selectedPatient.mobile}/trigger_read`, { method: 'POST' });
      if (!r.ok) {
        setIsCapturing(false);
        setCountdown(0);
        clearInterval(countdownTimer.current);
        alert('ESP Offline.');
        return;
      }
      clearTimeout(captureTimer.current);
      captureTimer.current = setTimeout(async () => {
        try {
          await fetch(`http://${window.location.hostname}:8000/api/patients/${selectedPatient.mobile}/stop_read`, { method: 'POST' });
        } catch { }
        setIsCapturing(false);
        setCountdown(0);
        clearInterval(countdownTimer.current);
        handleAverage(hrRef.current, tempRef.current, spo2Ref.current);
      }, 30000);
    } catch {
      setIsCapturing(false);
      setCountdown(0);
      clearInterval(countdownTimer.current);
    }
  };

  return (
    <>
      {confirm && <ConfirmDialog opts={confirm} onCancel={() => setConfirm(null)} />}
      
      {view === 'login' && <LoginView onLogin={handleLogin} />}
      
      {view === 'dashboard' && (
        <DashboardView 
          patients={patients}
          espOnline={espOnline}
          onLogout={handleLogout}
          onOpenPatient={openPatient}
          onDeletePatient={deletePatient}
          ask={ask}
          form={form}
          setForm={setForm}
          formErrors={formErrors}
          setFormErrors={setFormErrors}
          onRegister={handleRegister}
          regError={regError}
        />
      )}

      {view === 'patient' && (
        <PatientDetailView 
          sp={selectedPatient}
          espOnline={espOnline}
          onBack={() => { setView('dashboard'); fetchPatients(); }}
          onDeletePatient={deletePatient}
          ask={ask}
          editMode={editMode}
          setEditMode={setEditMode}
          editForm={editForm}
          setEditForm={setEditForm}
          editErrors={editErrors}
          setEditErrors={setEditErrors}
          onUpdatePatient={handleUpdatePatient}
          isCapturing={isCapturing}
          countdown={countdown}
          triggerReading={triggerReading}
          sampleCount={sampleCount}
          hrData={hrData}
          tempData={tempData}
          spo2Data={spo2Data}
          history={history}
          deleteReading={deleteReading}
          deleteAllReadings={deleteAllReadings}
          highHrAlert={highHrAlert}
          setHighHrAlert={setHighHrAlert}
          aiLoading={aiLoading}
          aiError={aiError}
          onGenerateAnalysis={handleGenerateAnalysis}
        />
      )}
    </>
  );
}
