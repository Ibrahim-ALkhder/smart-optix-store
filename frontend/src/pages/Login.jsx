import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.user.role === 'admin') navigate('/admin');
      else if (result.user.role === 'driver') navigate('/driver');
      else navigate('/dashboard');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inputClass = `w-full pl-10 pr-11 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all ${
    isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-500' : 'bg-white/80 border border-gray-200'
  }`;

  return (
    <div className={`min-h-screen flex items-center justify-center pt-20 pb-10 px-4 ${isDark ? 'bg-midnight-900' : 'bg-gradient-to-br from-primary-50/50 via-white to-gold-50/30'}`}>
      <div className="w-full max-w-md animate-fade-in">
        <div className={`rounded-3xl shadow-xl border p-8 ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white/70 backdrop-blur-xl border-white/20'}`}>
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg gold-gradient">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('loginTitle')}</h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('loginSubtitle')}</p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('email')}</label>
              <div className="relative">
                <Mail size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@smartoptix.com" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('password')}</label>
              <div className="relative">
                <Lock size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className={inputClass} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 gold-gradient text-midnight-900 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 text-sm">
              {loading ? '...' : t('login')}
            </button>
          </form>
          <p className={`text-center text-sm mt-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('noAccount')} <Link to="/register" className="text-gold-500 hover:text-gold-400 font-semibold">{t('registerHere')}</Link>
          </p>
          <div className={`mt-6 p-4 rounded-xl text-xs space-y-1 ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-50/80 text-gray-500'}`}>
            <p className={`font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Demo Credentials:</p>
            <p>Admin: admin@smartoptix.com / admin123</p>
            <p>Client: client@smartoptix.com / client123</p>
            <p>Driver: driver1@smartoptix.com / driver123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
