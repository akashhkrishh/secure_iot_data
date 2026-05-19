import { useState, useEffect } from 'react';
import type { Patient, SensorReading } from '../types';
import { Topbar } from './Topbar';
import { LiveGraph } from './LiveGraph';
import { 
  Trash2, Edit2, History, Activity, Calendar, Droplet, Check,
  Phone, Mail, Award, MapPin, AlertCircle, X, Brain, Key, Sparkles, RefreshCw, Download, Printer
} from 'lucide-react';

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

  highHrAlert: number | null;
  setHighHrAlert: (v: number | null) => void;
  aiLoading: boolean;
  aiError: string | null;
  onGenerateAnalysis: (readingId: number, hr: number, temp: number, spo2: number) => Promise<void>;
}

const calcAge = (dob?: string | null) => {
  if (!dob) return '—';
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) + ' yrs';
};

const initials = (n: string) => n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
const avatarGrad = (g?: string) => g === 'Male' ? 'from-blue-500 to-indigo-600' : g === 'Female' ? 'from-pink-500 to-rose-600' : 'from-slate-500 to-slate-700';

const hrStatus = (hr: number) => hr < 60 ? { l: 'Low HR', c: 'text-amber-400 bg-amber-400/10 border-amber-500/30' } : hr > 100 ? { l: 'High HR', c: 'text-red-400 bg-red-400/10 border-red-500/30' } : { l: 'Normal', c: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30' };
const spo2Status = (s: number) => s < 95 ? { l: 'Low', c: 'text-amber-400 bg-amber-400/10 border-amber-500/30' } : { l: 'Normal', c: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30' };

function DoctorContactModal({ hr, onClose }: { hr: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg rounded-3xl border border-red-500/25 p-8 shadow-2xl bg-[#090f1d] overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-red-500/10 blur-[80px] pointer-events-none" />
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all border border-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-5 mb-6 items-start">
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0 animate-pulse">
            <AlertCircle className="w-8 h-8 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-full uppercase tracking-wider border border-red-500/25">Urgent Health Warning</span>
            <h3 className="font-extrabold text-white text-2xl mt-2 tracking-tight">Critical Heart Rate!</h3>
            <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
              The patient's heart rate was measured at <span className="text-red-400 font-extrabold">{hr} BPM</span>, which is significantly above the normal limits (&lt; 100 BPM).
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 mb-8 flex flex-col md:flex-row gap-5 items-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg ring-4 ring-indigo-500/20">
            AV
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-1.5">
              <h4 className="font-bold text-white text-lg">Dr. Alexander Vance</h4>
              <Award className="w-4.5 h-4.5 text-indigo-400" />
            </div>
            <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wider mt-0.5">Chief of Cardiology</p>
            <p className="text-slate-400 text-xs font-medium mt-1 flex items-center justify-center md:justify-start gap-1">
              <MapPin className="w-3.5 h-3.5 opacity-60" /> St. Jude Cardiac Care Unit, Suite 402
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Patient Vitals</span>
            <span className="block text-2xl font-extrabold text-red-400 mt-1">{hr} BPM</span>
          </div>
          <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Normal Threshold</span>
            <span className="block text-2xl font-extrabold text-emerald-400 mt-1">&lt; 100 BPM</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => { window.location.href = "tel:+15554929302"; }}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 transition-all shadow-lg shadow-red-600/30 active:scale-[0.98]"
          >
            <Phone className="w-4 h-4 fill-current" /> Call Doctor Now
          </button>
          <button 
            onClick={() => { window.location.href = "mailto:a.vance@stjudemedical.org?subject=Urgent: Patient High Heart Rate Alert"; }}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-all border border-white/5 active:scale-[0.98]"
          >
            <Mail className="w-4 h-4" /> Send Email Alert
          </button>
        </div>
      </div>
    </div>
  );
}

const formatMarkdown = (text: string) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  
  const parseInlineStyles = (txt: string): string => {
    let html = txt
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-400 font-extrabold">$1</strong>');
    
    // Italics: *text* or _text_
    html = html.replace(/\*(.*?)\*/g, '<em class="text-slate-200 italic">$1</em>');
    html = html.replace(/_(.*?)_/g, '<em class="text-slate-200 italic">$1</em>');
    
    // Inline code: `text`
    html = html.replace(/`(.*?)`/g, '<code class="bg-black/30 border border-white/10 px-1.5 py-0.5 rounded font-mono text-xs text-indigo-300">$1</code>');
    
    return html;
  };

  const flushList = (key: number) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} className="space-y-1.5 my-3 list-disc pl-5">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList(idx);
      return;
    }

    if (trimmed === '---' || trimmed === '***') {
      flushList(idx);
      elements.push(<hr key={`hr-${idx}`} className="border-t border-white/5 my-4" />);
      return;
    }

    if (trimmed.startsWith('#')) {
      flushList(idx);
      const match = trimmed.match(/^(#+)\s*(.*)$/);
      if (match) {
        const level = match[1].length;
        const rawContent = match[2];
        const parsedHtml = parseInlineStyles(rawContent);
        
        if (level === 1) {
          elements.push(
            <h1 key={`h1-${idx}`} className="text-xl font-extrabold text-white mt-5 mb-3 flex items-center gap-2 border-b border-white/5 pb-1"
                dangerouslySetInnerHTML={{ __html: parsedHtml }} />
          );
        } else if (level === 2) {
          elements.push(
            <h2 key={`h2-${idx}`} className="text-lg font-bold text-white mt-4 mb-2"
                dangerouslySetInnerHTML={{ __html: parsedHtml }} />
          );
        } else {
          elements.push(
            <h3 key={`h3-${idx}`} className="text-sm font-bold text-indigo-300 mt-3 mb-1.5"
                dangerouslySetInnerHTML={{ __html: parsedHtml }} />
          );
        }
        return;
      }
    }

    if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      const rawContent = trimmed.replace(/^[-*]\s*/, '');
      const parsedHtml = parseInlineStyles(rawContent);
      listItems.push(
        <li key={`li-${idx}`} className="text-slate-300 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: parsedHtml }} />
      );
      return;
    }

    const numMatch = trimmed.match(/^(\d+)\.\s*(.*)$/);
    if (numMatch) {
      flushList(idx);
      const parsedHtml = parseInlineStyles(numMatch[2]);
      elements.push(
        <div key={`ol-${idx}`} className="flex gap-2.5 text-slate-300 text-sm leading-relaxed my-1.5 pl-2">
          <span className="text-indigo-400 font-extrabold font-mono">{numMatch[1]}.</span>
          <span dangerouslySetInnerHTML={{ __html: parsedHtml }} />
        </div>
      );
      return;
    }

    flushList(idx);
    const parsedHtml = parseInlineStyles(trimmed);
    elements.push(
      <p key={`p-${idx}`} className="text-slate-300 text-sm leading-relaxed mb-3"
         dangerouslySetInnerHTML={{ __html: parsedHtml }} />
    );
  });

  flushList(lines.length);
  return elements;
};

const convertMarkdownToHtmlString = (text: string) => {
  if (!text) return '';
  const lines = text.split('\n');
  let html = '';
  let insideList = false;

  const parseInline = (txt: string): string => {
    let t = txt
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    t = t.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #4f46e5; font-weight: 700;">$1</strong>');
    t = t.replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: #475569;">$1</em>');
    t = t.replace(/_(.*?)_/g, '<em style="font-style: italic; color: #475569;">$1</em>');
    t = t.replace(/`(.*?)`/g, '<code style="background-color: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #0f172a;">$1</code>');
    return t;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (insideList) {
        html += '</ul>';
        insideList = false;
      }
      return;
    }

    if (trimmed === '---' || trimmed === '***') {
      if (insideList) { html += '</ul>'; insideList = false; }
      html += '<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />';
      return;
    }

    if (trimmed.startsWith('#')) {
      if (insideList) { html += '</ul>'; insideList = false; }
      const match = trimmed.match(/^(#+)\s*(.*)$/);
      if (match) {
        const level = match[1].length;
        const parsed = parseInline(match[2]);
        if (level === 1) {
          html += `<h1 style="font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">${parsed}</h1>`;
        } else if (level === 2) {
          html += `<h2 style="font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 700; color: #1e1b4b; margin-top: 20px; margin-bottom: 10px;">${parsed}</h2>`;
        } else {
          html += `<h3 style="font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 700; color: #4f46e5; margin-top: 16px; margin-bottom: 8px;">${parsed}</h3>`;
        }
      }
      return;
    }

    if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      if (!insideList) {
        html += '<ul style="margin: 0 0 16px 0; padding-left: 20px; list-style-type: disc;">';
        insideList = true;
      }
      const parsed = parseInline(trimmed.replace(/^[-*]\s*/, ''));
      html += `<li style="font-size: 14px; color: #334155; margin-bottom: 6px; line-height: 1.6;">${parsed}</li>`;
      return;
    }

    const numMatch = trimmed.match(/^(\d+)\.\s*(.*)$/);
    if (numMatch) {
      if (insideList) { html += '</ul>'; insideList = false; }
      const parsed = parseInline(numMatch[2]);
      html += `<div style="display: flex; gap: 8px; font-size: 14px; color: #334155; margin: 8px 0; padding-left: 8px;">
        <span style="color: #4f46e5; font-weight: 700; font-family: monospace;">${numMatch[1]}.</span>
        <span style="line-height: 1.6;">${parsed}</span>
      </div>`;
      return;
    }

    if (insideList) { html += '</ul>'; insideList = false; }
    const parsed = parseInline(trimmed);
    html += `<p style="font-size: 14px; color: #334155; margin: 0 0 12px 0; line-height: 1.6;">${parsed}</p>`;
  });

  if (insideList) {
    html += '</ul>';
  }
  return html;
};

function AiAnalysisModal({ 
  spName, 
  patientInfo,
  reportType,
  reading,
  history,
  analysisText,
  onClose
}: { 
  spName: string;
  patientInfo: { gender?: string; dob?: string; blood_group?: string; mobile: string };
  reportType: 'single' | 'history';
  reading?: SensorReading | null;
  history?: SensorReading[];
  analysisText: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (analysisText) {
      navigator.clipboard.writeText(analysisText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadMarkdown = () => {
    if (analysisText) {
      const element = document.createElement("a");
      const file = new Blob([analysisText], { type: 'text/markdown;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      const safeName = spName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = reportType === 'single' 
        ? `clinical_report_${safeName}_reading_${reading?.id || 'na'}.md`
        : `longitudinal_health_report_${safeName}.md`;
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  let avgHr = 0, minHr = 999, maxHr = 0;
  let avgTemp = 0, minTemp = 999, maxTemp = 0;
  let avgSpo2 = 0, minSpo2 = 999, maxSpo2 = 0;

  if (reportType === 'history' && history && history.length > 0) {
    const hrs = history.map(h => h.hr);
    const temps = history.map(h => h.temp);
    const spo2s = history.map(h => h.spo2);
    
    avgHr = Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length);
    minHr = Math.min(...hrs);
    maxHr = Math.max(...hrs);

    avgTemp = parseFloat((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1));
    minTemp = Math.min(...temps);
    maxTemp = Math.max(...temps);

    avgSpo2 = Math.round(spo2s.reduce((a, b) => a + b, 0) / spo2s.length);
    minSpo2 = Math.min(...spo2s);
    maxSpo2 = Math.max(...spo2s);
  }

  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = convertMarkdownToHtmlString(analysisText);
    const patientAgeStr = calcAge(patientInfo.dob);
    
    let vitalsHtml = '';
    if (reportType === 'single' && reading) {
      vitalsHtml = `
        <div class="vitals-grid">
          <div class="vital-card">
            <div class="vital-label">Heart Rate</div>
            <div class="vital-val">${reading.hr} <span style="font-size: 11px; font-weight: 500; color: #64748b;">BPM</span></div>
          </div>
          <div class="vital-card" style="border-inline: 1px solid #e2e8f0;">
            <div class="vital-label">Temperature</div>
            <div class="vital-val">${reading.temp.toFixed(1)} <span style="font-size: 11px; font-weight: 500; color: #64748b;">°C</span></div>
          </div>
          <div class="vital-card">
            <div class="vital-label">SpO2 Level</div>
            <div class="vital-val">${reading.spo2} <span style="font-size: 11px; font-weight: 500; color: #64748b;">%</span></div>
          </div>
        </div>
      `;
    } else if (reportType === 'history') {
      vitalsHtml = `
        <div class="vitals-grid">
          <div class="vital-card">
            <div class="vital-label">Avg Heart Rate</div>
            <div class="vital-val">${avgHr} <span style="font-size: 11px; font-weight: 500; color: #64748b;">BPM</span></div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Min-Max: ${minHr}-${maxHr} BPM</div>
          </div>
          <div class="vital-card" style="border-inline: 1px solid #e2e8f0;">
            <div class="vital-label">Avg Temperature</div>
            <div class="vital-val">${avgTemp.toFixed(1)} <span style="font-size: 11px; font-weight: 500; color: #64748b;">°C</span></div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Min-Max: ${minTemp.toFixed(1)}-${maxTemp.toFixed(1)}°C</div>
          </div>
          <div class="vital-card">
            <div class="vital-label">Avg SpO2 Level</div>
            <div class="vital-val">${avgSpo2} <span style="font-size: 11px; font-weight: 500; color: #64748b;">%</span></div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Min-Max: ${minSpo2}-${maxSpo2}%</div>
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Clinical Report - ${spName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap');
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              background-color: #ffffff;
              margin: 0;
              padding: 0;
              line-height: 1.6;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #4f46e5;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .hospital-info h1 {
              font-family: 'Outfit', sans-serif;
              font-size: 24px;
              font-weight: 800;
              color: #0f172a;
              margin: 0;
              letter-spacing: -0.02em;
            }
            .hospital-info p {
              font-size: 11px;
              color: #64748b;
              margin: 2px 0 0 0;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .report-tag {
              background-color: #f0fdf4;
              color: #16a34a;
              border: 1px solid #bbf7d0;
              font-size: 10px;
              font-weight: 700;
              padding: 4px 10px;
              border-radius: 9999px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .patient-card {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 24px;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }
            .patient-field {
              font-size: 12px;
            }
            .patient-label {
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              font-size: 10px;
              letter-spacing: 0.03em;
              margin-bottom: 2px;
            }
            .patient-value {
              color: #1e293b;
              font-weight: 600;
            }
            .vitals-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 16px;
              border-radius: 12px;
              margin-bottom: 24px;
            }
            .vital-card {
              text-align: center;
            }
            .vital-label {
              font-size: 10px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .vital-val {
              font-size: 20px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 4px;
            }
            .content-section {
              font-size: 13px;
              color: #334155;
              line-height: 1.6;
            }
            .content-section h1 {
              font-family: 'Outfit', sans-serif;
              font-size: 16px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 24px;
              margin-bottom: 12px;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 6px;
              text-transform: uppercase;
              letter-spacing: 0.02em;
            }
            .content-section h2 {
              font-family: 'Outfit', sans-serif;
              font-size: 14px;
              font-weight: 700;
              color: #1e1b4b;
              margin-top: 18px;
              margin-bottom: 8px;
            }
            .content-section h3 {
              font-family: 'Outfit', sans-serif;
              font-size: 12.5px;
              font-weight: 700;
              color: #4f46e5;
              margin-top: 14px;
              margin-bottom: 6px;
            }
            .content-section p {
              margin: 0 0 12px 0;
              color: #334155;
              text-align: justify;
            }
            .content-section ul, .content-section ol {
              margin: 0 0 16px 0;
              padding-left: 20px;
            }
            .content-section li {
              margin-bottom: 6px;
              color: #334155;
            }
            .footer {
              margin-top: 40px;
              border-top: 1px solid #e2e8f0;
              padding-top: 16px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 11px;
              color: #94a3b8;
            }
            .signature-box {
              text-align: right;
            }
            .signature-line {
              width: 150px;
              border-top: 1px solid #cbd5e1;
              margin-top: 30px;
              margin-bottom: 4px;
            }
          </style>
        </head>
        <body>
          <header>
            <div class="hospital-info">
              <h1>${reportType === 'single' ? 'AI Clinical Vitals Report' : 'AI Longitudinal Health Report'}</h1>
              <p>Smart IoT Medical Portal · Secure Diagnostics</p>
            </div>
            <span class="report-tag">AI Verified</span>
          </header>

          <div class="patient-card">
            <div class="patient-field">
              <div class="patient-label">Patient Name</div>
              <div class="patient-value">${spName}</div>
            </div>
            <div class="patient-field">
              <div class="patient-label">Mobile Number</div>
              <div class="patient-value">${patientInfo.mobile}</div>
            </div>
            <div class="patient-field">
              <div class="patient-label">Age / DOB</div>
              <div class="patient-value">${patientAgeStr} (${patientInfo.dob || 'N/A'})</div>
            </div>
            <div class="patient-field">
              <div class="patient-label">Blood Group / Gender</div>
              <div class="patient-value">${patientInfo.blood_group || '—'} / ${patientInfo.gender || '—'}</div>
            </div>
          </div>

          ${vitalsHtml}

          <div class="content-section">
            ${htmlContent}
          </div>

          <div class="footer">
            <div>
              <p>Generated automatically on ${new Date().toLocaleString()}</p>
              <p>This report is powered by Groq AI and should be reviewed by a certified medical doctor.</p>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <p>Attending Clinician</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl rounded-3xl border border-indigo-500/20 p-8 shadow-2xl bg-[#090f1d] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all border border-white/5 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-4 mb-6 items-start">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Brain className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-500/25">
              {reportType === 'single' ? 'Clinical Telemetry Report' : 'Longitudinal Health Report'}
            </span>
            <h3 className="font-extrabold text-white text-2xl mt-1 tracking-tight">
              {reportType === 'single' ? 'AI Diagnostic Summary' : 'AI Trend Analysis'}
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Patient: <span className="text-slate-200 font-bold">{spName}</span> {reportType === 'single' && reading && `· Reading #${reading.id || 'N/A'}`}
            </p>
          </div>
        </div>

        {reportType === 'single' && reading ? (
          <div className="grid grid-cols-3 gap-4 mb-6 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
            <div className="text-center py-1">
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Heart Rate</span>
              <span className="block text-lg font-extrabold text-rose-400 mt-0.5">{reading.hr} <span className="text-[10px] font-medium text-slate-500">BPM</span></span>
            </div>
            <div className="text-center py-1 border-x border-white/5">
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Temperature</span>
              <span className="block text-lg font-extrabold text-amber-400 mt-0.5">{reading.temp.toFixed(1)} <span className="text-[10px] font-medium text-slate-500">°C</span></span>
            </div>
            <div className="text-center py-1">
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">SpO2 Level</span>
              <span className="block text-lg font-extrabold text-sky-400 mt-0.5">{reading.spo2} <span className="text-[10px] font-medium text-slate-500">%</span></span>
            </div>
          </div>
        ) : reportType === 'history' ? (
          <div className="grid grid-cols-3 gap-4 mb-6 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
            <div className="text-center py-1">
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Heart Rate (Avg)</span>
              <span className="block text-lg font-extrabold text-rose-400 mt-0.5">{avgHr} <span className="text-[10px] font-medium text-slate-500">BPM</span></span>
              <span className="block text-[9px] text-slate-400 font-semibold mt-0.5">Range: {minHr}-{maxHr}</span>
            </div>
            <div className="text-center py-1 border-x border-white/5">
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Temperature (Avg)</span>
              <span className="block text-lg font-extrabold text-amber-400 mt-0.5">{avgTemp.toFixed(1)} <span className="text-[10px] font-medium text-slate-500">°C</span></span>
              <span className="block text-[9px] text-slate-400 font-semibold mt-0.5">Range: {minTemp.toFixed(1)}-{maxTemp.toFixed(1)}</span>
            </div>
            <div className="text-center py-1">
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">SpO2 Level (Avg)</span>
              <span className="block text-lg font-extrabold text-sky-400 mt-0.5">{avgSpo2} <span className="text-[10px] font-medium text-slate-500">%</span></span>
              <span className="block text-[9px] text-slate-400 font-semibold mt-0.5">Range: {minSpo2}-{maxSpo2}</span>
            </div>
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent bg-black/25 border border-white/5 p-6 rounded-2xl mb-6">
          <div className="prose prose-invert max-w-none">
            {formatMarkdown(analysisText || '')}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-auto">
          <button 
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-all border border-white/5 active:scale-[0.98] cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                Copied Text
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Copy Report
              </>
            )}
          </button>

          <button 
            onClick={handleDownloadMarkdown}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-all border border-white/5 active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            Markdown
          </button>

          <button 
            onClick={handlePrintPdf}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-all border border-white/5 active:scale-[0.98] cursor-pointer"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            Download PDF
          </button>
          
          <button 
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-lg shadow-indigo-600/30 active:scale-[0.98] cursor-pointer"
          >
            Dismiss Report
          </button>
        </div>
      </div>
    </div>
  );
}

export function PatientDetailView({
  sp, espOnline, onBack, onDeletePatient, ask,
  editMode, setEditMode, editForm, setEditForm, editErrors, setEditErrors, onUpdatePatient,
  isCapturing, countdown, triggerReading, sampleCount,
  hrData, tempData, spo2Data,
  history, deleteReading, deleteAllReadings,
  highHrAlert, setHighHrAlert, aiLoading, aiError, onGenerateAnalysis
}: PatientDetailViewProps) {
  if (!sp) return null;

  const [activeReading, setActiveReading] = useState<SensorReading | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(!!localStorage.getItem('groq_api_key'));
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [wasLoading, setWasLoading] = useState(false);

  const [historyAnalysisText, setHistoryAnalysisText] = useState<string | null>(null);
  const [historyAnalysisLoading, setHistoryAnalysisLoading] = useState(false);
  const [historyAnalysisError, setHistoryAnalysisError] = useState<string | null>(null);
  const [activeAiTab, setActiveAiTab] = useState<'single' | 'history'>('single');
  const [reportModalType, setReportModalType] = useState<'single' | 'history'>('single');

  useEffect(() => {
    if (sp) {
      setHistoryAnalysisText(localStorage.getItem(`history_analysis_${sp.mobile}`));
      setHistoryAnalysisError(null);
      setHistoryAnalysisLoading(false);
      setActiveAiTab('single');
    }
  }, [sp]);

  const handleGenerateHistoryAnalysis = async () => {
    if (!sp || history.length < 2) return;
    
    const key = localStorage.getItem('groq_api_key') || (import.meta.env.VITE_GROQ_API_KEY as string) || '';
    if (!key) {
      alert("Please configure your Groq API Key first.");
      return;
    }
    
    setHistoryAnalysisLoading(true);
    setHistoryAnalysisError(null);
    
    try {
      const readingsFormatted = history
        .slice()
        .reverse()
        .map((r, i) => `Reading #${i + 1} (${r.timestamp || 'N/A'}): Heart Rate: ${r.hr} BPM, Temp: ${r.temp}°C, SpO2: ${r.spo2}%`)
        .join('\n');
        
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: "You are a senior clinical AI health assistant. Analyze the patient's historical vitals trend and provide a highly professional longitudinal health report. Identify overall trends (improving/stable/deteriorating), highlight any consistent anomalies, and offer tailored preventative health actions. Structure strictly with professional headings: '1. Executive Vitals Summary', '2. Longitudinal Trend Analysis', '3. Key Observations & Anomalies', '4. Recommended Clinical Actions'. Keep the clinical terminology advanced yet clear (max 220 words). Format beautifully with clean markdown. Do NOT include any introductory or concluding conversational text (e.g., 'Here is the report...', 'I hope this is helpful...'). Start directly with the first section heading and output only the clinical report."
            },
            {
              role: "user",
              content: `Patient Name: ${sp.name}
Gender: ${sp.gender || 'Unknown'}
Age: ${calcAge(sp.dob)}
Blood Group: ${sp.blood_group || 'Unknown'}

Telemetry Logs (Oldest to Newest):
${readingsFormatted}`
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || "Failed to generate history analysis.");
      }
      
      const data = await response.json();
      const content = data.choices[0].message.content as string;
      
      localStorage.setItem(`history_analysis_${sp.mobile}`, content);
      setHistoryAnalysisText(content);
      setReportModalType('history');
      setShowAiModal(true);
    } catch (err: any) {
      setHistoryAnalysisError(err.message || "An error occurred while generating history analysis.");
    } finally {
      setHistoryAnalysisLoading(false);
    }
  };

  useEffect(() => {
    if (aiLoading) {
      setWasLoading(true);
    }
    if (wasLoading && !aiLoading && activeReading?.ai_analysis) {
      setWasLoading(false);
      setReportModalType('single');
      setShowAiModal(true);
    }
  }, [aiLoading, activeReading, wasLoading]);

  useEffect(() => {
    if (sp?.latest_reading) {
      const found = history.find(x => x.timestamp === sp.latest_reading?.timestamp) || sp.latest_reading;
      setActiveReading(found);
    } else if (history.length > 0) {
      setActiveReading(history[0]);
    } else {
      setActiveReading(null);
    }
  }, [sp, history]);

  const saveApiKey = () => {
    if (!apiKeyInput.trim()) return;
    localStorage.setItem('groq_api_key', apiKeyInput.trim());
    setHasApiKey(true);
    setShowKeyConfig(false);
    setApiKeyInput('');
  };

  const removeApiKey = () => {
    localStorage.removeItem('groq_api_key');
    setHasApiKey(false);
    setShowKeyConfig(false);
  };

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

          {/* AI Clinical Insights card */}
          <div className="rounded-2xl border overflow-hidden glass-card shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <Brain className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    AI Clinical Insights
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">via Groq AI</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Select any reading in the history table below to analyze</p>
                </div>
              </div>
              
              {hasApiKey && (
                <button 
                  onClick={() => setShowKeyConfig(!showKeyConfig)}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-3 py-1.5 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/10 transition-all cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" /> {showKeyConfig ? 'Back to Analysis' : 'Manage Key'}
                </button>
              )}
            </div>

            <div className="p-6">
              {hasApiKey && !showKeyConfig && history.length >= 2 && (
                <div className="flex border-b border-white/5 mb-5">
                  <button 
                    onClick={() => setActiveAiTab('single')}
                    className={`flex-1 sm:flex-initial text-xs font-bold py-3 px-6 border-b-2 transition-all ${activeAiTab === 'single' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                  >
                    Single Reading Diagnostics
                  </button>
                  <button 
                    onClick={() => setActiveAiTab('history')}
                    className={`flex-1 sm:flex-initial text-xs font-bold py-3 px-6 border-b-2 transition-all ${activeAiTab === 'history' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                  >
                    Longitudinal Trend Analysis ({history.length} Vitals)
                  </button>
                </div>
              )}

              {activeReading ? (
                <div>
                  {showKeyConfig || !hasApiKey ? (
                    /* API KEY Setup form */
                    <div className="max-w-md mx-auto py-4 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
                        <Key className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h4 className="text-white font-bold text-sm tracking-wide">Configure Groq API Key</h4>
                      <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                        To enable secure, instant AI health analysis, input your private Groq API Key. 
                        It is saved strictly inside your local browser storage.
                      </p>
                      
                      <div className="mt-5 flex gap-2">
                        <input 
                          type="password"
                          placeholder="gsk_..."
                          value={apiKeyInput}
                          onChange={e => setApiKeyInput(e.target.value)}
                          className="flex-1 bg-black/30 border border-white/10 focus:border-indigo-500 outline-none rounded-xl px-4 py-2 text-sm text-white"
                        />
                        <button 
                          onClick={saveApiKey}
                          disabled={!apiKeyInput.trim()}
                          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
                        >
                          Save Key
                        </button>
                      </div>

                      {hasApiKey && (
                        <div className="mt-4 flex items-center justify-between bg-red-500/5 border border-red-500/10 p-3 rounded-xl text-left">
                          <div>
                            <p className="text-red-400 text-xs font-bold">Revoke Current Key</p>
                            <p className="text-slate-500 text-[10px] mt-0.5">Delete stored API key from local storage.</p>
                          </div>
                          <button 
                            onClick={removeApiKey}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-400 text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Delete Key
                          </button>
                        </div>
                      )}
                    </div>
                  ) : activeAiTab === 'single' ? (
                    /* Single Reading AI Diagnostics */
                    <div>
                      {/* Reading Metadata Header */}
                      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 mb-4 border-b border-white/5 text-slate-400 text-xs font-semibold">
                        <div className="flex items-center gap-2.5">
                          <span className="text-white px-2 py-1 rounded bg-white/5 border border-white/10 font-mono text-[10px]">READING #{activeReading.id || 'N/A'}</span>
                          <span>Captured: <span className="text-slate-200">{activeReading.timestamp}</span></span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span>HR: <span className="text-rose-400 font-bold">{activeReading.hr} BPM</span></span>
                          <span>Temp: <span className="text-amber-400 font-bold">{activeReading.temp}°C</span></span>
                          <span>SpO₂: <span className="text-sky-400 font-bold">{activeReading.spo2}%</span></span>
                        </div>
                      </div>

                      {aiError && (
                        <div className="mb-4 bg-red-500/10 border border-red-500/25 p-4 rounded-xl text-red-400 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>Error: {aiError}</span>
                        </div>
                      )}

                      {aiLoading ? (
                        <div className="py-12 text-center animate-pulse">
                          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
                          <p className="text-slate-300 text-xs font-semibold tracking-wide">Querying Groq AI for telemetry report...</p>
                          <p className="text-slate-500 text-[11px] mt-1">Analyzing heart rate, body temp, and oxygen saturation</p>
                        </div>
                      ) : activeReading.ai_analysis ? (
                        <div className="bg-white/[0.01] border border-white/[0.03] p-6 rounded-2xl">
                          <div className="prose prose-invert max-w-none">
                            {formatMarkdown(activeReading.ai_analysis)}
                          </div>
                          
                          <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center">
                            <button 
                              onClick={() => { setReportModalType('single'); setShowAiModal(true); }}
                              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-white hover:bg-indigo-500/10 font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                            >
                              <Brain className="w-3.5 h-3.5" /> View Diagnostic Popup
                            </button>
                            <button 
                              onClick={() => onGenerateAnalysis(activeReading.id!, activeReading.hr, activeReading.temp, activeReading.spo2)}
                              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Re-generate Analysis
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-2xl">
                          <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                          </div>
                          <p className="text-slate-300 text-sm font-semibold">Ready to Analyze Telemetry</p>
                          <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto">Click below to generate clinical highlights, anomalies, and recommended actions using Groq Llama 3.</p>
                          
                          <button 
                            onClick={() => onGenerateAnalysis(activeReading.id!, activeReading.hr, activeReading.temp, activeReading.spo2)}
                            className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/25 mx-auto cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" /> Generate AI Clinical Report
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Longitudinal Trend AI Report */
                    <div>
                      {historyAnalysisError && (
                        <div className="mb-4 bg-red-500/10 border border-red-500/25 p-4 rounded-xl text-red-400 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>Error: {historyAnalysisError}</span>
                        </div>
                      )}

                      {historyAnalysisLoading ? (
                        <div className="py-12 text-center animate-pulse">
                          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
                          <p className="text-slate-300 text-xs font-semibold tracking-wide">Compiling longitudinal telemetry history...</p>
                          <p className="text-slate-500 text-[11px] mt-1">Analyzing patient trends and heart rate variability over time</p>
                        </div>
                      ) : historyAnalysisText ? (
                        <div className="bg-white/[0.01] border border-white/[0.03] p-6 rounded-2xl">
                          <div className="prose prose-invert max-w-none">
                            {formatMarkdown(historyAnalysisText)}
                          </div>
                          
                          <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center">
                            <button 
                              onClick={() => { setReportModalType('history'); setShowAiModal(true); }}
                              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-white hover:bg-indigo-500/10 font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                            >
                              <Brain className="w-3.5 h-3.5" /> View Trend Report Popup
                            </button>
                            <button 
                              onClick={handleGenerateHistoryAnalysis}
                              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Re-generate Trend Analysis
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-2xl">
                          <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                            <Activity className="w-5 h-5 text-indigo-400" />
                          </div>
                          <p className="text-slate-300 text-sm font-semibold">Generate Longitudinal Health Report</p>
                          <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">Analyze all {history.length} readings in patient history Collectively. Groq will evaluate progression trends, medical anomalies, and long-term diagnostic actions.</p>
                          
                          <button 
                            onClick={handleGenerateHistoryAnalysis}
                            className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/25 mx-auto cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" /> Generate Overall History Report
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-2xl text-slate-500 text-xs">
                  <Brain className="w-6 h-6 opacity-30 mx-auto mb-2" />
                  No readings available. Capture live vitals to initiate AI analysis.
                </div>
              )}
            </div>
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
                        <tr 
                          key={r.id ?? i} 
                          onClick={() => setActiveReading(r)}
                          className={`hover:bg-white/[0.03] transition-all cursor-pointer group ${activeReading?.timestamp === r.timestamp ? 'bg-white/[0.03] border-l-2 border-indigo-500' : ''}`}
                        >
                          <td className="px-6 py-4 text-slate-500 font-mono text-xs font-medium">{history.length - i}</td>
                          <td className="px-6 py-4 text-slate-300 font-medium whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              {r.timestamp}
                              {r.ai_analysis && (
                                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm" title="AI Clinical Report Available">
                                  <Brain className="w-3 h-3" /> AI
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4"><span className="text-rose-400 font-bold text-base">{r.hr}</span><span className="text-slate-500 text-xs ml-1">BPM</span></td>
                          <td className="px-6 py-4"><span className="text-amber-400 font-bold text-base">{r.temp}</span><span className="text-slate-500 text-xs ml-1">°C</span></td>
                          <td className="px-6 py-4"><span className="text-sky-400 font-bold text-base">{r.spo2}</span><span className="text-slate-500 text-xs ml-1">%</span></td>
                          <td className="px-6 py-4"><span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${hs.c}`}>{hs.l}</span></td>
                          <td className="px-6 py-4"><span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${ss.c}`}>{ss.l}</span></td>
                          <td className="px-6 py-4 text-right">
                            {r.id !== undefined && (
                              <button onClick={(e) => { e.stopPropagation(); ask({ title: 'Delete Reading?', message: `Remove reading from ${r.timestamp}? Cannot be undone.`, confirmLabel: 'Delete', onConfirm: () => deleteReading(r.id!) }); }}
                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all cursor-pointer animate-in fade-in" title="Delete">
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

      {highHrAlert !== null && (
        <DoctorContactModal hr={highHrAlert} onClose={() => setHighHrAlert(null)} />
      )}

      {showAiModal && activeReading && (
        <AiAnalysisModal 
          spName={sp.name} 
          patientInfo={{ gender: sp.gender, dob: sp.dob, blood_group: sp.blood_group, mobile: sp.mobile }}
          reportType={reportModalType}
          reading={activeReading}
          history={history}
          analysisText={reportModalType === 'single' ? (activeReading.ai_analysis || '') : (historyAnalysisText || '')}
          onClose={() => setShowAiModal(false)}
        />
      )}
    </div>
  );
}
