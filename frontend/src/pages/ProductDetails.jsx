import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Check, Eye } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import PrescriptionWizard from '../components/PrescriptionWizard';

export default function ProductDetails() {
  const { id } = useParams();
  const { t, language, isRTL } = useLanguage();
  const { isDark } = useTheme();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPrescriptionWizard, setShowPrescriptionWizard] = useState(false);
  const [prescriptionResult, setPrescriptionResult] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => { setProduct(data.product); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handlePrescriptionComplete = (result) => {
    setPrescriptionResult(result);
    setShowPrescriptionWizard(false);
  };

  const handleAddToCart = () => {
    if (product.is_prescription === 1 && !prescriptionResult) {
      setShowPrescriptionWizard(true);
      return;
    }
    addItem(product, 1, prescriptionResult);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <div className="w-10 h-10 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin"></div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{language === 'ar' ? 'المنتج غير موجود' : 'Product not found'}</p>
    </div>
  );

  const name = language === 'ar' ? product.name_ar : product.name_en;
  const desc = language === 'ar' ? product.description_ar : product.description_en;
  const hasDiscount = product.old_price && product.old_price > product.price;
  const discountPct = hasDiscount ? Math.round(((product.old_price - product.price) / product.old_price) * 100) : 0;

  return (
    <div className={`min-h-screen pt-20 pb-16 ${isDark ? 'bg-midnight-900' : 'bg-gradient-to-b from-gray-50/50 to-white'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate(-1)} className={`flex items-center gap-2 mb-8 text-sm font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
          <ArrowLeft size={16} className={isRTL ? 'rotate-180' : ''} /> {t('backToCatalog')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image */}
          <div className={`rounded-3xl overflow-hidden border aspect-square ${isDark ? 'bg-midnight-800 border-white/10' : 'bg-white/70 border-white/20'}`}>
            {product.image_url ? (
              <img src={product.image_url} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Eye size={64} className={isDark ? 'text-gray-700' : 'text-gray-300'} /></div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isDark ? 'bg-white/10 text-gold-400' : 'bg-primary-50 text-primary-700'}`}>{product.brand}</span>
              {product.is_prescription === 1 && (
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isDark ? 'bg-gold-500/20 text-gold-300' : 'bg-gold-100 text-gold-800'}`}>{t('prescription')}</span>
              )}
              {hasDiscount && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500 text-white">
                  -{discountPct}%
                </span>
              )}
            </div>
            <h1 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{name}</h1>
            <p className={`text-lg mb-6 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{desc}</p>
            <div className="flex items-center gap-3 mb-6">
              {hasDiscount && (
                <span className={`text-xl line-through ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  ${product.old_price.toFixed(2)}
                </span>
              )}
              <p className={`text-4xl font-extrabold ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>${product.price.toFixed(2)}</p>
            </div>

            {/* Specs */}
            <div className={`rounded-2xl p-5 border mb-6 ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50/80 border-gray-200'}`}>
              <h3 className={`font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('specifications')}</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('materialLabel')}:</span> <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{product.material}</span></div>
                <div><span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('shapeLabel')}:</span> <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{product.shape}</span></div>
                <div><span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('categoryLabel')}:</span> <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t(product.category)}</span></div>
                <div><span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('stockLabel')}:</span> <span className={`font-medium ${product.stock < 10 ? 'text-amber-500' : isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {product.stock < 10 ? `${t('lowStock')} (${product.stock})` : `${t('inStock')} (${product.stock})`}
                </span></div>
              </div>
            </div>

            {/* Prescription Result */}
            {prescriptionResult && (
              <div className={`rounded-2xl p-4 border mb-6 ${isDark ? 'bg-gold-500/10 border-gold-500/20' : 'bg-gold-50 border-gold-200'}`}>
                <div className="flex items-center gap-2 text-gold-500">
                  <Check size={16} />
                  <span className="text-sm font-semibold">{prescriptionResult.type === 'fashion' ? t('fashionOnly') : t('prescriptionDetails')}</span>
                </div>
              </div>
            )}

            <button onClick={handleAddToCart}
              className={`w-full py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all text-sm flex items-center justify-center gap-2 ${
                addedToCart ? 'bg-emerald-500 text-white' : 'gold-gradient text-midnight-900 hover:opacity-90'
              }`}>
              {addedToCart ? <><Check size={18} /> {t('addToCartSuccess')}</> : <><ShoppingCart size={18} /> {product.is_prescription === 1 && !prescriptionResult ? t('choosePrescription') : t('addToCart')}</>}
            </button>
          </div>
        </div>

        {/* Prescription Wizard Modal */}
        {showPrescriptionWizard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl backdrop-blur-3xl ${
              isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 border-gray-200'
            }`}>
              <div className="flex justify-end p-4">
                <button onClick={() => setShowPrescriptionWizard(false)} className={`p-2 rounded-lg ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}>✕</button>
              </div>
              <PrescriptionWizard onComplete={handlePrescriptionComplete} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
