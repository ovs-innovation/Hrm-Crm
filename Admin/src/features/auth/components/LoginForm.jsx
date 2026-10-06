import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import VastoraLogo from '../../../components/VastoraLogo';
import api from '../../../services/api';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../../store/slices/authSlice';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
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
      const apiMessage = err.response?.data?.message || '';
      if (!err.response) {
        setError('Cannot reach the server. Wait until the backend shows “started on port 5000”, then try again.');
      } else if (err.response?.status === 503 || /buffering timed out|Tenant resolution|Database is offline/i.test(apiMessage)) {
        setError('Database is offline. MongoDB is not connected — fix MONGO_URI or start MongoDB, then restart the backend.');
      } else {
        setError(apiMessage || 'Could not sign in. Check your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExploreDemo = async () => {
    setDemoLoading(true);
    setError(null);
    try {
      const response = await api.post('/demo/workspace/explore');
      dispatch(setCredentials(response.data));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open the demo workspace.');
    } finally {
      setDemoLoading(false);
    }
  };

  const busy = loading || demoLoading;

  return (
    <div className="w-full">
      <div className="mb-6">
        <VastoraLogo variant="header" />
      </div>

      <h2 className="text-[20px] font-semibold tracking-tight text-ink">Sign in</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">
        Use your admin email and password.
      </p>

      {error && (
        <div role="alert" className="mt-4 rounded-md border border-danger/20 bg-danger/5 px-3 py-2.5 text-[13px] text-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="admin-email" className="app-label mb-1.5 block text-[13px]">Email</label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="app-input h-11 text-[14px]"
            autoComplete="email"
            autoFocus
            required
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label htmlFor="admin-password" className="app-label mb-1.5 block text-[13px]">Password</label>
          <div className="relative">
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="app-input h-11 pr-11 text-[14px]"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-ink"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={busy} className="btn-primary h-11 w-full text-[14px] font-semibold">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-2 text-[11px] uppercase tracking-wide text-muted">or</span>
        </div>
      </div>

      <button type="button" onClick={handleExploreDemo} disabled={busy} className="btn-outline h-11 w-full text-[13px]">
        {demoLoading ? 'Opening demo…' : 'Explore demo company'}
      </button>
      <p className="mt-2 text-center text-[12px] text-muted">
        Sample workspace with HR, CRM, and invoices.
      </p>

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
