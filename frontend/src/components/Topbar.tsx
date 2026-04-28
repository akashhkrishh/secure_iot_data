import { ChevronRight, LogOut, ArrowLeft } from 'lucide-react';

interface TopbarProps {
  label: string;
  espOnline: boolean;
  back?: () => void;
  onLogout?: () => void;
}

export function Topbar({ label, espOnline, back, onLogout }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-8 h-16 border-b glass-card">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 mr-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md shadow-indigo-500/20">
            M
          </div>
          <span className="font-bold text-white tracking-tight text-lg">MedNode</span>
        </div>
        {back && (
          <>
            <button 
              onClick={back} 
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className="text-sm text-white font-semibold">{label}</span>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
          espOnline 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
            : 'bg-red-500/10 text-red-400 border-red-500/30'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${espOnline ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-red-500'}`} />
          ESP {espOnline ? 'Online' : 'Offline'}
        </span>
        <div className="h-5 w-px bg-white/10" />
        <button 
          onClick={onLogout} 
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </header>
  );
}
