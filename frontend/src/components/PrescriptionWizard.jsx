import React, { useState, useRef } from 'react';
import { Upload, ArrowRight, ArrowLeft, Check, Glasses, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function PrescriptionWizard({ onComplete }) {
  const { t, language, isRTL } = useLanguage();
  const { isDark } = useTheme();
  const [step, setStep] = useState(0);
  const [prescriptionType, setPrescriptionType] = useState(null);
  const [prescription, setPrescription] = useState({
    right_eye: { sph: '', cyl: '', axis: '' },
    left_eye: { sph: '', cyl: '', axis: '' },
    pd: '',
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleTypeSelect = (type) => {
    setPrescriptionType(type);
    if (type === 'fashion') {
      onComplete({ type: 'fashion', prescription: null });
    } else {
      setStep(1);
    }
  };

  const handleInputChange = (eye, field, value) => {
    setPrescription(prev => ({
      ...prev,
      [eye]: { ...prev[eye], [field]: value }
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setUploadedFile(file);
  };

  const handleFinish = () => {
    onComplete({ type: 'prescription', prescription, uploadedFile });
  };

  const inputClass = `w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all ${
    isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-500' : 'bg-white/80 border border-gray-200'
  }`;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {prescriptionType === 'prescription' && (
        <div className="flex items-center justify-center mb-8 gap-2">
          {[0, 1, 2].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step >= s ? 'gold-gradient text-white shadow-lg' : isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s ? <Check size={16} /> : s + 1}
              </div>
              {s < 2 && <div className={`w-16 h-1 rounded-full transition-all duration-300 ${step > s ? 'bg-gold-500' : isDark ? 'bg-white/10' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Step 0: Choose Type */}
      {step === 0 && (
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 gold-gradient">
            <Glasses size={36} className="text-white" />
          </div>
          <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('prescriptionTitle')}</h3>
          <p className={`mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{language === 'ar' ? 'اختر نوع النظارات التي تريدها' : 'Choose what type of glasses you need'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => handleTypeSelect('fashion')}
              className={`group p-6 rounded-2xl border-2 transition-all duration-300 shadow-sm hover:shadow-lg ${
                isDark ? 'border-white/10 hover:border-gold-500/50 bg-white/[0.03]' : 'border-gray-200 hover:border-primary-400 hover:bg-primary-50/50'
              }`}>
              <Sparkles size={32} className="text-gold-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h4 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('fashionOnly')}</h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{language === 'ar' ? 'نظارات عصرية بدون عدسة طبية' : 'Stylish frames without prescription lenses'}</p>
            </button>
            <button onClick={() => handleTypeSelect('prescription')}
              className={`group p-6 rounded-2xl border-2 transition-all duration-300 shadow-sm hover:shadow-lg ${
                isDark ? 'border-white/10 hover:border-gold-500/50 bg-white/[0.03]' : 'border-gray-200 hover:border-primary-400 hover:bg-primary-50/50'
              }`}>
              <Glasses size={32} className="text-gold-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h4 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('withPrescription')}</h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{language === 'ar' ? 'أضف مقاسات نظرك' : 'Add your eye measurements'}</p>
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Prescription Details */}
      {step === 1 && (
        <div className="animate-fade-in">
          <h3 className={`text-xl font-bold mb-6 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('prescriptionDetails')}</h3>
          <div className="space-y-6">
            {/* Right Eye */}
            <div className={`rounded-2xl p-5 border shadow-sm ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white/70 backdrop-blur-md border-white/20'}`}>
              <h4 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                <div className="w-3 h-3 bg-gold-500 rounded-full"></div> {t('rightEye')}
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {['sph', 'cyl', 'axis'].map(field => (
                  <div key={field}>
                    <label className={`block text-xs font-medium mb-1 uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t(field)}</label>
                    <input type="text" value={prescription.right_eye[field]}
                      onChange={(e) => handleInputChange('right_eye', field, e.target.value)}
                      placeholder={field === 'axis' ? '0-180' : '-2.00'} className={inputClass} />
                  </div>
                ))}
              </div>
            </div>
            {/* Left Eye */}
            <div className={`rounded-2xl p-5 border shadow-sm ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white/70 backdrop-blur-md border-white/20'}`}>
              <h4 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                <div className="w-3 h-3 bg-primary-400 rounded-full"></div> {t('leftEye')}
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {['sph', 'cyl', 'axis'].map(field => (
                  <div key={field}>
                    <label className={`block text-xs font-medium mb-1 uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t(field)}</label>
                    <input type="text" value={prescription.left_eye[field]}
                      onChange={(e) => handleInputChange('left_eye', field, e.target.value)}
                      placeholder={field === 'axis' ? '0-180' : '-1.75'} className={inputClass} />
                  </div>
                ))}
              </div>
            </div>
            {/* PD */}
            <div className={`rounded-2xl p-5 border shadow-sm ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white/70 backdrop-blur-md border-white/20'}`}>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>{t('pd')}</label>
              <input type="text" value={prescription.pd}
                onChange={(e) => setPrescription(prev => ({ ...prev, pd: e.target.value }))}
                placeholder="62-68" className={`${inputClass} max-w-xs`} />
            </div>
          </div>
          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(0)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all text-sm font-medium ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
              {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />} {t('back')}
            </button>
            <button onClick={() => setStep(2)} className="flex items-center gap-2 px-6 py-2.5 gold-gradient text-white rounded-xl shadow-md hover:shadow-lg transition-all text-sm font-semibold">
              {t('next')} {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Upload */}
      {step === 2 && (
        <div className="animate-fade-in text-center">
          <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('uploadPrescription')}</h3>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('uploadDesc')}</p>
          <div onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all duration-300 ${
              isDark ? 'border-white/10 hover:border-gold-500/50 bg-white/[0.02]' : 'border-gray-300 hover:border-primary-400 bg-white/50 backdrop-blur-sm hover:bg-primary-50/30'
            }`}>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
            {uploadedFile ? (
              <div className="space-y-2">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                  <Check size={28} className="text-emerald-600" />
                </div>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{uploadedFile.name}</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{language === 'ar' ? 'انقر للتغيير' : 'Click to change'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload size={40} className={`mx-auto ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{language === 'ar' ? 'اسحب الملف هنا أو انقر للاختيار' : 'Drag file here or click to select'}</p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>PNG, JPG, PDF</p>
              </div>
            )}
          </div>
          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(1)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all text-sm font-medium ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
              {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />} {t('back')}
            </button>
            <button onClick={handleFinish} className="flex items-center gap-2 px-6 py-2.5 gold-gradient text-white rounded-xl shadow-md hover:shadow-lg transition-all text-sm font-semibold">
              <Check size={16} /> {t('finish')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
