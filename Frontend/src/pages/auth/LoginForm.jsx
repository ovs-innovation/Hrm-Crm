import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import VastoraLogo from '../../components/VastoraLogo';
import api from '../../services/api';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';

const LoginForm = () => {
  const [searchParams] = useSearchParams();
  const setupSuccess = searchParams.get('setup') === 'success';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      const { accessToken, ...user } = response.data;
      dispatch(setCredentials({ user, token: accessToken }));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 lg:hidden">
        <VastoraLogo />
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">Employee portal</p>
      </div>

      {setupSuccess && (
        <div
          role="status"
          className="mb-5 rounded-md border border-brand/20 bg-brand-xlight px-3 py-2.5 text-[13px] text-ink"
        >
          Password set. Sign in to continue.
        </div>
      )}

      <h2 className="text-[22px] font-semibold tracking-tight text-ink">Welcome back</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
        Enter your company email and password.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-md border border-danger/20 bg-danger/5 px-3 py-2.5 text-[13px] text-danger"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="employee-email" className="app-label mb-1.5 block text-[13px]">
            Email
          </label>
          <input
            id="employee-email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            aria-invalid={Boolean(error)}
            placeholder="you@company.com"
            className="app-input h-11 text-[14px]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="employee-password" className="app-label mb-1.5 block text-[13px]">
            Password
          </label>
          <div className="relative">
            <input
              id="employee-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="app-input h-11 pr-11 text-[14px]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-1 h-11 w-full text-[14px] font-semibold"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
