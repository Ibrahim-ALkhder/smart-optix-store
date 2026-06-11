import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

export default function ProductCard({ product }) {
  const { language, t } = useLanguage();
  const { addItem } = useCart();
  const { isDark } = useTheme();

  const name = language === 'ar' ? product.name_ar : product.name_en;
  const description = language === 'ar' ? product.description_ar : product.description_en;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
  };

  const hasDiscount = product.old_price && product.old_price > product.price;
  const discountPct = hasDiscount ? Math.round(((product.old_price - product.price) / product.old_price) * 100) : 0;

  return (
    <Link to={`/product/${product.id}`}>
      <div className={`group rounded-2xl shadow-sm hover:shadow-xl border overflow-hidden transition-all duration-500 hover:-translate-y-1 animate-fade-in ${
        isDark ? 'bg-white/[0.03] border-white/[0.08] hover:border-gold-500/30' : 'bg-white/70 backdrop-blur-md border-white/20'
      }`}>
        {/* Image Container */}
        <div className={`relative overflow-hidden aspect-square ${
          isDark ? 'bg-gradient-to-br from-midnight-800 to-midnight-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'
        }`}>
          {product.image_url ? (
            <img src={product.image_url} alt={name} loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Eye size={48} className={isDark ? 'text-gray-700' : 'text-gray-300'} />
            </div>
          )}
          <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full shadow-sm backdrop-blur-sm ${
              isDark ? 'bg-midnight-900/80 text-gold-400 border border-gold-500/20' : 'bg-white/80 text-primary-700'
            }`}>
              {product.brand}
            </span>
          </div>
          {/* Discount badge */}
          {hasDiscount && (
            <div className="absolute top-3 right-3 rtl:right-auto rtl:left-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500 text-white shadow-md">
                -{discountPct}%
              </span>
            </div>
          )}
          {product.is_prescription === 1 && !hasDiscount && (
            <div className="absolute top-3 right-3 rtl:right-auto rtl:left-3">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full shadow-sm backdrop-blur-sm ${
                isDark ? 'bg-gold-500/20 text-gold-300 border border-gold-500/20' : 'bg-gold-100/90 text-gold-800'
              }`}>
                {t('prescription')}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-6">
            <button onClick={handleAddToCart}
              className="bg-white/90 backdrop-blur-sm text-gray-900 px-6 py-2.5 rounded-full text-sm font-semibold shadow-lg hover:bg-white transition-all duration-200 flex items-center gap-2 translate-y-4 group-hover:translate-y-0">
              <ShoppingCart size={16} /> {t('addToCart')}
            </button>
          </div>
        </div>

        <div className="p-5">
          <h3 className={`font-semibold text-lg mb-1 line-clamp-1 font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>{name}</h3>
          <p className={`text-sm mb-3 line-clamp-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasDiscount && (
                <span className={`text-sm line-through ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  ${product.old_price.toFixed(2)}
                </span>
              )}
              <span className={`text-2xl font-bold ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>${product.price.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2 py-1 rounded-full ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{product.material}</span>
              <span className={`px-2 py-1 rounded-full ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{product.shape}</span>
            </div>
          </div>
          {product.stock < 10 && (
            <div className="mt-3 flex items-center gap-1">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-amber-500 font-medium">
                {language === 'ar' ? `متبقي ${product.stock}` : `${product.stock} left`}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
