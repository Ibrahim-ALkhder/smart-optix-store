import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PrescriptionWizard from '../components/PrescriptionWizard';

export default function Cart() {
  const { t, language, isRTL } = useLanguage();
  const { isDark } = useTheme();
  const { items, removeItem, updateQuantity, clearCart, getSubtotal, getLensUpgradeFee, getShippingFee, getTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('cart');
  const [prescriptionData, setPrescriptionData] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({ city: '', district: '', street: '', house_number: '', special_marks: '', instructions: '' });
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [cardDetails, setCardDetails] = useState({ card_number: '', card_holder: '', expiry: '', cvv: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  const hasPrescriptionItems = items.some(item => item.is_prescription === 1);
  const lensFee = prescriptionData ? getLensUpgradeFee(prescriptionData) : 0;
  const shippingFee = getShippingFee();
  const subtotal = getSubtotal();
  const grandTotal = getTotal(prescriptionData);

  const handlePrescriptionComplete = (data) => { setPrescriptionData(data); setStep('checkout'); };

  // Validate shipping address fields
  const validateAddress = () => {
    const errors = {};
    if (!shippingAddress.city.trim()) errors.city = true;
    if (!shippingAddress.district.trim()) errors.district = true;
    if (!shippingAddress.street.trim()) errors.street = true;
    if (!shippingAddress.house_number.trim()) errors.house_number = true;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate card payment details
  const validateCard = () => {
    const errors = {};
    const num = cardDetails.card_number.replace(/\s/g, '');
    if (!num || num.length < 13 || num.length > 16 || !/^\d+$/.test(num)) errors.card_number = true;
    if (!cardDetails.card_holder.trim() || cardDetails.card_holder.trim().length < 2) errors.card_holder = true;
    if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) errors.expiry = true;
    else {
      const [mm, yy] = cardDetails.expiry.split('/').map(Number);
      const now = new Date();
      const expDate = new Date(2000 + yy, mm);
      if (mm < 1 || mm > 12 || expDate <= now) errors.expiry = true;
    }
    if (!/^\d{3,4}$/.test(cardDetails.cvv)) errors.cvv = true;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate stock for all cart items
  const validateStock = () => {
    for (const item of items) {
      if (item.quantity > (item.stock || 0)) {
        setCheckoutError(
          language === 'ar'
            ? `فقط ${item.stock || 0} عناصر متوفرة من "${item.name_ar}"`
            : `Only ${item.stock || 0} items available for "${item.name_en}"`
        );
        return false;
      }
    }
    setCheckoutError('');
    return true;
  };

  const handleCheckout = async () => {
    if (!user) { navigate('/login'); return; }
    setCheckoutError('');
    setFieldErrors({});

    // Validate stock first
    if (!validateStock()) return;

    // Validate address
    if (!validateAddress()) {
      setCheckoutError(language === 'ar' ? 'يرجى ملء جميع حقول الشحن المطلوبة' : 'Please fill in all required shipping fields');
      return;
    }

    // Validate card if card payment selected
    if (paymentMethod === 'card' && !validateCard()) {
      setCheckoutError(language === 'ar' ? 'يرجى إدخال بيانات البطاقة الصحيحة' : 'Please enter valid card details');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('smartoptix_token');
      const addrStr = `${shippingAddress.city}, ${shippingAddress.district}, ${shippingAddress.street}, #${shippingAddress.house_number}${shippingAddress.special_marks ? ' (' + shippingAddress.special_marks + ')' : ''}`;
      for (const item of items) {
        const formData = new FormData();
        formData.append('product_id', item.id);
        formData.append('quantity', item.quantity);
        formData.append('prescription_data', prescriptionData ? JSON.stringify(prescriptionData.prescription || null) : '');
        formData.append('shipping_address', addrStr);
        formData.append('address_details', JSON.stringify(shippingAddress));
        formData.append('customer_comments', shippingAddress.instructions || '');
        formData.append('lens_upgrade_fee', lensFee);
        formData.append('shipping_fee', shippingFee);
        formData.append('payment_method', paymentMethod);
        if (prescriptionData?.uploadedFile) {
          formData.append('prescription_photo', prescriptionData.uploadedFile);
        }
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) {
          let data;
          try { data = await res.json(); } catch { data = { error: 'Failed to place order' }; }
          setCheckoutError(data.error || 'Failed to place order');
          setLoading(false);
          return;
        }
      }
      clearCart();
      setStep('success');
    } catch (err) { setCheckoutError(err.message || 'Checkout failed'); }
    finally { setLoading(false); }
  };

  const formatCardNumber = (val) => {
    const v = val.replace(/\s/g, '').replace(/\D/g, '').substring(0, 16);
    const parts = [];
    for (let i = 0; i < v.length; i += 4) parts.push(v.substring(i, i + 4));
    return parts.join(' ');
  };

  const formatExpiry = (val) => {
    const v = val.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 3) return v.substring(0, 2) + '/' + v.substring(2);
    return v;
  };

  const errClass = (key) => fieldErrors[key] ? (isDark ? 'border-red-500 ring-1 ring-red-500/50' : 'border-red-500 ring-1 ring-red-500/30') : '';

  const inputClass = `w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all resize-none ${
    isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-500' : 'bg-white border border-gray-200'
  }`;

  if (items.length === 0 && step !== 'success') {
    return (
      <div className={`min-h-screen pt-20 pb-16 flex items-center justify-center ${isDark ? 'bg-midnight-900' : 'bg-gradient-to-b from-gray-50/50 to-white'}`}>
        <div className="text-center animate-fade-in">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
            <ShoppingBag size={40} className={isDark ? 'text-gray-600' : 'text-gray-300'} />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('emptyCart')}</h2>
          <Link to="/catalog" className="inline-flex items-center gap-2 mt-4 px-6 py-3 gold-gradient text-midnight-900 rounded-xl font-semibold shadow-md transition-all text-sm">{t('catalog')}</Link>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className={`min-h-screen pt-20 pb-16 flex items-center justify-center ${isDark ? 'bg-midnight-900' : 'bg-gradient-to-b from-gray-50/50 to-white'}`}>
        <div className={`text-center animate-fade-in rounded-3xl p-12 border shadow-xl max-w-md mx-4 ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white/70 backdrop-blur-md border-white/20'}`}>
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"><Check size={40} className="text-emerald-600" /></div>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('orderPlaced')}</h2>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('trackingYourOrder')}</p>
          <Link to="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 gold-gradient text-midnight-900 rounded-xl font-semibold shadow-md transition-all text-sm">{t('myOrders')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-20 pb-16 ${isDark ? 'bg-midnight-900' : 'bg-gradient-to-b from-gray-50/50 to-white'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {step === 'prescription' ? (
          <div className="animate-fade-in">
            <h2 className={`text-2xl font-bold mb-6 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('prescriptionDetails')}</h2>
            <PrescriptionWizard onComplete={handlePrescriptionComplete} />
          </div>
        ) : step === 'checkout' ? (
          <div className="animate-fade-in">
            <button onClick={() => setStep('cart')} className={`flex items-center gap-2 mb-6 text-sm font-medium ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>
              <ArrowLeft size={16} className={isRTL ? 'rotate-180' : ''} /> {t('back')}
            </button>
            <div className={`rounded-3xl p-6 sm:p-8 border shadow-sm ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white/70 backdrop-blur-md border-white/20'}`}>
              <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('checkoutTitle')}</h2>

              {/* Structured Address */}
              <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-white/5' : 'bg-gray-50/80'}`}>
                <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('shippingAddress')} <span className="text-red-500">*</span></h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'city', label: t('city'), required: true },
                    { key: 'district', label: t('district'), required: true },
                    { key: 'street', label: t('streetName'), required: true },
                    { key: 'house_number', label: t('houseNumber'), required: true },
                    { key: 'special_marks', label: t('specialMarks') },
                  ].map(f => (
                    <div key={f.key}>
                      <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{f.label}{f.required && ' *'}</label>
                      <input value={shippingAddress[f.key]} onChange={e => setShippingAddress(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className={`${inputClass.replace('resize-none', '')} ${errClass(f.key)}`} placeholder={f.required ? (language === 'ar' ? 'مطلوب' : 'Required') : ''} />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('specialInstructions')}</label>
                    <textarea value={shippingAddress.instructions} onChange={e => setShippingAddress(prev => ({ ...prev, instructions: e.target.value }))}
                      className={inputClass} rows={2} placeholder={language === 'ar' ? 'تعليمات اختيارية...' : 'Optional instructions...'} />
                  </div>
                </div>
              </div>

              {prescriptionData && (
                <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gold-500/10 border border-gold-500/20' : 'bg-gold-50 border border-gold-200'}`}>
                  <h3 className={`font-semibold mb-1 ${isDark ? 'text-gold-300' : 'text-gold-800'}`}>{t('prescriptionDetails')}</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{language === 'ar' ? 'تم إرفاق الوصفة الطبية' : 'Prescription details attached'}</p>
                </div>
              )}

              {/* COD Invoice */}
              <div className={`p-5 rounded-xl mb-6 ${isDark ? 'bg-white/5' : 'bg-gray-50/80'}`}>
                <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('orderInvoice')}</h3>
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{language === 'ar' ? item.name_ar : item.name_en} × {item.quantity}</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className={`border-t pt-2 space-y-1 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <div className="flex justify-between text-sm">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('basePrice')}</span>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>${subtotal.toFixed(2)}</span>
                    </div>
                    {lensFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('lensUpgradeFee')}</span>
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>${lensFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('shippingFee')}</span>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>${shippingFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : undefined }}>
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('grandTotal')}</span>
                      <span className="font-bold text-xl gold-text">${grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${isDark ? 'bg-gold-500/10 text-gold-400' : 'bg-gold-50 text-gold-700'}`}>
                  {paymentMethod === 'card' ? '💳' : '💰'} <span>{paymentMethod === 'card' ? t('cardPayment') : t('cashOnDelivery')}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="p-4 rounded-xl mb-4">
                <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('paymentMethod')} <span className="text-red-500">*</span></h3>
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => { setPaymentMethod('card'); setFieldErrors({}); }}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all text-center ${
                      paymentMethod === 'card'
                        ? 'border-gold-500 bg-gold-500/10'
                        : isDark
                          ? 'border-white/10 bg-white/5 hover:border-white/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">💳</div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('cardPayment')}</p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{language === 'ar' ? 'ادفع بالبطاقة الائتمانية' : 'Pay with credit card'}</p>
                  </button>
                  <button
                    onClick={() => { setPaymentMethod('cash_on_delivery'); setFieldErrors({}); }}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all text-center ${
                      paymentMethod === 'cash_on_delivery'
                        ? 'border-gold-500 bg-gold-500/10'
                        : isDark
                          ? 'border-white/10 bg-white/5 hover:border-white/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">💰</div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('cashOnDelivery')}</p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{language === 'ar' ? 'ادفع عند الاستلام' : 'Pay when you receive'}</p>
                  </button>
                </div>

                {/* Card Payment Form */}
                {paymentMethod === 'card' && (
                  <div className={`p-4 rounded-xl space-y-3 ${isDark ? 'bg-white/5' : 'bg-gray-50/80'}`}>
                    <h4 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{language === 'ar' ? 'بيانات البطاقة' : 'Card Details'} <span className="text-red-500">*</span></h4>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{language === 'ar' ? 'رقم البطاقة' : 'Card Number'} *</label>
                      <input type="text" value={cardDetails.card_number} maxLength={19}
                        onChange={e => setCardDetails(prev => ({ ...prev, card_number: formatCardNumber(e.target.value) }))}
                        placeholder="1234 5678 9012 3456"
                        className={`${inputClass.replace('resize-none', '')} ${errClass('card_number')}`} />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{language === 'ar' ? 'اسم حامل البطاقة' : 'Cardholder Name'} *</label>
                      <input type="text" value={cardDetails.card_holder}
                        onChange={e => setCardDetails(prev => ({ ...prev, card_holder: e.target.value.toUpperCase() }))}
                        placeholder={language === 'ar' ? 'الاسم كما على البطاقة' : 'Name as shown on card'}
                        className={`${inputClass.replace('resize-none', '')} ${errClass('card_holder')}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'} *</label>
                        <input type="text" value={cardDetails.expiry} maxLength={5}
                          onChange={e => setCardDetails(prev => ({ ...prev, expiry: formatExpiry(e.target.value) }))}
                          placeholder="MM/YY"
                          className={`${inputClass.replace('resize-none', '')} ${errClass('expiry')}`} />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{language === 'ar' ? 'رمز الأمان' : 'CVV'} *</label>
                        <input type="password" value={cardDetails.cvv} maxLength={4}
                          onChange={e => setCardDetails(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                          placeholder="123"
                          className={`${inputClass.replace('resize-none', '')} ${errClass('cvv')}`} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {checkoutError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">{checkoutError}</div>}

              <button onClick={handleCheckout} disabled={loading || !user}
                className="w-full py-3 gold-gradient text-midnight-900 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 text-sm">
                {loading ? '...' : t('placeOrder')}
              </button>
              {!user && <p className={`text-center text-sm mt-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{language === 'ar' ? 'الرجاء تسجيل الدخول أولاً' : 'Please login first'}</p>}
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('shoppingCart')}</h2>
            <div className="space-y-4 mb-6">
              {items.map(item => (
                <div key={item.id} className={`rounded-2xl p-4 sm:p-5 border shadow-sm flex items-center gap-4 ${
                  isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white/70 backdrop-blur-md border-white/20'
                }`}>
                  {item.image_url && <img src={item.image_url} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-sm sm:text-base truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{language === 'ar' ? item.name_ar : item.name_en}</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.brand}</p>
                    {item.stock !== undefined && item.stock <= 5 && (
                      <p className="text-xs text-amber-500 font-medium mt-0.5">
                        {language === 'ar' ? `فقط ${item.stock} متوفر` : `Only ${item.stock} in stock`}
                      </p>
                    )}
                    <p className={`font-bold mt-1 ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}><Minus size={14} /></button>
                    <span className={`w-8 text-center font-semibold text-sm ${isDark ? 'text-white' : ''}`}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeItem(item.id)}
                    className="w-8 h-8 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-colors"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <div className={`rounded-2xl p-6 border shadow-sm ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white/70 backdrop-blur-md border-white/20'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('total')}</span>
                <span className="text-2xl font-bold gold-text">${subtotal.toFixed(2)}</span>
              </div>
              <button onClick={() => hasPrescriptionItems ? setStep('prescription') : setStep('checkout')}
                className="w-full py-3 gold-gradient text-midnight-900 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all text-sm">
                {hasPrescriptionItems ? (language === 'ar' ? 'أضف الوصفة وتابع' : 'Add Prescription & Continue') : t('checkout')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
