import { useState } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Lock } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL || '';

export default function PasswordGate({ children }) {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem('bia_auth') === 'true'
  );
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/verify`, { password });
      if (res.data.authenticated) {
        sessionStorage.setItem('bia_auth', 'true');
        setAuthenticated(true);
      }
    } catch {
      setError('Invalid password');
    } finally {
      setLoading(false);
    }
  };

  if (authenticated) return children;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]" data-testid="password-gate">
      <div className="w-full max-w-sm mx-4">
        <div className="glass-card p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-7 h-7 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-white mb-1">BIA</h1>
          <p className="text-sm text-gray-400 mb-6">Blox App Inventory</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              data-testid="password-input"
              type="password"
              placeholder="Enter access code"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-center text-lg tracking-widest"
              autoFocus
            />
            {error && <p data-testid="password-error" className="text-red-400 text-sm">{error}</p>}
            <Button
              data-testid="password-submit"
              type="submit"
              disabled={loading || !password}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? 'Verifying...' : 'Access'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
