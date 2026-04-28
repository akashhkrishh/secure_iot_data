import type { ConfirmOpts } from '../types';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  opts: ConfirmOpts;
  onCancel: () => void;
}

export function ConfirmDialog({ opts, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl bg-[#0d1526] border-white/10 animate-in zoom-in-95 duration-200">
        <div className="flex gap-4 mb-6">
          <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">{opts.title}</h3>
            <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">{opts.message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button 
            onClick={onCancel} 
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white border border-white/10 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => { opts.onConfirm(); onCancel(); }} 
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/20"
          >
            {opts.confirmLabel ?? 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
