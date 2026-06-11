import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Shield, Gem, HeartHandshake, Award, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import ProductCard from '../components/ProductCard';

const testimonials = [
  { nameKey: 'testimonial1Name', textKey: 'testimonial1Text', rating: 5, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
  { nameKey: 'testimonial2Name', textKey: 'testimonial2Text', rating: 5, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
  { nameKey: 'testimonial3Name', textKey: 'testimonial3Text', rating: 5, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
  { nameKey: 'testimonial4Name', textKey: 'testimonial4Text', rating: 5, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
  { nameKey: 'testimonial5Name', textKey: 'testimonial5Text', rating: 5, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
];

export default function Home() {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [aboutSlide, setAboutSlide] = useState(0);
  const testimonialTimerRef = useRef(null);
  const aboutTimerRef = useRef(null);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setFeaturedProducts(data.products?.slice(0, 4) || []))
      .catch(err => console.error('Failed to load products:', err));
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    testimonialTimerRef.current = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(testimonialTimerRef.current);
  }, []);

  // Auto-rotate about slides
  useEffect(() => {
    aboutTimerRef.current = setInterval(() => {
      setAboutSlide(prev => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(aboutTimerRef.current);
  }, []);

  const features = [
    { icon: Gem, titleKey: 'qualityTitle', descKey: 'qualityDesc', color: 'from-gold-500 to-gold-600' },
    { icon: Star, titleKey: 'styleTitle', descKey: 'styleDesc', color: 'from-gold-400 to-gold-500' },
    { icon: HeartHandshake, titleKey: 'serviceTitle', descKey: 'serviceDesc', color: 'from-emerald-500 to-emerald-600' },
    { icon: Award, titleKey: 'guaranteeTitle', descKey: 'guaranteeDesc', color: 'from-violet-500 to-violet-600' },
  ];

  const aboutSlides = [
    { title: t('aboutUs'), desc: t('aboutUsDesc'), stat: '8+', statLabel: language === 'ar' ? 'سنوات من الخبرة' : 'Years Experience' },
    { title: t('aboutUsMission'), desc: '', stat: '50K+', statLabel: language === 'ar' ? 'عميل سعيد' : 'Happy Customers' },
    { title: language === 'ar' ? 'فروعنا' : 'Our Locations', desc: language === 'ar' ? 'نتواجد في الرياض وجدة لخدمتكم' : 'We are located in Riyadh and Jeddah to serve you', stat: '2', statLabel: language === 'ar' ? 'فروع رئيسية' : 'Main Branches' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className={`relative min-h-[90vh] flex items-center justify-center overflow-hidden ${isDark ? 'bg-gradient-to-b from-midnight-900 via-midnight-900 to-midnight-950' : 'bg-gradient-to-b from-primary-50/50 via-white to-white'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold-500/5 via-transparent to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
          <div className="animate-fade-in">
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 shadow-sm border ${
              isDark ? 'bg-gold-500/10 border-gold-500/20' : 'bg-white/60 backdrop-blur-sm border-primary-100'
            }`}>
              <Shield size={14} className="text-gold-500" />
              <span className={`text-xs font-medium ${isDark ? 'text-gold-400' : 'text-primary-700'}`}>{language === 'ar' ? 'أصالة 100%' : '100% Authentic'}</span>
            </div>
            <h1 className={`text-5xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-tight font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('heroTitle')}
              <span className="block gold-text">{language === 'ar' ? 'وأناقة' : '& Elegance'}</span>
            </h1>
            <p className={`text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('heroSubtitle')}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/catalog" className="px-8 py-4 gold-gradient text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 text-lg">
                {t('heroCTA')} <ArrowRight size={20} className={language === 'ar' ? 'rotate-180' : ''} />
              </Link>
              <Link to="/face-guide" className={`px-8 py-4 rounded-xl font-semibold border transition-all duration-300 text-lg ${
                isDark ? 'bg-white/5 text-gray-300 border-white/10 hover:border-gold-500/30 hover:bg-white/10' : 'bg-white/70 backdrop-blur-sm text-gray-700 border-gray-200 hover:border-primary-300 hover:bg-white'
              }`}>
                {t('faceGuide')}
              </Link>
            </div>
          </div>
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t ${isDark ? 'from-midnight-950 to-transparent' : 'from-white to-transparent'}`}></div>
      </section>

      {/* Features */}
      <section className={`py-20 ${isDark ? 'bg-midnight-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className={`p-6 rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-center ${
                  isDark ? 'bg-white/[0.03] border-white/10 hover:border-gold-500/20' : 'bg-white/70 backdrop-blur-md border-white/20'
                }`}>
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t(feature.titleKey)}</h3>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t(feature.descKey)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Us Slider */}
      <section className={`py-20 ${isDark ? 'bg-midnight-950' : 'bg-gradient-to-b from-gray-50/50 to-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('aboutUs')}</h2>
            <div className="w-16 h-1 gold-gradient rounded-full mx-auto"></div>
          </div>
          <div className={`relative rounded-3xl overflow-hidden p-8 md:p-12 border ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white/70 backdrop-blur-md border-white/20 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setAboutSlide(prev => (prev - 1 + 3) % 3)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                <ChevronLeft size={24} />
              </button>
              <button onClick={() => setAboutSlide(prev => (prev + 1) % 3)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                <ChevronRight size={24} />
              </button>
            </div>
            <div className="text-center animate-fade-in" key={aboutSlide}>
              <h3 className={`text-2xl md:text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{aboutSlides[aboutSlide].title}</h3>
              {aboutSlides[aboutSlide].desc && (
                <p className={`text-lg max-w-2xl mx-auto mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{aboutSlides[aboutSlide].desc}</p>
              )}
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-extrabold gold-text">{aboutSlides[aboutSlide].stat}</span>
                <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{aboutSlides[aboutSlide].statLabel}</span>
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-8">
              {[0, 1, 2].map(i => (
                <button key={i} onClick={() => setAboutSlide(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${aboutSlide === i ? 'gold-gradient w-8' : isDark ? 'bg-white/20' : 'bg-gray-300'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className={`py-20 ${isDark ? 'bg-midnight-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('featuredProducts')}</h2>
              <div className="w-16 h-1 gold-gradient rounded-full"></div>
            </div>
            <Link to="/catalog" className="flex items-center gap-2 text-gold-500 hover:text-gold-400 font-semibold transition-colors">
              {t('viewAll')} <ArrowRight size={18} className={language === 'ar' ? 'rotate-180' : ''} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className={`py-20 ${isDark ? 'bg-midnight-950' : 'bg-gradient-to-b from-gray-50/50 to-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('customerReviews')}</h2>
            <div className="w-16 h-1 gold-gradient rounded-full mx-auto"></div>
          </div>
          <div className={`relative rounded-3xl overflow-hidden p-8 md:p-12 border ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white/70 backdrop-blur-md border-white/20 shadow-sm'}`}>
            <Quote size={48} className="text-gold-500/20 absolute top-6 left-6" />
            <div className="text-center animate-fade-in" key={currentTestimonial}>
              <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-gold-500/30">
                <img src={testimonials[currentTestimonial].avatar} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center justify-center gap-1 mb-4">
                {Array.from({ length: testimonials[currentTestimonial].rating }).map((_, i) => (
                  <Star key={i} size={16} className="text-gold-500 fill-gold-500" />
                ))}
              </div>
              <p className={`text-lg md:text-xl italic max-w-2xl mx-auto mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                "{t(testimonials[currentTestimonial].textKey)}"
              </p>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t(testimonials[currentTestimonial].nameKey)}</p>
            </div>
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setCurrentTestimonial(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${currentTestimonial === i ? 'gold-gradient w-8' : isDark ? 'bg-white/20' : 'bg-gray-300'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl p-12 md:p-16 text-center text-white relative overflow-hidden gold-gradient">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(255,255,255,0.1),_transparent_60%)]"></div>
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-midnight-900">
                {language === 'ar' ? 'احجز موعدك الآن' : 'Book Your Eye Exam Today'}
              </h2>
              <p className="text-midnight-800/80 text-lg mb-8 max-w-xl mx-auto">
                {language === 'ar' ? 'احصل على استشارة متخصصة مع أفضل أطباء العيون في متاجرنا' : 'Get a professional consultation with our expert optometrists'}
              </p>
              <Link to="/appointments" className="inline-flex items-center gap-2 px-8 py-4 bg-midnight-900 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-midnight-800 transition-all duration-300 text-lg">
                {t('bookAppointment')} <ArrowRight size={20} className={language === 'ar' ? 'rotate-180' : ''} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-16 ${isDark ? 'bg-midnight-950 border-t border-white/5' : 'bg-gray-900 text-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center gold-gradient">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-xl font-bold text-white">{t('smartOptix')}</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{t('footerDesc')}</p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4 text-white">{t('footerQuickLinks')}</h4>
              <div className="space-y-2">
                <Link to="/catalog" className="block text-gray-400 hover:text-gold-400 transition-colors text-sm">{t('catalog')}</Link>
                <Link to="/appointments" className="block text-gray-400 hover:text-gold-400 transition-colors text-sm">{t('appointments')}</Link>
                <Link to="/face-guide" className="block text-gray-400 hover:text-gold-400 transition-colors text-sm">{t('faceGuide')}</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4 text-white">{t('footerContact')}</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p>{language === 'ar' ? 'البريد: info@smartoptix.com' : 'Email: info@smartoptix.com'}</p>
                <p>{language === 'ar' ? 'الهاتف: +966 50 123 4567' : 'Phone: +966 50 123 4567'}</p>
                <p>{language === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Kingdom of Saudi Arabia'}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-500">
            © 2026 Smart Optix Store. {t('footerRights')}
          </div>
        </div>
      </footer>
    </div>
  );
}
