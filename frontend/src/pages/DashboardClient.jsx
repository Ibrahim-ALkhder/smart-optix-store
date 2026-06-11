import React, { useState, useEffect, useCallback } from 'react';
import { Package, FileText, User, Clock, Truck, CheckCircle, XCircle, MapPin, Glasses, Save, Ban, Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const statusIcons = { pending: Clock, confirmed: CheckCircle, preparing: Package, ready_for_delivery: Package, out_for_delivery: Truck, delivered: CheckCircle, cancelled: XCircle };
const statusColors = {
  pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700', preparing: 'bg-indigo-100 text-indigo-700',
  ready_for_delivery: 'bg-cyan-100 text-cyan-700', out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700',
};
const statusColorsDark = {
  pending: 'bg-amber-500/20 text-amber-400', confirmed: 'bg-blue-500/20 text-blue-400', preparing: 'bg-indigo-500/20 text-indigo-400',
  ready_for_delivery: 'bg-cyan-500/20 text-cyan-400', out_for_delivery: 'bg-purple-500/20 text-purple-400',
  delivered: 'bg-emerald-500/20 text-emerald-400', cancelled: 'bg-red-500/20 text-red-400',
};

export default function DashboardClient() {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [orderPrescriptions, setOrderPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile editing state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancellingApt, setCancellingApt] = useState(null);

  // Password change state
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.full_name || user.name || '');
      setProfilePhone(user.phone || '');
      setProfileEmail(user.email || '');
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('smartoptix_token');
      const headers = { Authorization: `Bearer ${token}` };
      const [ordersRes, appointmentsRes, prescriptionsRes] = await Promise.all([
        fetch('/api/orders/my-orders', { headers }),
        fetch('/api/appointments/my-appointments', { headers }),
        fetch('/api/prescriptions', { headers }),
      ]);
      setOrders((await ordersRes.json()).orders || []);
      setAppointments((await appointmentsRes.json()).appointments || []);
      const rxData = await prescriptionsRes.json();
      setPrescriptions(rxData.prescriptions || []);
      setOrderPrescriptions(rxData.orderPrescriptions || []);
    } catch (err) { console.error('Dashboard fetch error:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Cancel order handler
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من إلغاء هذا الطلب؟' : 'Are you sure you want to cancel this order?')) return;
    setCancellingOrder(orderId);
    try {
      const token = localStorage.getItem('smartoptix_token');
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to cancel order');
      }
    } catch (err) { console.error('Cancel order error:', err); }
    finally { setCancellingOrder(null); }
  };

  // Cancel appointment handler
  const handleCancelAppointment = async (apptId) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من إلغاء هذا الموعد؟' : 'Are you sure you want to cancel this appointment?')) return;
    setCancellingApt(apptId);
    try {
      const token = localStorage.getItem('smartoptix_token');
      const res = await fetch(`/api/appointments/${apptId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to cancel appointment');
      }
    } catch (err) { console.error('Cancel appointment error:', err); }
    finally { setCancellingApt(null); }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const token = localStorage.getItem('smartoptix_token');
      // Save name and phone
      const profileRes = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: profileName, phone: profilePhone })
      });
      // Save email if changed
      if (profileEmail !== user?.email) {
        const emailRes = await fetch('/api/auth/email', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ email: profileEmail })
        });
        if (!emailRes.ok) {
          const data = await emailRes.json();
          alert(data.error || 'Failed to update email');
          setSavingProfile(false);
          return;
        }
        // Re-issue JWT with new email
        const emailData = await emailRes.json();
        if (emailData.token) {
          await refreshUser(emailData.token);
        }
      }
      if (profileRes.ok) {
        setEditingProfile(false);
        await refreshUser();
      }
    } catch (err) { console.error('Save profile error:', err); }
    finally { setSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      alert(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill in all fields');
      return;
    }
    if (newPassword.length < 6) {
      alert(language === 'ar' ? 'يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل' : 'New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert(language === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      const token = localStorage.getItem('smartoptix_token');
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (res.ok) {
        setChangingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        alert(language === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to change password');
      }
    } catch (err) { console.error('Change password error:', err); }
    finally { setSavingPassword(false); }
  };

  const tabs = [
    { id: 'orders', label: t('orderHistory'), icon: Package },
    { id: 'prescriptions', label: t('prescriptions'), icon: Glasses },
    { id: 'appointments', label: t('appointments'), icon: Clock },
    { id: 'profile', label: t('profileSettings'), icon: User },
  ];

  const statusProgress = (status) => {
    const steps = ['pending', 'confirmed', 'preparing', 'ready_for_delivery', 'out_for_delivery', 'delivered'];
    const idx = steps.indexOf(status);
    return status === 'cancelled' ? -1 : idx;
  };

  const statusCls = (s) => isDark ? statusColorsDark[s] || 'bg-gray-500/20 text-gray-400' : statusColors[s] || 'bg-gray-100 text-gray-700';

  const inputClass = `w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all backdrop-blur-3xl ${
    isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-500' : 'bg-white/80 border border-gray-200'
  }`;

  return (
    <div className={`min-h-screen pt-20 pb-16 ${isDark ? 'bg-midnight-900' : 'bg-gradient-to-b from-gray-50/50 to-white'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 animate-fade-in">
          <h1 className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('dashboardTitle')}</h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{language === 'ar' ? `مرحباً ${user?.name}` : `Welcome back, ${user?.name}`}</p>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id ? 'gold-gradient text-midnight-900 shadow-md' : isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10' : 'bg-white/70 backdrop-blur-md text-gray-600 hover:bg-white border border-gray-200'
                }`}>
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className={`rounded-2xl h-32 animate-pulse ${isDark ? 'bg-white/5' : 'bg-white/50'}`} />)}</div>
        ) : (
          <>
            {activeTab === 'orders' && (
              <div className="space-y-4 animate-fade-in">
                {orders.length === 0 ? (
                  <div className={`text-center py-16 rounded-2xl ${isDark ? 'bg-white/[0.03]' : 'bg-white/70'}`}>
                    <Package size={48} className={`mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('noOrdersYet')}</p>
                  </div>
                ) : orders.map(order => {
                  const progress = statusProgress(order.status);
                  return (
                    <div key={order.id} className={`rounded-2xl p-6 border shadow-sm backdrop-blur-3xl ${
                      isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 backdrop-blur-md border-white/20'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          {order.image_url && <img src={order.image_url} alt="" className="w-16 h-16 rounded-xl object-cover" />}
                          <div>
                            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{language === 'ar' ? order.name_ar : order.name_en}</p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('orderNumber')}{order.id} · {order.brand}</p>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{order.created_at?.split('T')[0]}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusCls(order.status)}`}>
                            {React.createElement(statusIcons[order.status] || Package, { size: 12 })} {t(order.status)}
                          </span>
                          <p className={`text-lg font-bold mt-1 ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>${order.total_price?.toFixed(2)}</p>
                        </div>
                      </div>
                      {progress >= 0 && (
                        <div className="mt-4">
                          <div className={`flex justify-between text-xs mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {[t('pending'), t('confirmed'), t('preparing'), t('ready_for_delivery'), t('out_for_delivery'), t('delivered')].map((label, i) => (
                              <span key={i} className={i <= progress ? 'text-gold-500 font-medium' : ''}>{label}</span>
                            ))}
                          </div>
                          <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                            <div className="h-full gold-gradient rounded-full transition-all duration-700" style={{ width: `${(progress / 5) * 100}%` }} />
                          </div>
                        </div>
                      )}
                      {order.shipping_address && (
                        <div className="flex items-center gap-2 mt-3 text-sm"><MapPin size={14} className={isDark ? 'text-gray-500' : 'text-gray-400'} /> <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{order.shipping_address}</span></div>
                      )}
                      {/* Cancel button */}
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingOrder === order.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-all disabled:opacity-50"
                          >
                            <Ban size={14} /> {cancellingOrder === order.id ? '...' : (language === 'ar' ? 'إلغاء الطلب' : 'Cancel Order')}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="space-y-4 animate-fade-in">
                {appointments.length === 0 ? (
                  <div className={`text-center py-16 rounded-2xl ${isDark ? 'bg-white/[0.03]' : 'bg-white/70'}`}>
                    <Clock size={48} className={`mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('noAppointments')}</p>
                  </div>
                ) : appointments.map(apt => (
                  <div key={apt.id} className={`rounded-2xl p-6 border shadow-sm backdrop-blur-3xl ${
                    isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 backdrop-blur-md border-white/20'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{apt.doctor_name}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{apt.branch}</p>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{apt.appointment_date} · {apt.time_slot}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusCls(apt.status)}`}>
                        {t(apt.status + 'Appointment') || apt.status}
                      </span>
                    </div>
                    {/* Cancel button for appointments */}
                    {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleCancelAppointment(apt.id)}
                          disabled={cancellingApt === apt.id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-all disabled:opacity-50"
                        >
                          <Ban size={14} /> {cancellingApt === apt.id ? '...' : (language === 'ar' ? 'إلغاء الموعد' : 'Cancel Appointment')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'prescriptions' && (
              <div className="space-y-6 animate-fade-in">
                {/* Section 1: Order Prescriptions */}
                {orderPrescriptions.length > 0 && (
                  <div>
                    <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <Package size={18} className="text-gold-500" />
                      {language === 'ar' ? 'وصفات الطلبات' : 'Order Prescriptions'}
                    </h3>
                    <div className="space-y-4">
                      {orderPrescriptions.map((ord, idx) => {
                        const rx = ord.prescription_data || {};
                        const hasRx = (rx.right_eye || rx.left_eye) && (rx.right_eye?.sph || rx.left_eye?.sph);
                        return (
                          <div key={`order-${idx}`} className={`rounded-2xl p-6 border shadow-sm backdrop-blur-3xl ${
                            isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 backdrop-blur-md border-white/20'
                          }`}>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                {ord.image_url && <img src={ord.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                                <div>
                                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{language === 'ar' ? ord.product_name_ar : ord.product_name_en}</p>
                                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('orderNumber')}{ord.order_id} · {ord.order_date?.split('T')[0]}</p>
                                </div>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                ord.order_status === 'delivered' ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700') : (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700')
                              }`}>{t(ord.order_status)}</span>
                            </div>
                            {hasRx ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className={`p-4 rounded-xl ${isDark ? 'bg-gold-500/10' : 'bg-primary-50/50'}`}>
                                  <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gold-400' : 'text-primary-700'}`}>{t('rightEye')}</p>
                                  <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div><span className="text-gray-500">SPH:</span> <span className={`font-medium ${isDark ? 'text-white' : ''}`}>{rx.right_eye?.sph || '—'}</span></div>
                                    <div><span className="text-gray-500">CYL:</span> <span className={`font-medium ${isDark ? 'text-white' : ''}`}>{rx.right_eye?.cyl || '—'}</span></div>
                                    <div><span className="text-gray-500">AXIS:</span> <span className={`font-medium ${isDark ? 'text-white' : ''}`}>{rx.right_eye?.axis || '—'}</span></div>
                                  </div>
                                </div>
                                <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gold-50/50'}`}>
                                  <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gold-700'}`}>{t('leftEye')}</p>
                                  <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div><span className="text-gray-500">SPH:</span> <span className={`font-medium ${isDark ? 'text-white' : ''}`}>{rx.left_eye?.sph || '—'}</span></div>
                                    <div><span className="text-gray-500">CYL:</span> <span className={`font-medium ${isDark ? 'text-white' : ''}`}>{rx.left_eye?.cyl || '—'}</span></div>
                                    <div><span className="text-gray-500">AXIS:</span> <span className={`font-medium ${isDark ? 'text-white' : ''}`}>{rx.left_eye?.axis || '—'}</span></div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{language === 'ar' ? 'نظارة أنيقة بدون وصفة' : 'Fashion only — no prescription'}</p>
                            )}
                            {rx.pd && <div className="mt-3 text-sm"><span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>PD:</span> <span className={isDark ? 'text-white' : ''}>{rx.pd}</span></div>}
                            {ord.lens_upgrade_fee > 0 && (
                              <div className="mt-2 text-xs"><span className={isDark ? 'text-gray-500' : 'text-gray-400'}>{t('lensUpgradeFee')}: </span><span className={isDark ? 'text-gold-400' : 'text-gold-600'}>${ord.lens_upgrade_fee}</span></div>
                            )}
                            {rx.prescription_photo && (
                              <div className="mt-3">
                                <a href={rx.prescription_photo} target="_blank" rel="noopener noreferrer">
                                  <img src={rx.prescription_photo} alt="Prescription"
                                    className="w-full max-w-xs rounded-xl border object-cover max-h-48" />
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section 2: Saved Prescriptions */}
                {prescriptions.length > 0 && (
                  <div>
                    <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <Glasses size={18} className="text-gold-500" />
                      {language === 'ar' ? 'وصفات محفوظة' : 'Saved Prescriptions'}
                    </h3>
                    <div className="space-y-4">
                      {prescriptions.map(rx => (
                        <div key={rx.id} className={`rounded-2xl p-6 border shadow-sm backdrop-blur-3xl ${
                          isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 backdrop-blur-md border-white/20'
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{language === 'ar' ? 'وصفة طبية' : 'Prescription'} #{rx.id}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{rx.created_at?.split('T')[0]}</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl ${isDark ? 'bg-gold-500/10' : 'bg-primary-50/50'}`}>
                              <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gold-400' : 'text-primary-700'}`}>{t('rightEye')}</p>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div><span className="text-gray-500">SPH:</span> <span className={`font-medium ${isDark ? 'text-white' : ''}`}>{rx.right_eye_sph || '—'}</span></div>
                                <div><span className="text-gray-500">CYL:</span> <span className={`font-medium ${isDark ? 'text-white' : ''}`}>{rx.right_eye_cyl || '—'}</span></div>
                                <div><span className="text-gray-500">AXIS:</span> <span className={`font-medium ${isDark ? 'text-white' : ''}`}>{rx.right_eye_axis || '—'}</span></div>
                              </div>
                            </div>
                            <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gold-50/50'}`}>
                              <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gold-700'}`}>{t('leftEye')}</p>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div><span className="text-gray-500">SPH:</span> <span className={`font-medium ${isDark ? 'text-white' : ''}`}>{rx.left_eye_sph || '—'}</span></div>
                                <div><span className="text-gray-500">CYL:</span> <span className={`font-medium ${isDark ? 'text-white' : ''}`}>{rx.left_eye_cyl || '—'}</span></div>
                                <div><span className="text-gray-500">AXIS:</span> <span className={`font-medium ${isDark ? 'text-white' : ''}`}>{rx.left_eye_axis || '—'}</span></div>
                              </div>
                            </div>
                          </div>
                          {rx.pd && <div className="mt-3 text-sm"><span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>PD:</span> <span className={isDark ? 'text-white' : ''}>{rx.pd}</span></div>}
                          {rx.notes && <p className={`mt-2 text-sm italic ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{rx.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {prescriptions.length === 0 && orderPrescriptions.length === 0 && (
                  <div className={`text-center py-16 rounded-2xl ${isDark ? 'bg-white/[0.03]' : 'bg-white/70'}`}>
                    <Glasses size={48} className={`mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{language === 'ar' ? 'لا توجد وصفات طبية' : 'No prescriptions found'}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className={`rounded-2xl p-6 border shadow-sm animate-fade-in backdrop-blur-3xl ${
                isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 backdrop-blur-md border-white/20'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('profileSettings')}</h3>
                  {!editingProfile ? (
                    <button onClick={() => setEditingProfile(true)} className="px-4 py-2 gold-gradient text-midnight-900 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all">
                      {language === 'ar' ? 'تعديل' : 'Edit'}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingProfile(false); setProfileName(user?.full_name || user?.name || ''); setProfilePhone(user?.phone || ''); setProfileEmail(user?.email || ''); }}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isDark ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button onClick={handleSaveProfile} disabled={savingProfile}
                        className="px-4 py-2 gold-gradient text-midnight-900 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
                        <Save size={14} /> {savingProfile ? '...' : language === 'ar' ? 'حفظ' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email - Editable */}
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{t('email')}</label>
                    {editingProfile ? (
                      <input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className={inputClass} />
                    ) : (
                      <p className={`px-4 py-3 rounded-xl text-sm ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white/80 border border-gray-200 text-gray-900'}`}>{user?.email}</p>
                    )}
                  </div>
                  {/* Full Name - Editable */}
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{t('name')}</label>
                    {editingProfile ? (
                      <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className={inputClass} />
                    ) : (
                      <p className={`px-4 py-3 rounded-xl text-sm ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white/80 border border-gray-200 text-gray-900'}`}>{user?.full_name || user?.name}</p>
                    )}
                  </div>
                  {/* Phone - Editable */}
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{t('phone')}</label>
                    {editingProfile ? (
                      <input type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} className={inputClass} />
                    ) : (
                      <p className={`px-4 py-3 rounded-xl text-sm ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white/80 border border-gray-200 text-gray-900'}`}>{user?.phone || '—'}</p>
                    )}
                  </div>
                </div>

                {/* Password Change Section */}
                <div className={`mt-6 pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Lock size={18} className="text-gold-500" />
                      <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</h4>
                    </div>
                    {!changingPassword ? (
                      <button onClick={() => setChangingPassword(true)} className="px-4 py-2 gold-gradient text-midnight-900 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all">
                        {language === 'ar' ? 'تغيير' : 'Change'}
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => { setChangingPassword(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isDark ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button onClick={handleChangePassword} disabled={savingPassword}
                          className="px-4 py-2 gold-gradient text-midnight-900 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
                          <Save size={14} /> {savingPassword ? '...' : language === 'ar' ? 'حفظ' : 'Save'}
                        </button>
                      </div>
                    )}
                  </div>
                  {changingPassword && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}</label>
                        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
