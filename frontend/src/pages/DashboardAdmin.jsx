import React, { useState, useEffect, useCallback } from 'react';
import { Package, DollarSign, Clock, AlertTriangle, Users, TrendingUp, ChevronDown, Download, Plus, X, Truck, Eye, Pencil, Trash2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useSearchParams } from 'react-router-dom';

const statusColors = { pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700', preparing: 'bg-indigo-100 text-indigo-700', ready_for_delivery: 'bg-cyan-100 text-cyan-700', out_for_delivery: 'bg-purple-100 text-purple-700', delivered: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700' };
const statusColorsDark = { pending: 'bg-amber-500/20 text-amber-400', confirmed: 'bg-blue-500/20 text-blue-400', preparing: 'bg-indigo-500/20 text-indigo-400', ready_for_delivery: 'bg-cyan-500/20 text-cyan-400', out_for_delivery: 'bg-purple-500/20 text-purple-400', delivered: 'bg-emerald-500/20 text-emerald-400', cancelled: 'bg-red-500/20 text-red-400' };

const ProductFormFields = ({ data, setData, isEdit, isDark, language, t, inputClass }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {[
        { key: 'name_en', label: t('productNameEn'), required: true },
        { key: 'name_ar', label: t('productNameAr'), required: true },
        { key: 'description_en', label: t('descEn') },
        { key: 'description_ar', label: t('descAr') },
        { key: 'price', label: t('price'), type: 'number', required: true },
        { key: 'old_price', label: language === 'ar' ? 'السعر القديم (التخفيض)' : 'Old Price (Sale)', type: 'number' },
        { key: 'brand', label: t('brand'), required: true },
        { key: 'material', label: t('material'), required: true },
        { key: 'shape', label: t('shape'), required: true },
        { key: 'stock', label: t('stock'), type: 'number', required: true },
      ].map(f => (
        <div key={f.key}>
          <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{f.label}{f.required && ' *'}</label>
          <input type={f.type || 'text'} value={data[f.key] || ''} onChange={e => setData(prev => ({ ...prev, [f.key]: e.target.value }))} className={inputClass} />
        </div>
      ))}
      {/* Category dropdown */}
      <div>
        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('category')} *</label>
        <select value={data.category} onChange={e => setData(prev => ({ ...prev, category: e.target.value }))} className={inputClass}>
          <option value="prescription">{t('prescription')}</option>
          <option value="sunglasses">{t('sunglasses')}</option>
          <option value="protection">{language === 'ar' ? 'نظارات حماية' : 'Protection'}</option>
          <option value="contact_lenses">{language === 'ar' ? 'عدسات لاصقة' : 'Contact Lenses'}</option>
        </select>
      </div>
      {/* Image Upload */}
      <div className="sm:col-span-2 lg:col-span-2">
        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {language === 'ar' ? 'صورة المنتج' : 'Product Image'}
        </label>
        <div className="flex items-center gap-3">
          <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            isDark ? 'border-white/20 hover:border-gold-500/40 bg-white/5 text-gray-400' : 'border-gray-300 hover:border-gold-400 bg-gray-50 text-gray-500'
          }`}>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => setData(prev => ({ ...prev, image: e.target.files[0] }))}
            />
            <Package size={16} />
            <span className="text-xs font-medium">{data.image ? (data.image.name || language === 'ar' ? 'تم اختيار ملف' : 'File selected') : (language === 'ar' ? 'اختر صورة من جهازك' : 'Choose image from device')}</span>
          </label>
          {(data.image || data.image_url) && (
            <img
              src={data.image ? URL.createObjectURL(data.image) : data.image_url}
              alt=""
              className="w-12 h-12 rounded-xl object-cover"
            />
          )}
        </div>
      </div>
    </div>
  );

export default function DashboardAdmin() {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [products, setProducts] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [driverMetrics, setDriverMetrics] = useState([]);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [loading, setLoading] = useState(true);
  const [salesFilter, setSalesFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [viewingDriver, setViewingDriver] = useState(null);
  const [driverActivity, setDriverActivity] = useState([]);
  const [driverActivityStats, setDriverActivityStats] = useState({});
  const [driverActivityFilter, setDriverActivityFilter] = useState('monthly');
  const [showSetAppointment, setShowSetAppointment] = useState(false);
  const [clients, setClients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [branches, setBranches] = useState([]);
  const [newAppointment, setNewAppointment] = useState({ customer_id: '', doctor_name: '', branch: '', appointment_date: '', time_slot: '', notes: '' });

  const defaultProduct = { name_en: '', name_ar: '', description_en: '', description_ar: '', price: '', old_price: '', brand: '', material: '', shape: '', category: 'prescription', image_url: '', stock: '' };
  const [newProduct, setNewProduct] = useState({ ...defaultProduct });
  const [editProduct, setEditProduct] = useState({ ...defaultProduct });
  const [newDriver, setNewDriver] = useState({ name: '', email: '', password: '', phone: '', full_name: '', region: '' });

  // Sync tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const headers = { Authorization: `Bearer ${localStorage.getItem('smartoptix_token')}`, 'Content-Type': 'application/json' };

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, ordersRes, apptsRes, productsRes, driversRes, metricsRes] = await Promise.all([
        fetch(`/api/orders/stats?filter=${salesFilter}&start_date=${dateRange.start}&end_date=${dateRange.end}`, { headers }),
        fetch('/api/orders', { headers }),
        fetch('/api/appointments', { headers }),
        fetch('/api/products', { headers }),
        fetch('/api/drivers', { headers }),
        fetch(`/api/drivers/metrics?start_date=${dateRange.start}&end_date=${dateRange.end}`, { headers }),
      ]);
      setStats(await statsRes.json());
      setOrders((await ordersRes.json()).orders || []);
      setAppointments((await apptsRes.json()).appointments || []);
      setProducts((await productsRes.json()).products || []);
      setDrivers((await driversRes.json()).drivers || []);
      setDriverMetrics((await metricsRes.json()).metrics || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [salesFilter, dateRange]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateOrderStatus = async (orderId, status) => {
    const res = await fetch(`/api/orders/${orderId}/status`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Failed to update status');
    }
    fetchAll();
  };

  const updateAppointmentStatus = async (apptId, status) => {
    const res = await fetch(`/api/appointments/${apptId}/status`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Failed to update status');
    }
    fetchAll();
  };

  const handleExportCsv = async () => {
    const res = await fetch(`/api/orders/sales-records?filter=${salesFilter}&start_date=${dateRange.start}&end_date=${dateRange.end}`, { headers });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sales-report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // Product image file upload helper
  const buildProductFormData = (productData, fileInputRef) => {
    const formData = new FormData();
    Object.entries(productData).forEach(([key, val]) => {
      if (key === 'image' && val) {
        formData.append('image', val);
      } else if (key === 'image_url' && !productData.image) {
        // Only send image_url if no file selected
        if (val) formData.append('image_url', val);
      } else if (key !== 'image') {
        if (val !== '' && val !== null && val !== undefined) {
          formData.append(key, val);
        }
      }
    });
    return formData;
  };

  const handleCreateProduct = async () => {
    try {
      const formData = buildProductFormData({
        ...newProduct,
        price: parseFloat(newProduct.price) || 0,
        old_price: newProduct.old_price ? parseFloat(newProduct.old_price) : null,
        stock: parseInt(newProduct.stock) || 0,
        is_prescription: newProduct.category === 'prescription' ? 1 : 0,
      });
      const token = localStorage.getItem('smartoptix_token');
      await fetch('/api/products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      setShowAddProduct(false);
      setNewProduct({ ...defaultProduct });
      fetchAll();
    } catch (err) { console.error(err); }
  };

  const handleEditProduct = async () => {
    try {
      const formData = buildProductFormData({
        ...editProduct,
        price: parseFloat(editProduct.price) || 0,
        old_price: editProduct.old_price ? parseFloat(editProduct.old_price) : null,
        stock: parseInt(editProduct.stock) || 0,
        is_prescription: editProduct.category === 'prescription' ? 1 : 0,
      });
      const token = localStorage.getItem('smartoptix_token');
      await fetch(`/api/products/${editProduct.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      setEditingProduct(null);
      setEditProduct({ ...defaultProduct });
      fetchAll();
    } catch (err) { console.error(err); }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المنتج؟' : 'Are you sure you want to delete this product?')) return;
    try {
      const token = localStorage.getItem('smartoptix_token');
      await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAll();
    } catch (err) { console.error(err); }
  };

  const openEditModal = (product) => {
    setEditProduct({ ...product, image: null });
    setEditingProduct(product.id);
  };

  const handleCreateDriver = async () => {
    try {
      const res = await fetch('/api/drivers', { method: 'POST', headers, body: JSON.stringify(newDriver) });
      if (res.ok) {
        setShowAddDriver(false);
        setNewDriver({ name: '', email: '', password: '', phone: '', full_name: '', region: '' });
        fetchAll();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteDriver = async (driverId, driverName) => {
    const confirmMsg = language === 'ar'
      ? `هل أنت متأكد من حذف السائق "${driverName}"؟ هذا الإجراء لا يمكن التراجع عنه.`
      : `Are you sure you want to delete driver "${driverName}"? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;
    try {
      const res = await fetch(`/api/drivers/${driverId}`, { method: 'DELETE', headers });
      if (res.ok) {
        setViewingDriver(null);
        fetchAll();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete driver');
      }
    } catch (err) { console.error(err); }
  };

  const fetchDriverActivity = async (driverId, filter) => {
    try {
      const res = await fetch(`/api/drivers/${driverId}/activity?filter=${filter}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setDriverActivity(data.activity || []);
        setDriverActivityStats(data.stats || {});
      }
    } catch (err) { console.error(err); }
  };

  const openDriverActivity = async (driver) => {
    setViewingDriver(driver);
    setDriverActivityFilter('monthly');
    await fetchDriverActivity(driver.id, 'monthly');
  };

  const fetchClientsAndDoctors = async () => {
    try {
      const [clientsRes, doctorsRes] = await Promise.all([
        fetch('/api/appointments/clients', { headers }),
        fetch('/api/appointments/doctors'),
      ]);
      if (clientsRes.ok) setClients((await clientsRes.json()).clients || []);
      if (doctorsRes.ok) {
        const data = await doctorsRes.json();
        setDoctors(data.doctors || []);
        setBranches(data.branches || []);
      }
    } catch (err) { console.error(err); }
  };

  const handleSetAppointment = async () => {
    if (!newAppointment.customer_id || !newAppointment.doctor_name || !newAppointment.branch || !newAppointment.appointment_date || !newAppointment.time_slot) {
      alert(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields');
      return;
    }
    try {
      const res = await fetch('/api/appointments/set', {
        method: 'POST', headers,
        body: JSON.stringify(newAppointment),
      });
      if (res.ok) {
        setShowSetAppointment(false);
        setNewAppointment({ customer_id: '', doctor_name: '', branch: '', appointment_date: '', time_slot: '', notes: '' });
        fetchAll();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to set appointment');
      }
    } catch (err) { console.error(err); }
  };

  const allTimeSlots = [
    '09:00 AM - 09:30 AM', '09:30 AM - 10:00 AM', '10:00 AM - 10:30 AM',
    '10:30 AM - 11:00 AM', '11:00 AM - 11:30 AM', '11:30 AM - 12:00 PM',
    '01:00 PM - 01:30 PM', '01:30 PM - 02:00 PM', '02:00 PM - 02:30 PM',
    '02:30 PM - 03:00 PM', '03:00 PM - 03:30 PM', '03:30 PM - 04:00 PM',
    '04:00 PM - 04:30 PM', '04:30 PM - 05:00 PM'
  ];

  const aptStatuses = ['confirmed', 'pending', 'completed', 'cancelled'];
  const sc = (s) => isDark ? (statusColorsDark[s] || 'bg-gray-500/20 text-gray-400') : (statusColors[s] || 'bg-gray-100 text-gray-700');

  const statCards = [
    { label: t('totalOrders'), value: stats.totalOrders, icon: Package, color: 'from-blue-500 to-blue-600' },
    { label: t('totalRevenue'), value: `$${(stats.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
    { label: t('pendingOrders'), value: stats.pendingOrders, icon: Clock, color: 'from-amber-500 to-amber-600' },
    { label: t('totalProducts'), value: stats.totalProducts, icon: TrendingUp, color: 'from-violet-500 to-violet-600' },
    { label: t('totalClients'), value: stats.totalUsers, icon: Users, color: 'from-pink-500 to-pink-600' },
    { label: t('totalDrivers'), value: stats.totalDrivers, icon: Truck, color: 'from-cyan-500 to-cyan-600' },
    { label: t('lowStock'), value: stats.lowStockProducts, icon: AlertTriangle, color: 'from-red-500 to-red-600' },
  ];

  const lowStockProducts = products.filter(p => p.stock < 10);
  const filteredProducts = products.filter(p => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return p.name_en.toLowerCase().includes(q) || p.name_ar.includes(q) || p.brand.toLowerCase().includes(q);
  });
  const tabs = [
    { id: 'overview', label: language === 'ar' ? 'نظرة عامة' : 'Overview' },
    { id: 'orders', label: t('manageOrders') },
    { id: 'appointments', label: t('manageAppointments') },
    { id: 'drivers', label: t('driverMetrics') },
    { id: 'inventory', label: t('inventoryAlerts') },
    { id: 'products', label: t('manageProducts') },
  ];

  const inputClass = `w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-500' : 'bg-white border border-gray-200'}`;



  return (
    <div className={`min-h-screen pt-20 pb-16 ${isDark ? 'bg-midnight-900' : 'bg-gradient-to-b from-gray-50/50 to-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 animate-fade-in">
          <h1 className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('adminDashboard')}</h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{language === 'ar' ? 'إدارة متجرك بالكامل' : 'Manage your entire store'}</p>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'gold-gradient text-midnight-900 shadow-md' : isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10' : 'bg-white/70 text-gray-600 hover:bg-white border border-gray-200'}`}>{tab.label}</button>
          ))}
        </div>

        {/* Sales Filter Bar (Overview) */}
        {activeTab === 'overview' && (
          <div className={`flex flex-wrap items-center gap-3 mb-6 p-4 rounded-2xl border backdrop-blur-3xl ${
            isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 border-white/20'
          }`}>
            {[{ key: '', label: language === 'ar' ? 'الكل' : 'All' }, { key: 'today', label: t('filterToday') }, { key: 'week', label: t('filterWeek') }, { key: 'month', label: t('filterMonth') }].map(f => (
              <button key={f.key} onClick={() => setSalesFilter(f.key)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${salesFilter === f.key ? 'gold-gradient text-midnight-900' : isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f.label}</button>
            ))}
            <div className="flex items-center gap-2 ml-auto">
              <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className={`px-3 py-1.5 rounded-lg text-xs ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-gray-200'}`} />
              <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>—</span>
              <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className={`px-3 py-1.5 rounded-lg text-xs ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-gray-200'}`} />
              <button onClick={handleExportCsv} className="flex items-center gap-1.5 px-4 py-1.5 gold-gradient text-midnight-900 rounded-lg text-xs font-semibold transition-all hover:opacity-90">
                <Download size={14} /> {t('exportCsv')}
              </button>
            </div>
          </div>
        )}

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className={`rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all backdrop-blur-3xl ${
                    isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 backdrop-blur-md border-white/20'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div><p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{card.label}</p><p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{card.value || 0}</p></div>
                      <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center`}><Icon size={22} className="text-white" /></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={`rounded-2xl p-6 border shadow-sm backdrop-blur-3xl ${
              isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 backdrop-blur-md border-white/20'
            }`}>
              <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('recentOrders')}</h3>
              <div className="space-y-3">
                {orders.slice(0, 5).map(order => (
                  <div key={order.id} className={`flex items-center justify-between py-2 border-b last:border-0 ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                      {order.image_url && <img src={order.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{language === 'ar' ? order.name_ar : order.name_en}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{order.user_name} · #{order.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${sc(order.status)}`}>{t(order.status)}</span>
                      <p className={`text-sm font-semibold mt-0.5 ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>${order.total_price?.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className={`rounded-2xl border shadow-sm overflow-hidden animate-fade-in backdrop-blur-3xl ${
            isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 backdrop-blur-md border-white/20'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className={`border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50/50'}`}>
                  <th className={`text-left px-4 py-3 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'ar' ? 'المنتج' : 'Product'}</th>
                  <th className={`text-left px-4 py-3 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'ar' ? 'العميل' : 'Customer'}</th>
                  <th className={`text-left px-4 py-3 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('orderTotal')}</th>
                  <th className={`text-left px-4 py-3 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('paymentMethod')}</th>
                  <th className={`text-left px-4 py-3 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('orderDate')}</th>
                  <th className={`text-left px-4 py-3 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'ar' ? 'الوصفة' : 'Rx'}</th>
                  <th className={`text-left px-4 py-3 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('updateStatus')}</th>
                </tr></thead>
                <tbody>{orders.map(order => (
                  <tr key={order.id} className={`border-b transition-colors ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50/50'}`}>
                    <td className="px-4 py-3"><div className="flex items-center gap-2">{order.image_url && <img src={order.image_url} alt="" className="w-8 h-8 rounded-lg object-cover" />}<span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{language === 'ar' ? order.name_ar : order.name_en}</span></div></td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{order.user_name}</td>
                    <td className={`px-4 py-3 font-semibold ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>${order.total_price?.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        order.payment_method === 'card'
                          ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                          : isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {order.payment_method === 'card' ? '💳' : '💰'}
                        {order.payment_method === 'card' ? t('cardPayment') : t('cashOnDelivery')}
                      </span>
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{order.created_at?.split('T')[0]}</td>
                    <td className="px-4 py-3">
                      {order.prescription_data && typeof order.prescription_data === 'object' && Object.keys(order.prescription_data).length > 0 && order.prescription_data.type !== 'fashion' ? (
                        <button onClick={() => setViewingOrder(order)} className="text-gold-500 hover:text-gold-400 transition-colors">
                          <Eye size={16} />
                        </button>
                      ) : (
                        <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        {(order.status === 'cancelled' || order.status === 'delivered') ? (
                          <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold ${sc(order.status)}`}>
                            {t(order.status)} 🔒
                          </span>
                        ) : (
                          <>
                            <select value={order.status} onChange={(e) => {
                              const newStatus = e.target.value;
                              const confirmMsg = newStatus === 'cancelled'
                                ? (language === 'ar' ? 'هل أنت متأكد من إلغاء هذا الطلب؟' : 'Are you sure you want to cancel this order?')
                                : (language === 'ar' ? `هل تريد تغيير حالة الطلب إلى "${t(newStatus)}"؟` : `Change order status to "${t(newStatus)}"?`);
                              if (window.confirm(confirmMsg)) updateOrderStatus(order.id, newStatus);
                            }}
                              className={`appearance-none w-full px-3 py-1.5 pr-8 rounded-lg text-xs font-semibold border-0 focus:ring-2 focus:ring-gold-500 cursor-pointer ${sc(order.status)}`}>
                              {['pending', 'confirmed', 'preparing', 'ready_for_delivery', 'cancelled'].map(s => <option key={s} value={s}>{t(s)}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* Prescription View Modal */}
        {viewingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 backdrop-blur-3xl ${
              isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'ar' ? 'الوصفة الطبية' : 'Prescription Details'} — Order #{viewingOrder.id}
                </h3>
                <button onClick={() => setViewingOrder(null)} className={`p-2 rounded-lg ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}>✕</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gold-500/10' : 'bg-primary-50/50'}`}>
                  <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gold-400' : 'text-primary-700'}`}>{t('rightEye')} (OD)</p>
                  <div className="space-y-1 text-sm">
                    <div><span className="text-gray-500">SPH: </span><span className={`font-medium ${isDark ? 'text-white' : ''}`}>{viewingOrder.prescription_data?.right_eye?.sph || '—'}</span></div>
                    <div><span className="text-gray-500">CYL: </span><span className={`font-medium ${isDark ? 'text-white' : ''}`}>{viewingOrder.prescription_data?.right_eye?.cyl || '—'}</span></div>
                    <div><span className="text-gray-500">AXIS: </span><span className={`font-medium ${isDark ? 'text-white' : ''}`}>{viewingOrder.prescription_data?.right_eye?.axis || '—'}</span></div>
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gold-50/50'}`}>
                  <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gold-700'}`}>{t('leftEye')} (OS)</p>
                  <div className="space-y-1 text-sm">
                    <div><span className="text-gray-500">SPH: </span><span className={`font-medium ${isDark ? 'text-white' : ''}`}>{viewingOrder.prescription_data?.left_eye?.sph || '—'}</span></div>
                    <div><span className="text-gray-500">CYL: </span><span className={`font-medium ${isDark ? 'text-white' : ''}`}>{viewingOrder.prescription_data?.left_eye?.cyl || '—'}</span></div>
                    <div><span className="text-gray-500">AXIS: </span><span className={`font-medium ${isDark ? 'text-white' : ''}`}>{viewingOrder.prescription_data?.left_eye?.axis || '—'}</span></div>
                  </div>
                </div>
              </div>
              {viewingOrder.prescription_data?.pd && (
                <div className={`mt-4 p-3 rounded-xl text-sm ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>PD: </span>
                  <span className={isDark ? 'text-white' : ''}>{viewingOrder.prescription_data.pd}</span>
                </div>
              )}
              {viewingOrder.lens_upgrade_fee > 0 && (
                <div className={`mt-3 p-3 rounded-xl text-sm ${isDark ? 'bg-gold-500/5 border border-gold-500/10' : 'bg-gold-50 border border-gold-200'}`}>
                  <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('lensUpgradeFee')}: </span>
                  <span className={`font-semibold ${isDark ? 'text-gold-400' : 'text-gold-700'}`}>${viewingOrder.lens_upgrade_fee}</span>
                </div>
              )}
              {viewingOrder.prescription_data?.prescription_photo && (
                <div className="mt-4">
                  <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{language === 'ar' ? 'صورة الوصفة الطبية' : 'Prescription Photo'}</p>
                  <a href={viewingOrder.prescription_data.prescription_photo} target="_blank" rel="noopener noreferrer">
                    <img src={viewingOrder.prescription_data.prescription_photo} alt="Prescription"
                      className="w-full max-w-sm rounded-xl border object-cover max-h-64" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="animate-fade-in">
            <button onClick={() => { setShowSetAppointment(!showSetAppointment); if (!showSetAppointment) fetchClientsAndDoctors(); }} className="flex items-center gap-2 px-5 py-2.5 gold-gradient text-midnight-900 rounded-xl font-semibold text-sm mb-6 shadow-md hover:shadow-lg transition-all">
              <Plus size={16} /> {t('setAppointment')}
            </button>

            {showSetAppointment && (
              <div className={`rounded-2xl p-6 border mb-6 backdrop-blur-3xl ${
                isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 backdrop-blur-md border-white/20'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('setAppointment')}</h3>
                  <button onClick={() => setShowSetAppointment(false)} className={`p-1 rounded-lg ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}><X size={18} /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('customerName')} *</label>
                    <select value={newAppointment.customer_id} onChange={e => setNewAppointment(prev => ({ ...prev, customer_id: e.target.value }))} className={inputClass}>
                      <option value="">{language === 'ar' ? 'اختر العميل' : 'Select customer'}</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('selectDoctor')} *</label>
                    <select value={newAppointment.doctor_name} onChange={e => setNewAppointment(prev => ({ ...prev, doctor_name: e.target.value }))} className={inputClass}>
                      <option value="">{language === 'ar' ? 'اختر الطبيب' : 'Select doctor'}</option>
                      {doctors.map(d => <option key={d.id} value={d.name_en}>{language === 'ar' ? d.name_ar : d.name_en}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('setLocation')} *</label>
                    <select value={newAppointment.branch} onChange={e => setNewAppointment(prev => ({ ...prev, branch: e.target.value }))} className={inputClass}>
                      <option value="">{language === 'ar' ? 'اختر الموقع' : 'Select location'}</option>
                      {branches.map(b => <option key={b.id} value={b.name_en}>{language === 'ar' ? b.name_ar : b.name_en}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('selectDate')} *</label>
                    <input type="date" value={newAppointment.appointment_date} onChange={e => setNewAppointment(prev => ({ ...prev, appointment_date: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('selectTime')} *</label>
                    <select value={newAppointment.time_slot} onChange={e => setNewAppointment(prev => ({ ...prev, time_slot: e.target.value }))} className={inputClass}>
                      <option value="">{language === 'ar' ? 'اختر الوقت' : 'Select time'}</option>
                      {allTimeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('appointmentNotes')}</label>
                    <input type="text" value={newAppointment.notes} onChange={e => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))} className={inputClass} placeholder={language === 'ar' ? 'ملاحظات اختيارية' : 'Optional notes'} />
                  </div>
                </div>
                <button onClick={handleSetAppointment} className="mt-4 px-6 py-2.5 gold-gradient text-midnight-900 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all">
                  {t('confirmSetAppointment')}
                </button>
              </div>
            )}

            <div className={`rounded-2xl border shadow-sm overflow-hidden backdrop-blur-3xl ${
              isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 backdrop-blur-md border-white/20'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                <thead><tr className={`border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50/50'}`}>
                  <th className={`text-left px-4 py-3 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'ar' ? 'الطبيب' : 'Doctor'}</th>
                  <th className={`text-left px-4 py-3 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'ar' ? 'العميل' : 'Client'}</th>
                  <th className={`text-left px-4 py-3 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}</th>
                  <th className={`text-left px-4 py-3 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('updateStatus')}</th>
                </tr></thead>
                <tbody>{appointments.map(apt => (
                  <tr key={apt.id} className={`border-b transition-colors ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50/50'}`}>
                    <td className={`px-4 py-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{apt.doctor_name}</td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{apt.user_name}</td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{apt.appointment_date} · {apt.time_slot}</td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        {(apt.status === 'completed' || apt.status === 'cancelled') ? (
                          <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold ${sc(apt.status)}`}>
                            {t(apt.status + 'Appointment') || apt.status} 🔒
                          </span>
                        ) : (
                          <>
                            <select value={apt.status} onChange={(e) => updateAppointmentStatus(apt.id, e.target.value)}
                              className={`appearance-none w-full px-3 py-1.5 pr-8 rounded-lg text-xs font-semibold border-0 focus:ring-2 focus:ring-gold-500 cursor-pointer ${sc(apt.status)}`}>
                              {aptStatuses.map(s => <option key={s} value={s}>{t(s + 'Appointment') || s}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
        )}
        {activeTab === 'drivers' && (
          <div className="animate-fade-in">
            <button onClick={() => setShowAddDriver(true)} className="flex items-center gap-2 px-5 py-2.5 gold-gradient text-midnight-900 rounded-xl font-semibold text-sm mb-6 shadow-md hover:shadow-lg transition-all">
              <Plus size={16} /> {language === 'ar' ? 'إضافة سائق جديد' : 'Add New Driver'}
            </button>

            {showAddDriver && (
              <div className={`rounded-2xl p-6 border mb-6 backdrop-blur-3xl ${
                isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 backdrop-blur-md border-white/20'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{language === 'ar' ? 'إضافة سائق جديد' : 'Add New Driver'}</h3>
                  <button onClick={() => setShowAddDriver(false)} className={`p-1 rounded-lg ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}><X size={18} /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { key: 'name', label: t('name'), required: true },
                    { key: 'email', label: t('email'), type: 'email', required: true },
                    { key: 'password', label: t('password'), type: 'password', required: true },
                    { key: 'full_name', label: language === 'ar' ? 'الاسم الكامل' : 'Full Name' },
                    { key: 'phone', label: t('phone') },
                    { key: 'region', label: language === 'ar' ? 'المنطقة' : 'Region' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{f.label}{f.required && ' *'}</label>
                      <input type={f.type || 'text'} value={newDriver[f.key]} onChange={e => setNewDriver(prev => ({ ...prev, [f.key]: e.target.value }))} className={inputClass} />
                    </div>
                  ))}
                </div>
                <button onClick={handleCreateDriver} className="mt-4 px-6 py-2.5 gold-gradient text-midnight-900 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all">
                  {language === 'ar' ? 'إنشاء حساب السائق' : 'Create Driver Account'}
                </button>
              </div>
            )}

            <div className={`rounded-2xl border shadow-sm overflow-hidden backdrop-blur-3xl ${
              isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 backdrop-blur-md border-white/20'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className={`border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50/50'}`}>
                    <th className={`text-left px-4 py-3 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'ar' ? 'السائق' : 'Driver'}</th>
                    <th className={`text-left px-4 py-3 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'ar' ? 'المنطقة' : 'Region'}</th>
                    <th className={`text-left px-4 py-3 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className={`text-left px-4 py-3 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('completedDeliveries')}</th>
                    <th className={`text-left px-4 py-3 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('earnings')}</th>
                    <th className={`text-left px-4 py-3 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  </tr></thead>
                  <tbody>{driverMetrics.map((d, i) => (
                    <tr key={d.id} className={`border-b transition-colors ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50/50'}`}>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><span className={`text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center ${i === 0 ? 'gold-gradient text-midnight-900' : isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>{i + 1}</span><span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{d.full_name || d.name}</span></div></td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{d.region}</td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${d.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{d.is_available ? t('available') : t('offline')}</span></td>
                      <td className={`px-4 py-3 font-semibold ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>{d.delivered_count}</td>
                      <td className={`px-4 py-3 font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>${d.total_earnings}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openDriverActivity(d)} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 hover:text-blue-500 transition-colors" title={language === 'ar' ? 'عرض النشاط' : 'View Activity'}>
                            <Eye size={14} />
                          </button>
                          <button onClick={() => handleDeleteDriver(d.id, d.full_name || d.name)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors" title={language === 'ar' ? 'حذف السائق' : 'Delete Driver'}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Driver Activity Modal */}
        {viewingDriver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-6 backdrop-blur-3xl ${
              isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'ar' ? 'نشاط السائق' : 'Driver Activity'} — {viewingDriver.full_name || viewingDriver.name}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{viewingDriver.region}</p>
                </div>
                <button onClick={() => setViewingDriver(null)} className={`p-2 rounded-lg ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}>✕</button>
              </div>

              {/* Time Range Filter */}
              <div className="flex gap-2 mb-6">
                {[{ key: 'daily', label: language === 'ar' ? 'يومي' : 'Daily' }, { key: 'weekly', label: language === 'ar' ? 'أسبوعي' : 'Weekly' }, { key: 'monthly', label: language === 'ar' ? 'شهري' : 'Monthly' }].map(f => (
                  <button key={f.key} onClick={() => { setDriverActivityFilter(f.key); fetchDriverActivity(viewingDriver.id, f.key); }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${driverActivityFilter === f.key ? 'gold-gradient text-midnight-900' : isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f.label}</button>
                ))}
              </div>

              {/* Activity Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: language === 'ar' ? 'التسليمات' : 'Deliveries', value: driverActivityStats.total_deliveries || 0, color: 'from-emerald-500 to-emerald-600' },
                  { label: language === 'ar' ? 'الاستلامات' : 'Pickups', value: driverActivityStats.total_pickups || 0, color: 'from-blue-500 to-blue-600' },
                  { label: language === 'ar' ? 'مرات المتاح' : 'Times Online', value: driverActivityStats.times_available || 0, color: 'from-amber-500 to-amber-600' },
                  { label: language === 'ar' ? 'الأرباح' : 'Earnings', value: `$${(driverActivityStats.earnings || 0).toLocaleString()}`, color: 'from-violet-500 to-violet-600' },
                ].map((card, i) => (
                  <div key={i} className={`rounded-xl p-4 border ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{card.label}</p>
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Activity Log */}
              <div>
                <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{language === 'ar' ? 'سجل النشاط' : 'Activity Log'}</h4>
                {driverActivity.length === 0 ? (
                  <p className={`text-center py-8 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{language === 'ar' ? 'لا يوجد نشاط في هذا الفترة' : 'No activity during this period'}</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {driverActivity.map(act => (
                      <div key={act.id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          act.action === 'delivered' ? 'bg-emerald-500' :
                          act.action === 'picked_up' ? 'bg-blue-500' :
                          act.action === 'available' ? 'bg-amber-500' :
                          act.action === 'offline' ? 'bg-gray-400' : 'bg-purple-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{act.details}</p>
                          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{act.created_at?.replace('T', ' ').slice(0, 16)}</p>
                        </div>
                        {act.total_price && (
                          <span className={`text-xs font-semibold ${isDark ? 'text-gold-400' : 'text-gold-600'}`}>${act.total_price.toFixed(2)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="animate-fade-in">
            {lowStockProducts.length === 0 ? (
              <div className={`text-center py-16 rounded-2xl ${isDark ? 'bg-white/[0.03]' : 'bg-white/70'}`}>
                <Package size={48} className={`mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{language === 'ar' ? 'جميع المنتجات متوفرة بكميات كافية' : 'All products are well-stocked'}</p>
              </div>
            ) : (
              <>
                <div className={`rounded-2xl p-4 border mb-6 flex items-center gap-3 ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                  <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
                  <p className={`text-sm font-semibold ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                    {language === 'ar'
                      ? `⚠️ تنبيه: ${lowStockProducts.length} منتج بمخزون أقل من 10 وحدات`
                      : `⚠️ Alert: ${lowStockProducts.length} product${lowStockProducts.length !== 1 ? 's' : ''} with stock below 10 units`
                    }
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lowStockProducts.map(product => (
                    <div key={product.id} className={`rounded-2xl p-5 border shadow-sm backdrop-blur-3xl ${
                      isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 backdrop-blur-md border-white/20'
                    }`}>
                      <div className="flex items-center gap-3 mb-3">
                        {product.image_url && <img src={product.image_url} alt="" className="w-12 h-12 rounded-xl object-cover" />}
                        <div>
                          <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{language === 'ar' ? product.name_ar : product.name_en}</p>
                          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{product.brand}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-amber-500" />
                        <span className="text-sm font-bold text-amber-500">{language === 'ar' ? `متبقي ${product.stock} فقط` : `Only ${product.stock} left`}</span>
                      </div>
                      <div className={`mt-2 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                        <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" style={{ width: `${Math.min(product.stock * 5, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => { setShowAddProduct(true); setNewProduct({ ...defaultProduct }); }} className="flex items-center gap-2 px-5 py-2.5 gold-gradient text-midnight-900 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all">
                <Plus size={16} /> {t('addNewProduct')}
              </button>
              <div className="relative flex-1 max-w-sm">
                <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)}
                  placeholder={language === 'ar' ? 'بحث في المنتجات...' : 'Search products...'}
                  className={`w-full pl-4 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-500' : 'bg-white border border-gray-200'
                  }`} />
              </div>
              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {language === 'ar' ? `${filteredProducts.length} منتج` : `${filteredProducts.length} products`}
              </span>
            </div>

            {showAddProduct && (
              <div className={`rounded-2xl p-6 border mb-6 backdrop-blur-3xl ${
                isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 backdrop-blur-md border-white/20'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('addNewProduct')}</h3>
                  <button onClick={() => setShowAddProduct(false)} className={`p-1 rounded-lg ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}><X size={18} /></button>
                </div>
                <ProductFormFields data={newProduct} setData={setNewProduct} isEdit={false} isDark={isDark} language={language} t={t} inputClass={inputClass} />
                <button onClick={handleCreateProduct} className="mt-4 px-6 py-2.5 gold-gradient text-midnight-900 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all">{t('createProduct')}</button>
              </div>
            )}

            {/* Edit Product Modal */}
            {editingProduct && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-6 backdrop-blur-3xl ${
                  isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'ar' ? 'تعديل المنتج' : 'Edit Product'}
                    </h3>
                    <button onClick={() => { setEditingProduct(null); setEditProduct({ ...defaultProduct }); }} className={`p-2 rounded-lg ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}>✕</button>
                  </div>
                  <ProductFormFields data={editProduct} setData={setEditProduct} isEdit={true} isDark={isDark} language={language} t={t} inputClass={inputClass} />
                  <div className="flex gap-3 mt-4">
                    <button onClick={handleEditProduct} className="px-6 py-2.5 gold-gradient text-midnight-900 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all">
                      {language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
                    </button>
                    <button onClick={() => { setEditingProduct(null); setEditProduct({ ...defaultProduct }); }}
                      className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${isDark ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Product List Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div key={product.id} className={`rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md backdrop-blur-3xl ${
                  isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 backdrop-blur-md border-white/20'
                }`}>
                  {product.image_url ? (
                    <img src={product.image_url} alt="" className="w-full h-36 object-cover" />
                  ) : (
                    <div className={`w-full h-36 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <Package size={32} className={isDark ? 'text-gray-700' : 'text-gray-300'} />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{language === 'ar' ? product.name_ar : product.name_en}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{product.brand} · {product.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      {product.old_price && product.old_price > product.price && (
                        <span className={`text-xs line-through ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>${product.old_price.toFixed(2)}</span>
                      )}
                      <span className={`text-lg font-bold ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>${product.price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        product.stock < 10 ? 'bg-amber-100 text-amber-700' : isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {language === 'ar' ? `المخزون: ${product.stock}` : `Stock: ${product.stock}`}
                      </span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal(product)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:bg-white/10 hover:text-gold-400' : 'text-gray-500 hover:bg-gray-100 hover:text-gold-600'}`} title={language === 'ar' ? 'تعديل' : 'Edit'}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors" title={language === 'ar' ? 'حذف' : 'Delete'}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
