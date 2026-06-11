import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Register() {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError(t('password') + ' mismatch'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone);
      navigate('/dashboard');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inputClass = `w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all ${
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
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('registerTitle')}</h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('registerSubtitle')}</p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('name')}</label>
              <div className="relative">
                <User size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input type="text" name="name" value={form.name} onChange={handleChange} required
                  placeholder={language === 'ar' ? 'أحمد محمد' : 'Ahmed Mohammed'} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('email')}</label>
              <div className="relative">
                <Mail size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="ahmed@example.com" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('phone')}</label>
              <div className="relative">
                <Phone size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+966 5X XXX XXXX" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('password')}</label>
              <div className="relative">
                <Lock size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required placeholder="••••••••" className={inputClass} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('confirmPassword')}</label>
              <div className="relative">
                <Lock size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required placeholder="••••••••" className={inputClass} />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 gold-gradient text-midnight-900 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 text-sm">
              {loading ? '...' : t('createAccount')}
            </button>
          </form>
          <p className={`text-center text-sm mt-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('hasAccount')} <Link to="/login" className="text-gold-500 hover:text-gold-400 font-semibold">{t('loginHere')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
