import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import ProductCard from '../components/ProductCard';

const ITEMS_PER_PAGE = 12;

export default function Catalog() {
  const { t, language, isRTL } = useLanguage();
  const { isDark } = useTheme();
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ brand: '', material: '', shape: '', category: '', search: '' });
  const [filterOptions, setFilterOptions] = useState({ brands: [], materials: [], shapes: [], categories: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch('/api/products/filters')
      .then(res => res.json())
      .then(data => setFilterOptions(data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    setLoading(true);
    setCurrentPage(1);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => { if (val) params.append(key, val); });
    fetch(`/api/products?${params}`)
      .then(res => res.json())
      .then(data => { setProducts(data.products || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filters]);

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters({ brand: '', material: '', shape: '', category: '', search: '' });
  const hasActiveFilters = Object.values(filters).some(v => v);

  // Pagination logic
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const paginatedProducts = products.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const selectClass = `w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all ${
    isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-gray-200'
  }`;

  return (
    <div className={`min-h-screen pt-20 pb-16 ${isDark ? 'bg-midnight-900' : 'bg-gradient-to-b from-gray-50/50 to-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 animate-fade-in">
          <h1 className={`text-4xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('catalogTitle')}</h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('catalogSubtitle')}</p>
          <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {language === 'ar' ? `${products.length} منتج` : `${products.length} products`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input type="text" value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder={language === 'ar' ? 'ابحث عن المنتجات...' : 'Search products...'}
              className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all shadow-sm ${
                isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-500' : 'bg-white/70 backdrop-blur-md border border-gray-200'
              }`} />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all shadow-sm ${
              showFilters ? 'gold-gradient text-midnight-900' : isDark ? 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10' : 'bg-white/70 backdrop-blur-md border border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}>
            <SlidersHorizontal size={16} /> {language === 'ar' ? 'الفلاتر' : 'Filters'}
          </button>
        </div>

        {showFilters && (
          <div className={`rounded-2xl p-6 border shadow-sm mb-8 animate-slide-up backdrop-blur-3xl ${
            isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 backdrop-blur-md border-white/20'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[{ key: 'brand', label: t('filterBrand'), options: filterOptions.brands, all: t('allBrands') },
                { key: 'material', label: t('filterMaterial'), options: filterOptions.materials, all: t('allMaterials') },
                { key: 'shape', label: t('filterShape'), options: filterOptions.shapes, all: t('allShapes') },
                { key: 'category', label: t('filterCategory'), options: filterOptions.categories, all: t('allCategories') }
              ].map(f => (
                <div key={f.key}>
                  <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{f.label}</label>
                  <select value={filters[f.key]} onChange={(e) => handleFilterChange(f.key, e.target.value)} className={selectClass}>
                    <option value="">{f.all}</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-4 flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium transition-colors">
                <X size={14} /> {language === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className={`rounded-2xl h-96 animate-pulse ${isDark ? 'bg-white/5' : 'bg-white/50'}`}></div>)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
              <Search size={32} className={isDark ? 'text-gray-600' : 'text-gray-300'} />
            </div>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('noProducts')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProducts.map(product => <ProductCard key={product.id} product={product} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-all ${currentPage === 1 ? 'opacity-40 cursor-not-allowed' : isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <ChevronLeft size={20} className={isRTL ? 'rotate-180' : ''} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                      currentPage === page
                        ? 'gold-gradient text-midnight-900 shadow-md'
                        : isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-all ${currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <ChevronRight size={20} className={isRTL ? 'rotate-180' : ''} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
