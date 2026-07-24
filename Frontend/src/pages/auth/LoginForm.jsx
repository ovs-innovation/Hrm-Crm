import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import VastoraLogo from '../../components/VastoraLogo';
import api from '../../services/api';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';

const LoginForm = () => {
  const [searchParams] = useSearchParams();
  const setupSuccess = searchParams.get('setup') === 'success';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/employees/login', { email, password });
      dispatch(setCredentials({ user: response.data, token: 'session' }));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[360px]">
      <div className="mb-8 lg:hidden">
        <VastoraLogo className="h-9 w-auto max-w-[180px] object-contain" />
      </div>

      {setupSuccess && (
        <div className="mb-5 rounded border border-brand/25 bg-brand-xlight px-3 py-2.5 text-[13px] text-brand">
          Password set. Sign in to continue.
        </div>
      )}

      <h1 className="text-xl font-semibold tracking-tight text-ink">Employee sign in</h1>
      <p className="mt-1 text-[13px] text-muted">Use your company email and password.</p>

      {error && (
        <div className="mt-5 rounded border border-danger/25 bg-danger/5 px-3 py-2.5 text-[13px] text-danger">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="app-label mb-1 block text-[13px]">Email</label>
          <input type="email" required className="app-input h-9 text-[13px]" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div>
          <label className="app-label mb-1 block text-[13px]">Password</label>
          <input type="password" required className="app-input h-9 text-[13px]" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary h-9 w-full text-[13px]">
          {loading ? 'Signing in…' : 'Continue'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
