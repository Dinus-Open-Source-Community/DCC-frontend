import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { setIsAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const resp = await authService.login(username, password);

      if (resp.success) {
        setIsAuthenticated(true);
        navigate('/');
      } else {
        setError('Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to the server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-5 relative overflow-hidden font-mono text-green-500">
      <div className="z-10 w-full max-w-sm bg-[#0a0a0a] border border-green-900 rounded-md p-7 shadow-[0_0_15px_rgba(34,197,94,0.1)]">

        <div className="text-center mb-5">
          <h1 className="text-2xl font-semibold tracking-wider mb-2 text-green-400">DCC Auth</h1>
          <p className="text-green-700 text-xs">Please authenticate to continue.</p>
        </div>

        {error && (
          <div className="mb-3 bg-green-900/20 border border-green-800 text-green-400 px-3 py-2 rounded text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider font-medium text-green-700">Username</label>
            <input
              type="text"
              required
              className="w-full bg-black border border-green-900 text-green-400 rounded px-3 py-2 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors placeholder-green-900/50"
              placeholder="e.g. admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider font-medium text-green-700">Password</label>
            <input
              type="password"
              required
              className="w-full bg-black border border-green-900 text-green-400 rounded px-3 py-2 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors placeholder-green-900/50"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-green-900/30 hover:bg-green-900/50 border border-green-700 text-green-400 font-medium py-2 px-4 rounded transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Authenticating...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
