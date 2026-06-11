import React, { useState } from 'react';
import { Eye, Circle, Square, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const faceShapes = {
  oval: {
    iconComponent: Circle,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop',
    recommendedFrames: [
      { name_en: 'Aviator', name_ar: 'أفياتور', reason_en: 'Complements oval proportions', reason_ar: 'يكمل النسب البيضاوية', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=200' },
      { name_en: 'Wayfarer', name_ar: 'وايفرر', reason_en: 'Adds subtle structure', reason_ar: 'يضيف بنية خفيفة', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200' },
      { name_en: 'Round', name_ar: 'دائري', reason_en: 'Maintains natural balance', reason_ar: 'يحافظ على التوازن الطبيعي', image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=200' },
      { name_en: 'Rectangle', name_ar: 'مستطيل', reason_en: 'Enhances elegance', reason_ar: 'يعزز الأناقة', image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=200' },
    ]
  },
  round: {
    iconComponent: Circle,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
    recommendedFrames: [
      { name_en: 'Rectangle', name_ar: 'مستطيل', reason_en: 'Adds angular definition', reason_ar: 'يضيف تعريفاً زاوياً', image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=200' },
      { name_en: 'Square', name_ar: 'مربع', reason_en: 'Sharpens features', reason_ar: 'يحسم الملامح', image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=200' },
      { name_en: 'Cat-Eye', name_ar: 'قطة العيون', reason_en: 'Elongates face shape', reason_ar: 'يطول شكل الوجه', image: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?w=200' },
      { name_en: 'Browline', name_ar: 'براولين', reason_en: 'Adds vertical emphasis', reason_ar: 'يضيف تركيزاً عمودياً', image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=200' },
    ]
  },
  square: {
    iconComponent: Square,
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop',
    recommendedFrames: [
      { name_en: 'Round', name_ar: 'دائري', reason_en: 'Softens angular features', reason_ar: 'ينعم الملامح الزاوية', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200' },
      { name_en: 'Aviator', name_ar: 'أفياتور', reason_en: 'Curves complement jawline', reason_ar: 'الانحناءات تكمل خط الفك', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=200' },
      { name_en: 'Oval', name_ar: 'بيضاوي', reason_en: 'Balances strong features', reason_ar: 'يوزن الملامح القوية', image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=200' },
      { name_en: 'Browline', name_ar: 'براولين', reason_en: 'Draws attention upward', reason_ar: 'يوجه الانتباه للأعلى', image: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?w=200' },
    ]
  }
};

export default function FaceShapeGuide() {
  const { language, t } = useLanguage();
  const { isDark } = useTheme();
  const [selectedShape, setSelectedShape] = useState(null);
  const shapes = Object.keys(faceShapes);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-12 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 gold-gradient">
          <Eye size={32} className="text-white" />
        </div>
        <h2 className={`text-3xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('faceGuideTitle')}</h2>
        <p className={`max-w-xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('faceGuideSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {shapes.map((shape) => {
          const data = faceShapes[shape];
          const isSelected = selectedShape === shape;
          return (
            <button key={shape} onClick={() => setSelectedShape(shape)}
              className={`group p-6 rounded-2xl border-2 transition-all duration-500 text-center ${
                isSelected
                  ? isDark ? 'border-gold-500 bg-gold-500/10 shadow-xl scale-[1.02]' : 'border-primary-500 bg-primary-50/50 shadow-xl scale-[1.02]'
                  : isDark ? 'border-white/10 bg-white/[0.03] hover:border-gold-500/30 hover:shadow-lg hover:-translate-y-1' : 'border-gray-200 bg-white/70 backdrop-blur-md hover:border-primary-300 hover:shadow-lg hover:-translate-y-1'
              }`}>
              <div className={`w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 transition-all duration-300 ${
                isSelected ? isDark ? 'border-gold-500 shadow-lg' : 'border-primary-400 shadow-lg' : isDark ? 'border-white/10 group-hover:border-gold-500/30' : 'border-gray-200 group-hover:border-primary-200'
              }`}>
                <img src={data.image} alt={t(shape)} className="w-full h-full object-cover" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t(shape)}</h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t(shape + 'Desc')}</p>
              {isSelected && (
                <div className="mt-3 flex items-center justify-center gap-1 text-gold-500">
                  <Check size={16} /> <span className="text-sm font-medium">{language === 'ar' ? 'محدد' : 'Selected'}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedShape && (
        <div className="animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-1 bg-gold-500 rounded-full"></div>
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('recommended')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {faceShapes[selectedShape].recommendedFrames.map((frame, index) => (
              <div key={index}
                className={`rounded-2xl p-4 border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                  isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white/70 backdrop-blur-md border-white/20'
                }`} style={{ animationDelay: `${index * 100}ms` }}>
                <div className={`aspect-square rounded-xl overflow-hidden mb-3 ${isDark ? 'bg-midnight-800' : 'bg-gray-100'}`}>
                  <img src={frame.image} alt={language === 'ar' ? frame.name_ar : frame.name_en}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                </div>
                <h4 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'ar' ? frame.name_ar : frame.name_en}
                </h4>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {language === 'ar' ? frame.reason_ar : frame.reason_en}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
