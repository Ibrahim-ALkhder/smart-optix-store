import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function BookAppointment() {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [doctors, setDoctors] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [notes, setNotes] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const headers = { Authorization: `Bearer ${localStorage.getItem('smartoptix_token')}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    fetch('/api/appointments/doctors')
      .then(res => res.json())
      .then(data => { setDoctors(data.doctors || []); setBranches(data.branches || []); })
      .catch(console.error);
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments/my-appointments', { headers });
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetch(`/api/appointments/slots?doctor_name=${encodeURIComponent(selectedDoctor)}&date=${selectedDate}`)
        .then(res => res.json())
        .then(data => {
          const slots = data.availableSlots || [];
          setAvailableSlots(slots);
        })
        .catch(console.error);
    }
  }, [selectedDoctor, selectedDate]);

  const filteredDoctors = selectedBranch ? doctors.filter(d => d.branch === selectedBranch) : doctors;

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleDateClick = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (date >= today) {
      const dateStr = date.toISOString().split('T')[0];
      setSelectedDate(dateStr);
      setSelectedSlot('');
      // Fluidly advance to the next step
      setTimeout(() => setStep(3), 200);
    }
  };

  const handleBook = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot || !selectedBranch) return;
    setLoading(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST', headers,
        body: JSON.stringify({ doctor_name: selectedDoctor, branch: selectedBranch, appointment_date: selectedDate, time_slot: selectedSlot, notes })
      });
      if (res.ok) {
        setSuccess(true);
        fetchAppointments();
        setTimeout(() => { setSuccess(false); setStep(0); setSelectedBranch(''); setSelectedDoctor(''); setSelectedDate(''); setSelectedSlot(''); setNotes(''); }, 3000);
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const months = language === 'ar'
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekdays = language === 'ar' ? [' أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const stepLabels = [t('selectBranch'), t('selectDoctor'), t('selectDate'), t('selectTime'), t('confirmBooking')];

  const statusCls = (s) => {
    const colors = { confirmed: isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700', pending: isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700', completed: isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700', cancelled: isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700' };
    return colors[s] || (isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-700');
  };

  return (
    <div className={`min-h-screen pt-20 pb-16 ${isDark ? 'bg-midnight-900' : 'bg-gradient-to-b from-gray-50/50 to-white'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 animate-fade-in">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('bookAppointment')}</h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{language === 'ar' ? 'احجز موعدك مع أفضل أطباء العيون' : 'Schedule your eye exam with our expert doctors'}</p>
        </div>

        {success && (
          <div className={`backdrop-blur-3xl border rounded-2xl p-8 text-center mb-8 animate-fade-in ${
            isDark ? 'bg-[#0B0B0C]/95 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><Check size={32} className="text-emerald-600" /></div>
            <h3 className="text-xl font-bold text-emerald-800 mb-2">{language === 'ar' ? 'تم حجز الموعد بنجاح!' : 'Appointment Booked Successfully!'}</h3>
            <p className="text-emerald-600 text-sm">{language === 'ar' ? 'سنتواصل معك قريباً لتأكيد الموعد' : 'We will contact you shortly to confirm'}</p>
          </div>
        )}

        {!success && (
          <>
            <div className="flex items-center justify-center mb-10 gap-1 sm:gap-2 overflow-x-auto">
              {stepLabels.map((label, i) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center min-w-0">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 ${step >= i ? 'gold-gradient text-white shadow-lg' : isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</div>
                    <span className={`text-xs mt-1 text-center hidden sm:block max-w-[80px] truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{label}</span>
                  </div>
                  {i < 4 && <div className={`w-8 sm:w-16 h-1 rounded-full transition-all ${step > i ? 'bg-gold-500' : isDark ? 'bg-white/10' : 'bg-gray-200'}`} />}
                </React.Fragment>
              ))}
            </div>

            <div className={`rounded-3xl p-6 sm:p-8 border shadow-sm animate-fade-in backdrop-blur-3xl ${
              isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 backdrop-blur-md border-white/20'
            }`}>

              {/* Step 0: Select Branch */}
              {step === 0 && (
                <div>
                  <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('selectBranch')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {branches.map(branch => (
                      <button key={branch.id} onClick={() => { setSelectedBranch(branch.name_en); setStep(1); }}
                        className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 ${selectedBranch === branch.name_en ? 'border-gold-500 bg-gold-500/10 shadow-lg' : isDark ? 'border-white/10 hover:border-gold-500/30 hover:shadow-md' : 'border-gray-200 hover:border-primary-300 hover:shadow-md'}`}>
                        <MapPin size={24} className={selectedBranch === branch.name_en ? 'text-gold-500' : isDark ? 'text-gray-500' : 'text-gray-400'} />
                        <p className={`font-semibold mt-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{language === 'ar' ? branch.name_ar : branch.name_en}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Select Doctor */}
              {step === 1 && (
                <div>
                  <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('selectDoctor')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredDoctors.map(doc => (
                      <button key={doc.id} onClick={() => { setSelectedDoctor(doc.name_en); setStep(2); }}
                        className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 ${selectedDoctor === doc.name_en ? 'border-gold-500 bg-gold-500/10 shadow-lg' : isDark ? 'border-white/10 hover:border-gold-500/30 hover:shadow-md' : 'border-gray-200 hover:border-primary-300 hover:shadow-md'}`}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 gold-gradient"><User size={20} className="text-white" /></div>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{language === 'ar' ? doc.name_ar : doc.name_en}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{language === 'ar' ? doc.specialty_ar : doc.specialty_en}</p>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setStep(0)} className={`mt-4 text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>← {t('back')}</button>
                </div>
              )}

              {/* Step 2: Select Date */}
              {step === 2 && (
                <div>
                  <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('selectDate')}</h3>
                  <div className={`rounded-2xl p-4 shadow-sm border backdrop-blur-3xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-700'}`}><ChevronLeft size={20} /></button>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{months[currentMonth.getMonth()]} {currentMonth.getFullYear()}</p>
                      <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-700'}`}><ChevronRight size={20} /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {weekdays.map(d => <div key={d} className={`text-center text-xs font-medium py-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                        const isPast = date < today;
                        const dateStr = date.toISOString().split('T')[0];
                        const isSelected = selectedDate === dateStr;
                        const isWeekend = date.getDay() === 5 || date.getDay() === 6;
                        return (
                          <button key={day} onClick={() => !isPast && !isWeekend && handleDateClick(day)} disabled={isPast || isWeekend}
                            className={`aspect-square rounded-xl text-sm font-medium transition-all ${isSelected ? 'gold-gradient text-midnight-900 shadow-lg' : isPast || isWeekend ? isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed' : isDark ? 'text-gray-300 hover:bg-gold-500/20' : 'text-gray-700 hover:bg-primary-100'}`}>{day}</button>
                        );
                      })}
                    </div>
                  </div>
                  <button onClick={() => setStep(1)} className={`mt-4 text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>← {t('back')}</button>
                </div>
              )}

              {/* Step 3: Select Time */}
              {step === 3 && (
                <div>
                  <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('selectTime')}</h3>
                  {availableSlots.length === 0 ? (
                    <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {selectedDate ? (language === 'ar' ? 'لا توجد مواعيد متاحة لهذا التاريخ' : 'No slots available for this date') : t('selectDate')}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {availableSlots.map(slot => (
                        <button key={slot} onClick={() => { setSelectedSlot(slot); setStep(4); }}
                          className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${selectedSlot === slot ? 'border-gold-500 bg-gold-500/10 text-gold-400' : isDark ? 'border-white/10 hover:border-gold-500/30 text-gray-300' : 'border-gray-200 hover:border-primary-300 text-gray-700'}`}>
                          <Clock size={14} className="inline mr-1.5" />{slot}
                        </button>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setStep(2)} className={`mt-4 text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>← {t('back')}</button>
                </div>
              )}

              {/* Step 4: Confirm */}
              {step === 4 && (
                <div>
                  <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('confirmBooking')}</h3>
                  <div className="space-y-3 mb-6">
                    {[
                      { icon: MapPin, label: t('selectBranch'), value: selectedBranch },
                      { icon: User, label: t('selectDoctor'), value: selectedDoctor },
                      { icon: Calendar, label: t('selectDate'), value: selectedDate },
                      { icon: Clock, label: t('selectTime'), value: selectedSlot },
                    ].map(item => (
                      <div key={item.label} className={`flex items-center gap-3 p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50/80'}`}>
                        <item.icon size={18} className="text-gold-500" />
                        <div><p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{item.label}</p><p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}</p></div>
                      </div>
                    ))}
                  </div>
                  <div className="mb-6">
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('appointmentNotes')}</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                      placeholder={language === 'ar' ? 'أي ملاحظات إضافية...' : 'Any additional notes...'}
                      className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all resize-none backdrop-blur-3xl ${
                        isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-500' : 'bg-white/80 border border-gray-200'
                      }`} rows={3} />
                  </div>
                  <div className="flex justify-between">
                    <button onClick={() => setStep(3)} className={`text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>← {t('back')}</button>
                    <button onClick={handleBook} disabled={loading || !user}
                      className="px-8 py-3 gold-gradient text-midnight-900 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 text-sm">
                      {loading ? '...' : user ? t('confirmBooking') : t('login')}
                    </button>
                  </div>
                  {!user && <p className={`text-center text-sm mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{language === 'ar' ? 'الرجاء تسجيل الدخول أولاً' : 'Please login first to book an appointment'}</p>}
                </div>
              )}
            </div>
          </>
        )}

        {appointments.length > 0 && !success && (
          <div className="mt-10">
            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('myAppointments')}</h3>
            <div className="space-y-3">
              {appointments.map(apt => (
                <div key={apt.id} className={`rounded-xl p-4 border shadow-sm flex items-center justify-between backdrop-blur-3xl ${
                  isDark ? 'bg-[#0B0B0C]/95 border-white/10' : 'bg-white/95 backdrop-blur-md border-white/20'
                }`}>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{apt.doctor_name}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{apt.branch}</p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{apt.appointment_date} · {apt.time_slot}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusCls(apt.status)}`}>{t(apt.status + 'Appointment') || apt.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
