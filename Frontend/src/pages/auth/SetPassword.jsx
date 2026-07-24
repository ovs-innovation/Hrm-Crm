import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../../services/api';

const SetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      return;
    }
    (async () => {
      try {
        const { data } = await api.get(`/auth/invite/validate?token=${encodeURIComponent(token)}`);
        setUserInfo(data);
        setIsTokenValid(true);
      } catch {
        setIsTokenValid(false);
      }
    })();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/invite/set-password', { token, password });
      navigate('/login?setup=success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isTokenValid === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <p className="text-muted">Validating invite link…</p>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
          <h2 className="text-2xl font-bold text-navy mb-2">Invalid Link</h2>
          <p className="text-muted mb-6">This password setup link is invalid or has expired. Please contact your HR administrator to resend the invitation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-line">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand rounded-xl mb-4 shadow-lg shadow-brand/20">
            <span className="text-white font-black text-xl">HR</span>
          </div>
          <h2 className="text-2xl font-bold text-navy">Welcome{userInfo?.name ? `, ${userInfo.name.split(' ')[0]}` : ''}!</h2>
          <p className="text-muted text-sm mt-1">Set a secure password for {userInfo?.email || 'your account'}.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-brand text-red-700 text-sm font-medium rounded-r-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-ink">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 pr-10 py-3 bg-white border border-navy/12 rounded-xl text-navy focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all"
                placeholder="Min. 8 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-ink"
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-ink">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 pr-10 py-3 bg-white border border-navy/12 rounded-xl text-navy focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all"
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-ink"
              >
                {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-xl font-bold shadow-lg shadow-brand/20 transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Saving…' : 'Set Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetPassword;
