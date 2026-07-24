import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import VastoraLogo from '../../../components/VastoraLogo';
import api from '../../../services/api';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../../store/slices/authSlice';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'HR' // Default role
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/admin/signup', formData);
      
      // Navigate to dashboard on success
      dispatch(setCredentials(response.data));
      navigate('/'); 
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] rounded-lg border border-line bg-surface p-8 shadow-sm">
      <div>
        <div className="relative z-10">
          <div className="text-center mb-6">
            <div className="mb-5 flex justify-center">
              <VastoraLogo className="h-14 w-auto max-w-[240px] object-contain" />
            </div>
            <h2 className="text-xl font-semibold text-ink">Create Account</h2>
            <p className="mt-1 text-sm text-muted">Setup your Vastora admin profile</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-brand/10 border border-brand/25 text-brand text-sm font-medium rounded-xl text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-ink">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-navy/12 rounded-xl text-navy placeholder-white/35 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-ink">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-navy/12 rounded-xl text-navy placeholder-white/35 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all"
                  placeholder="admin@hrmpro.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-ink">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input 
                    type="password" 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-navy/12 rounded-xl text-navy placeholder-white/35 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
 
              <div className="space-y-1">
                <label className="text-sm font-semibold text-ink">Role</label>
                <div className="relative">
                  <select 
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-navy/12 rounded-xl text-navy focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all appearance-none"
                  >
                    <option value="Founder">Founder</option>
                    <option value="Manager">Manager</option>
                    <option value="HR">HR</option>
                    <option value="Sales">Sales</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary mt-4 w-full"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Account...
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>
 
          <p className="mt-8 text-center text-sm text-muted">
            Already have an account? <Link to="/login" className="text-brand font-semibold hover:text-brand/90 transition-colors">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
