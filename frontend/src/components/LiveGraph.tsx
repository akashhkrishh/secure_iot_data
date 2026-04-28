import { Activity } from 'lucide-react';

interface LiveGraphProps {
  data: number[];
  color: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  isCapturing: boolean;
}

export function LiveGraph({ data, color, label, unit, min, max, isCapturing }: LiveGraphProps) {
  const W = 400, H = 100, MAX = 20;
  const pts = data.slice(-MAX);
  const cur = pts.length ? pts[pts.length - 1] : null;
  const path = pts.length >= 2 ? pts.map((v, i) => {
    const x = (i / (MAX - 1)) * W;
    const y = H - ((Math.min(Math.max(v, min), max) - min) / (max - min)) * (H - 12) - 6;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ') : '';
  const dotY = cur !== null ? H - ((Math.min(Math.max(cur, min), max) - min) / (max - min)) * (H - 12) - 6 : 0;
  const dotX = pts.length > 1 ? ((pts.length - 1) / (MAX - 1)) * W : 0;
  
  return (
    <div className="rounded-2xl border border-white/5 overflow-hidden flex flex-col bg-[#0d1526] hover:border-white/10 transition-colors shadow-lg shadow-black/20 group">
      <div className="flex items-start justify-between px-5 pt-5 pb-3 relative z-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80" style={{ color }}>{label}</p>
          <p className="text-3xl font-extrabold text-white leading-none tracking-tight">
            {cur !== null ? cur.toFixed(label === 'Temperature' ? 1 : 0) : '—'}
            <span className="text-base font-medium text-slate-500 ml-1">{unit}</span>
          </p>
        </div>
        {isCapturing && (
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10 shadow-sm backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor]" style={{ background: color, color: color }} />
            Live
          </span>
        )}
      </div>
      
      <div style={{ background: 'linear-gradient(180deg, rgba(7,13,26,0) 0%, rgba(7,13,26,1) 100%)', height: H, position: 'relative' }}>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="group-hover:opacity-100 opacity-90 transition-opacity">
          <defs>
            <linearGradient id={`g${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.33, 0.66].map(p => (
            <line key={p} x1="0" y1={H * p} x2={W} y2={H * p} stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />
          ))}
          {path && <>
            <path d={`${path} L ${W} ${H} L 0 ${H} Z`} fill={`url(#g${label})`} className="animate-in fade-in duration-500" />
            <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 4px 6px ${color}40)` }} />
            {cur !== null && (
              <circle cx={dotX} cy={dotY} r="4.5" fill={color} stroke="#0d1526" strokeWidth="2" className="animate-pulse" />
            )}
          </>}
        </svg>
        {!pts.length && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-600">
            <Activity className="w-5 h-5 opacity-50" />
            <span className="text-[10px] font-bold tracking-widest uppercase opacity-50">Awaiting signal</span>
          </div>
        )}
      </div>
    </div>
  );
}
