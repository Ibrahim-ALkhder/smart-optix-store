import React, { useState, useEffect, useCallback } from 'react';
import { Truck, Phone, MapPin, MessageSquare, Check, Package, LogOut } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function DriverPortal() {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [toggling, setToggling] = useState(false);

  const headers = { Authorization: `Bearer ${localStorage.getItem('smartoptix_token')}`, 'Content-Type': 'application/json' };

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, ordersRes] = await Promise.all([
        fetch('/api/drivers/status', { headers }),
        fetch('/api/drivers/my-orders', { headers }),
      ]);
      if (statusRes.ok) setStatus((await statusRes.json()).status);
      if (ordersRes.ok) setOrders((await ordersRes.json()).orders || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const toggleAvailability = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const newAvail = status?.is_available ? 0 : 1;
      const res = await fetch('/api/drivers/availability', {
        method: 'PUT', headers,
        body: JSON.stringify({ is_available: newAvail })
      });
      if (res.ok) {
        setStatus(prev => ({ ...prev, is_available: newAvail }));
      }
    } catch (err) { console.error('Toggle error:', err); }
    finally { setToggling(false); }
  };

  const updateDeliveryStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/drivers/${orderId}/delivery-status`, {
        method: 'PUT', headers,
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
    finally { setUpdating(null); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <div className="w-10 h-10 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className={`min-h-screen pt-20 pb-16 ${isDark ? 'bg-midnight-900' : 'bg-gradient-to-b from-gray-50/50 to-white'}`}>
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('driverDashboard')}</h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user?.name}</p>
            </div>
            <button onClick={handleLogout} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}>
              <LogOut size={20} />
            </button>
          </div>

          {/* Availability Toggle */}
          <div className={`rounded-2xl p-4 border backdrop-blur-3xl ${
            isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 backdrop-blur-md border-white/20'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${status?.is_available ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {status?.is_available ? t('available') : t('offline')}
                </span>
              </div>
              <button onClick={toggleAvailability} disabled={toggling}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${status?.is_available ? 'bg-emerald-500' : isDark ? 'bg-white/20' : 'bg-gray-300'} ${toggling ? 'opacity-50' : ''}`}>
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${status?.is_available ? 'left-7' : 'left-0.5'}`}></div>
              </button>
            </div>
            <div className={`mt-3 grid grid-cols-2 gap-3 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <div>
                <p className="text-xs">{t('activeQueue')}</p>
                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{status?.active_orders || 0}</p>
              </div>
              <div>
                <p className="text-xs">{t('completedDeliveries')}</p>
                <p className={`text-lg font-bold text-gold-500`}>{status?.completed_deliveries || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Queue */}
        <div>
          <h2 className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('myDeliveries')}</h2>
          {orders.length === 0 ? (
            <div className={`text-center py-12 rounded-2xl ${isDark ? 'bg-white/[0.03]' : 'bg-white/70'}`}>
              <Package size={40} className={`mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('noAssignedOrders')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className={`rounded-2xl p-4 border shadow-sm backdrop-blur-3xl ${
                  isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 backdrop-blur-md border-white/20'
                }`}>
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {order.image_url && <img src={order.image_url} alt="" className="w-12 h-12 rounded-xl object-cover" />}
                      <div>
                        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{language === 'ar' ? order.name_ar : order.name_en}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>#{order.id} · {order.brand}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>${order.total_price?.toFixed(2)}</span>
                  </div>

                  {/* Client Details */}
                  <div className={`rounded-xl p-3 mb-3 space-y-2 ${isDark ? 'bg-white/5' : 'bg-gray-50/80'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isDark ? 'bg-gold-500/20' : 'bg-primary-100'}`}>
                        <span className={`text-xs font-bold ${isDark ? 'text-gold-400' : 'text-primary-700'}`}>{order.client_name?.charAt(0)}</span>
                      </div>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('clientName')}: {order.client_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={12} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('clientPhone')}: {order.client_phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin size={12} className={`mt-0.5 flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('clientAddress')}: {order.shipping_address}</span>
                    </div>
                    {order.customer_comments && (
                      <div className="flex items-start gap-2">
                        <MessageSquare size={12} className={`mt-0.5 flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={`text-sm italic ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{t('customerComments')}: {order.customer_comments}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {order.status === 'ready_for_delivery' && (
                      <button onClick={() => updateDeliveryStatus(order.id, 'out_for_delivery')} disabled={updating === order.id}
                        className="flex-1 py-2.5 gold-gradient text-midnight-900 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50">
                        {updating === order.id ? '...' : <><Truck size={14} /> {t('markOutForDelivery')}</>}
                      </button>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <button onClick={() => updateDeliveryStatus(order.id, 'delivered')} disabled={updating === order.id}
                        className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:bg-emerald-600 disabled:opacity-50">
                        {updating === order.id ? '...' : <><Check size={14} /> {t('markDelivered')}</>}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
