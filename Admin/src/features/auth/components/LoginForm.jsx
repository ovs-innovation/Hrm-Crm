import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import VastoraLogo from '../../../components/VastoraLogo';
import api from '../../../services/api';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../../store/slices/authSlice';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/admin/login', { email, password });
      dispatch(setCredentials(response.data));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[360px]">
      <div className="mb-8 lg:hidden">
        <VastoraLogo className="h-9 w-auto max-w-[180px] object-contain" />
      </div>

      <h1 className="text-xl font-semibold tracking-tight text-ink">Sign in</h1>
      <p className="mt-1 text-[13px] text-muted">Use your Vastora CRM admin credentials.</p>

      {error && (
        <div className="mt-5 rounded border border-danger/25 bg-danger/5 px-3 py-2.5 text-[13px] text-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="app-label mb-1 block text-[13px]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="app-input h-9 text-[13px]"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="app-label text-[13px]">Password</label>
            <button type="button" className="text-[13px] font-medium text-brand hover:text-brand-hover">
              Forgot password?
            </button>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="app-input h-9 text-[13px]"
            autoComplete="current-password"
            required
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary h-9 w-full text-[13px]">
          {loading ? 'Signing in…' : 'Continue'}
        </button>
      </form>

      <p className="mt-6 text-[13px] text-muted">
        New organization?{' '}
        <Link to="/signup" className="font-medium text-brand hover:text-brand-hover">
          Create account
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;
