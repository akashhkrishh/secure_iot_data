import { useState } from 'react';
import { Activity, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  onLogin: (u: string, p: string) => Promise<boolean>;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter both Doctor ID and Password.');
      return;
    }
    setLoading(true);
    const success = await onLogin(username.trim(), password.trim());
    if (!success) {
      setError('Invalid credentials. Check your Doctor ID and password.');
    }
    setLoading(false);
  };

  const inputCls = "w-full bg-white/5 border border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 outline-none transition-all text-sm backdrop-blur-sm";
  const labelCls = "block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5";

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: '#040710' }}>
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="m-auto w-full max-w-sm px-4 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
            <div className="relative w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
              <Activity className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">MedNode</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium tracking-wide">IoT Patient Secure Telemetry Portal</p>
        </div>

        <div className="rounded-3xl p-8 glass-card border border-white/10 shadow-2xl relative overflow-hidden">
          {/* subtle inner gradient */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3 animate-in shake duration-300">
                {error}
              </div>
            )}

            <div>
              <label className={labelCls}>Doctor ID</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="dr_smith"
                required
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={inputCls}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white hover:opacity-90 active:scale-[0.98] transition-all bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-slate-500">Demo Account</p>
            <p className="text-xs font-mono text-slate-400 mt-1.5 bg-white/5 py-1.5 px-3 rounded-lg inline-block border border-white/5">
              dr_smith <span className="mx-2 opacity-50">/</span> password123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
