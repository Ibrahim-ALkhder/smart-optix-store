import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    // Navbar
    home: 'Home', catalog: 'Catalog', appointments: 'Appointments',
    faceGuide: 'Face Guide', cart: 'Cart', login: 'Login', register: 'Register',
    logout: 'Logout', dashboard: 'Dashboard', myOrders: 'My Orders',
    myPrescriptions: 'My Prescriptions', smartOptix: 'Smart Optix',
    adminDashboard: 'Admin Dashboard', driverPortal: 'Driver Portal',

    // Home
    heroTitle: 'Premium Eyewear', heroSubtitle: 'Discover luxury frames that define your style',
    heroCTA: 'Explore Collection', featuredProducts: 'Featured Products', viewAll: 'View All',
    whyChooseUs: 'Why Choose Us',
    qualityTitle: 'Premium Quality', qualityDesc: 'Handcrafted frames from the world\'s finest materials',
    styleTitle: 'Timeless Style', styleDesc: 'Curated collections that transcend trends',
    serviceTitle: 'Expert Service', serviceDesc: 'Professional eye care from certified specialists',
    guaranteeTitle: 'Satisfaction Guaranteed', guaranteeDesc: '100% authenticity and quality assurance',
    aboutUs: 'About Us', aboutUsDesc: 'Smart Optix is a premium eyewear destination, combining cutting-edge technology with timeless elegance. Since 2018, we\'ve been serving thousands of satisfied customers across Saudi Arabia.',
    aboutUsMission: 'Our mission is to provide premium eyewear that combines style, comfort, and superior optical quality.',
    customerReviews: 'What Our Customers Say', testimonials: 'Testimonials',
    testimonial1Name: 'Sarah Al-Mutairi', testimonial1Text: 'Absolutely love my new frames! The quality is exceptional and the fitting was perfect.',
    testimonial2Name: 'Mohammed Al-Fahad', testimonial2Text: 'Best optical store experience. Professional staff and beautiful collection.',
    testimonial3Name: 'Noura Al-Harbi', testimonial3Text: 'The prescription glasses are top-notch. Crystal clear vision with stunning design.',
    testimonial4Name: 'Ahmed Al-Saeed', testimonial4Text: 'Outstanding customer service and premium quality products. Highly recommended!',
    testimonial5Name: 'Fatima Al-Rashid', testimonial5Text: 'I\'ve been a loyal customer for years. Their collections never disappoint.',

    // Catalog
    catalogTitle: 'Our Collection', catalogSubtitle: 'Find your perfect frames',
    filterBrand: 'Brand', filterMaterial: 'Material', filterShape: 'Shape',
    filterCategory: 'Category', allBrands: 'All Brands', allMaterials: 'All Materials',
    allShapes: 'All Shapes', allCategories: 'All Categories',
    addToCart: 'Add to Cart', viewDetails: 'View Details',
    sunglasses: 'Sunglasses', prescription: 'Prescription', protection: 'Protection Glasses', contactLenses: 'Contact Lenses',
    noProducts: 'No products found matching your criteria',
    specifications: 'Specifications', frameDetails: 'Frame Details',
    lensUpgradeFee: 'Lens Upgrade Fee', shippingFee: 'Shipping Fee',
    choosePrescription: 'Choose Prescription Option',

    // Product Details
    backToCatalog: 'Back to Catalog', relatedProducts: 'Related Products',
    materialLabel: 'Material', shapeLabel: 'Shape', categoryLabel: 'Category',
    stockLabel: 'Stock', inStock: 'In Stock', lowStock: 'Low Stock',
    addToCartSuccess: 'Product added to cart!', prescriptionRequired: 'Prescription required for this product',

    // Cart
    shoppingCart: 'Shopping Cart', emptyCart: 'Your cart is empty',
    total: 'Total', checkout: 'Checkout', remove: 'Remove', quantity: 'Qty',
    grandTotal: 'Grand Total', basePrice: 'Base Price',
    orderInvoice: 'Order Invoice', cashOnDelivery: 'Cash on Delivery',
    orderPlaced: 'Order Placed Successfully!',
    trackingYourOrder: 'You can track your order from the dashboard',
    address: 'Address', city: 'City', district: 'District',
    streetName: 'Street Name', houseNumber: 'House Number',
    specialMarks: 'Special Marks', specialInstructions: 'Special Instructions/Comments',

    // Auth
    loginTitle: 'Welcome Back', loginSubtitle: 'Sign in to your account',
    email: 'Email', password: 'Password',
    noAccount: 'Don\'t have an account?', hasAccount: 'Already have an account?',
    registerHere: 'Register here', loginHere: 'Login here',
    registerTitle: 'Create Account', registerSubtitle: 'Join Smart Optix today',
    name: 'Full Name', phone: 'Phone', confirmPassword: 'Confirm Password',
    createAccount: 'Create Account',

    // Dashboard Client
    dashboardTitle: 'My Dashboard', orderHistory: 'Order History',
    prescriptions: 'Prescriptions', profileSettings: 'Profile Settings',
    orderNumber: 'Order #', orderDate: 'Date', orderStatus: 'Status',
    orderTotal: 'Total', pending: 'Pending', confirmed: 'Confirmed',
    preparing: 'Preparing', ready_for_delivery: 'Ready for Delivery',
    out_for_delivery: 'Out for Delivery', delivered: 'Delivered',
    cancelled: 'Cancelled', noOrdersYet: 'No orders yet',

    // Admin Dashboard
    totalOrders: 'Total Orders', totalRevenue: 'Total Revenue',
    pendingOrders: 'Pending Orders',
    totalProducts: 'Total Products', totalClients: 'Total Clients',
    totalDrivers: 'Total Drivers',
    manageOrders: 'Manage Orders', manageAppointments: 'Manage Appointments',
    manageProducts: 'Manage Products', inventoryAlerts: 'Inventory Alerts',
    updateStatus: 'Update Status', recentOrders: 'Recent Orders',
    driverMetrics: 'Driver Metrics', salesOverview: 'Sales Overview',
    filterToday: 'Today', filterWeek: 'This Week', filterMonth: 'This Month',
    filterCustom: 'Custom Range', exportCsv: 'Export to Excel',
    addNewProduct: 'Add New Product', productNameEn: 'Product Name (English)',
    productNameAr: 'Product Name (Arabic)', descEn: 'Description (English)',
    descAr: 'Description (Arabic)', price: 'Price', brand: 'Brand',
    material: 'Material', shape: 'Shape', category: 'Category',
    stock: 'Stock', imageUrl: 'Image URL', createProduct: 'Create Product',

    // Driver Portal
    driverDashboard: 'Driver Dashboard', available: 'Available',
    offline: 'Offline', myDeliveries: 'My Deliveries',
    activeQueue: 'Active Delivery Queue',
    markOutForDelivery: 'Mark Out for Delivery',
    markDelivered: 'Mark Delivered', clientName: 'Client',
    clientPhone: 'Phone', clientAddress: 'Address',
    customerComments: 'Comments', noAssignedOrders: 'No assigned deliveries',
    totalDeliveries: 'Total Deliveries', earnings: 'Earnings',
    completedDeliveries: 'Completed',

    // Appointments
    bookAppointment: 'Book Appointment', selectBranch: 'Select Branch',
    selectDoctor: 'Select Doctor', selectDate: 'Select Date',
    selectTime: 'Select Time', appointmentNotes: 'Notes',
    confirmBooking: 'Confirm Booking', myAppointments: 'My Appointments',
    noAppointments: 'No appointments scheduled',
    confirmedAppointment: 'Confirmed', pendingAppointment: 'Pending',
    completedAppointment: 'Completed', cancelledAppointment: 'Cancelled',

    // Face Guide
    faceGuideTitle: 'Find Your Perfect Frame',
    faceGuideSubtitle: 'Discover which frame styles complement your face shape',
    oval: 'Oval', ovalDesc: 'Most frame styles suit you. Try aviators, wayfarers, or rounds.',
    round: 'Round', roundDesc: 'Angular frames add definition. Try rectangles, squares, or cat-eyes.',
    square: 'Square', squareDesc: 'Soften your features with rounds, aviators, or browline frames.',
    recommended: 'Recommended Frames',

    // Prescription Wizard
    prescriptionTitle: 'Prescription Glasses', fashionOnly: 'Fashion Only',
    withPrescription: 'With Prescription', rightEye: 'Right Eye (OD)',
    leftEye: 'Left Eye (OS)', sph: 'SPH', cyl: 'CYL', axis: 'AXIS',
    pd: 'Pupillary Distance (PD)', next: 'Next', back: 'Back', finish: 'Finish',
    uploadPrescription: 'Upload Prescription',
    uploadDesc: 'Upload a photo of your prescription document',
    chooseFile: 'Choose File',

    // Checkout
    checkoutTitle: 'Checkout', shippingAddress: 'Shipping Address',
    prescriptionDetails: 'Prescription Details', orderSummary: 'Order Summary',
    placeOrder: 'Place Order', paymentMethod: 'Payment Method',
    cardPayment: 'Card Payment',
    viewActivity: 'View Activity', deleteDriver: 'Delete Driver',
    setAppointment: 'Set Appointment', confirmSetAppointment: 'Confirm Appointment',
    setLocation: 'Location', customerName: 'Customer',
    orderLocked: 'Status Locked',
    requiredField: 'Required', fillShipping: 'Please fill in all required shipping fields',
    invalidCard: 'Please enter valid card details', stockExceeded: 'Quantity exceeds available stock',

    // Notifications
    notifications: 'Notifications', noNotifications: 'No notifications',
    markAllRead: 'Mark all read', clearAll: 'Clear all',

    // Footer
    footerAbout: 'About Smart Optix',
    footerDesc: 'Your premium destination for luxury eyewear. Combining cutting-edge technology with timeless elegance.',
    footerQuickLinks: 'Quick Links', footerContact: 'Contact Us',
    footerRights: 'All rights reserved.',
  },
  ar: {
    // Navbar
    home: 'الرئيسية', catalog: 'الكتالوج', appointments: 'المواعيد',
    faceGuide: 'دليل الوجه', cart: 'السلة', login: 'تسجيل الدخول',
    register: 'إنشاء حساب', logout: 'تسجيل الخروج', dashboard: 'لوحة التحكم',
    myOrders: 'طلباتي', myPrescriptions: 'وصفاتي الطبية',
    smartOptix: 'سمارت أبتكس', adminDashboard: 'لوحة تحكم المسؤول',
    driverPortal: 'بوابة السائق',

    // Home
    heroTitle: 'نظارات فاخرة', heroSubtitle: 'اكتشف أطقم الإطار الفاخرة التي تحدد أسلوبك',
    heroCTA: 'استكشف المجموعة', featuredProducts: 'منتجات مميزة',
    viewAll: 'عرض الكل', whyChooseUs: 'لماذا تختارنا',
    qualityTitle: 'جودة ممتازة', qualityDesc: 'أطقم يدوية الصنع من أفخم المواد في العالم',
    styleTitle: 'أناقة خالدة', styleDesc: 'مجموعات منتقاة تتخطى صيحات الموضة',
    serviceTitle: 'خدمة متخصصة', serviceDesc: 'عناية بالعيون من متخصصين معتمدين',
    guaranteeTitle: 'ضمان الرضا', guaranteeDesc: 'أصالة وجودة 100%',
    aboutUs: 'من نحن', aboutUsDesc: 'سمارت أبتكس وجهتك المميزة للنظارات الفاخرة، نجمع بين أحدث التقنيات والأناقة الخالدة. منذ 2018، نخدم آلاف العملاء الراضين في المملكة العربية السعودية.',
    aboutUsMission: 'مهمتنا هي توفير نظارات فاخرة تجمع بين الأناقة والراحة وجودة البصر المتفوقة.',
    customerReviews: 'ماذا يقول عملاؤنا', testimonials: 'شهادات العملاء',
    testimonial1Name: 'سارة المطيري', testimonial1Text: 'أحببت إطاراتي الجديدة تماماً! الجودة استثنائية والمقاس كان مثالياً.',
    testimonial2Name: 'محمد الفهد', testimonial2Text: 'أفضل تجربة في متجر نظارات. طاقم محترف ومجموعة جميلة.',
    testimonial3Name: 'نورة الحربي', testimonial3Text: 'نظارات الوصفة الطبية ممتازة. رؤية واضحة مع تصميم أنيق.',
    testimonial4Name: 'أحمد السعيد', testimonial4Text: 'خدمة عملاء متميزة ومنتجات بجودة عالية. أنصح بشدة!',
    testimonial5Name: 'فاطمة الراشد', testimonial5Text: 'عميلة مخلصة لسنوات. مجموعاتهم لا تخيب أبداً.',

    // Catalog
    catalogTitle: 'مجموعتنا', catalogSubtitle: 'اعثر على إطارك المثالي',
    filterBrand: 'العلامة التجارية', filterMaterial: 'المادة',
    filterShape: 'الشكل', filterCategory: 'الفئة',
    allBrands: 'جميع العلامات', allMaterials: 'جميع المواد',
    allShapes: 'جميع الأشكال', allCategories: 'جميع الفئات',
    addToCart: 'أضف للسلة', viewDetails: 'عرض التفاصيل',
    sunglasses: 'نظارات شمسية', prescription: 'نظارات طبية', protection: 'نظارات حماية', contactLenses: 'عدسات لاصقة',
    noProducts: 'لم يتم العثور على منتجات تطابق معاييرك',
    specifications: 'المواصفات', frameDetails: 'تفاصيل الإطار',
    lensUpgradeFee: 'رسوم عدسات الوصفة', shippingFee: 'رسوم الشحن',
    choosePrescription: 'اختر خيارات الوصفة الطبية',

    // Product Details
    backToCatalog: 'العودة للكتالوج', relatedProducts: 'منتجات مشابهة',
    materialLabel: 'المادة', shapeLabel: 'الشكل', categoryLabel: 'الفئة',
    stockLabel: 'المخزون', inStock: 'متوفر', lowStock: 'مخزون منخفض',
    addToCartSuccess: 'تمت إضافة المنتج للسلة!', prescriptionRequired: 'الوصفة الطبية مطلوبة لهذا المنتج',

    // Cart
    shoppingCart: 'سلة التسوق', emptyCart: 'سلتك فارغة',
    total: 'الإجمالي', checkout: 'إتمام الشراء', remove: 'إزالة',
    quantity: 'الكمية', grandTotal: 'المبلغ الإجمالي', basePrice: 'السعر الأساسي',
    orderInvoice: 'فاتورة الطلب', cashOnDelivery: 'الدفع عند الاستلام',
    orderPlaced: 'تم تقديم الطلب بنجاح!',
    trackingYourOrder: 'يمكنك تتبع طلبك من لوحة التحكم',
    address: 'العنوان', city: 'المدينة', district: 'الحي',
    streetName: 'اسم الشارع', houseNumber: 'رقم المنزل',
    specialMarks: 'علامات مميزة', specialInstructions: 'تعليمات خاصة / ملاحظات',

    // Auth
    loginTitle: 'مرحباً بعودتك', loginSubtitle: 'سجّل الدخول إلى حسابك',
    email: 'البريد الإلكتروني', password: 'كلمة المرور',
    noAccount: 'ليس لديك حساب؟', hasAccount: 'لديك حساب بالفعل؟',
    registerHere: 'سجّل هنا', loginHere: 'سجّل الدخول هنا',
    registerTitle: 'إنشاء حساب', registerSubtitle: 'انضم إلى سمارت أبتكس اليوم',
    name: 'الاسم الكامل', phone: 'الهاتف', confirmPassword: 'تأكيد كلمة المرور',
    createAccount: 'إنشاء الحساب',

    // Dashboard Client
    dashboardTitle: 'لوحة التحكم', orderHistory: 'سجل الطلبات',
    prescriptions: 'الوصفات الطبية', profileSettings: 'إعدادات الملف الشخصي',
    orderNumber: 'طلب رقم', orderDate: 'التاريخ', orderStatus: 'الحالة',
    orderTotal: 'الإجمالي', pending: 'قيد الانتظار', confirmed: 'مؤكد',
    preparing: 'قيد التجهيز', ready_for_delivery: 'جاهز للتوصيل',
    out_for_delivery: 'خرج للتوصيل', delivered: 'تم التسليم',
    cancelled: 'ملغي', noOrdersYet: 'لا توجد طلبات بعد',

    // Admin Dashboard
    totalOrders: 'إجمالي الطلبات', totalRevenue: 'إجمالي الإيرادات',
    pendingOrders: 'طلبات معلقة',
    totalProducts: 'إجمالي المنتجات', totalClients: 'إجمالي العملاء',
    totalDrivers: 'إجمالي السائقين',
    manageOrders: 'إدارة الطلبات', manageAppointments: 'إدارة المواعيد',
    manageProducts: 'إدارة المنتجات', inventoryAlerts: 'تنبيهات المخزون',
    updateStatus: 'تحديث الحالة', recentOrders: 'آخر الطلبات',
    driverMetrics: 'إحصائيات السائقين', salesOverview: 'نظرة عامة على المبيعات',
    filterToday: 'اليوم', filterWeek: 'هذا الأسبوع', filterMonth: 'هذا الشهر',
    filterCustom: 'نطاق مخصص', exportCsv: 'تصدير إلى Excel',
    addNewProduct: 'إضافة منتج جديد', productNameEn: 'اسم المنتج (إنجليزي)',
    productNameAr: 'اسم المنتج (عربي)', descEn: 'الوصف (إنجليزي)',
    descAr: 'الوصف (عربي)', price: 'السعر', brand: 'العلامة التجارية',
    material: 'المادة', shape: 'الشكل', category: 'الفئة',
    stock: 'المخزون', imageUrl: 'رابط الصورة', createProduct: 'إنشاء المنتج',

    // Driver Portal
    driverDashboard: 'لوحة تحكم السائق', available: 'متاح',
    offline: 'غير متاح', myDeliveries: 'توصيلاتي',
    activeQueue: 'قائمة التوصيل النشطة',
    markOutForDelivery: 'تحديد خروج للتوصيل',
    markDelivered: 'تحديد تم التوصيل', clientName: 'العميل',
    clientPhone: 'الهاتف', clientAddress: 'العنوان',
    customerComments: 'ملاحظات', noAssignedOrders: 'لا توجد توصيلات مخصصة',
    totalDeliveries: 'إجمالي التوصيلات', earnings: 'الأرباح',
    completedDeliveries: 'مكتملة',

    // Appointments
    bookAppointment: 'حجز موعد', selectBranch: 'اختر الفرع',
    selectDoctor: 'اختر الطبيب', selectDate: 'اختر التاريخ',
    selectTime: 'اختر الوقت', appointmentNotes: 'ملاحظات',
    confirmBooking: 'تأكيد الحجز', myAppointments: 'مواعيدي',
    noAppointments: 'لا توجد مواعيد مجدولة',
    confirmedAppointment: 'مؤكد', pendingAppointment: 'قيد الانتظار',
    completedAppointment: 'مكتمل', cancelledAppointment: 'ملغي',

    // Face Guide
    faceGuideTitle: 'اعثر على إطارك المثالي',
    faceGuideSubtitle: 'اكتشف أنماط الإطارات التي تتناسب مع شكل وجهك',
    oval: 'بيضاوي', ovalDesc: 'معظم أنماط الإطارات تناسبك. جرّب الأفياتور أو الوايفرر أو الدائرية.',
    round: 'دائري', roundDesc: 'الإطارات الزاوية تضيف تعريفاً. جرّب المستطيلة أو المربعة أو قطة العيون.',
    square: 'مربع', squareDesc: 'نعّم ملامحك بالإطارات الدائرية أو الأفياتور أو براولين.',
    recommended: 'الإطارات الموصى بها',

    // Prescription Wizard
    prescriptionTitle: 'نظارات طبية', fashionOnly: 'أناقة فقط',
    withPrescription: 'مع وصفة طبية', rightEye: 'العين اليمنى (OD)',
    leftEye: 'العين اليسرى (OS)', sph: 'القوة الكروية',
    cyl: 'الاستجماتизм', axis: 'المقياس',
    pd: 'المسافة بين البؤبؤين', next: 'التالي', back: 'رجوع', finish: 'إنهاء',
    uploadPrescription: 'رفع الوصفة الطبية',
    uploadDesc: 'ارفع صورة من وثيقة الوصفة الطبية',
    chooseFile: 'اختر ملف',

    // Checkout
    checkoutTitle: 'إتمام الشراء', shippingAddress: 'عنوان الشحن',
    prescriptionDetails: 'تفاصيل الوصفة الطبية', orderSummary: 'ملخص الطلب',
    placeOrder: 'تأكيد الطلب', paymentMethod: 'طريقة الدفع',
    cardPayment: 'الدفع بالبطاقة',
    viewActivity: 'عرض النشاط', deleteDriver: 'حذف السائق',
    setAppointment: 'تحديد موعد', confirmSetAppointment: 'تأكيد الموعد',
    setLocation: 'الموقع', customerName: 'العميل',
    orderLocked: 'الحالة مقفلة',
    requiredField: 'مطلوب', fillShipping: 'يرجى ملء جميع حقول الشحن المطلوبة',
    invalidCard: 'يرجى إدخال بيانات البطاقة الصحيحة', stockExceeded: 'الكمية تتجاوز المخزون المتاح',

    // Notifications
    notifications: 'الإشعارات', noNotifications: 'لا توجد إشعارات',
    markAllRead: 'تحديد الكل كمقروء', clearAll: 'مسح الكل',

    // Footer
    footerAbout: 'عن سمارت أبتكس',
    footerDesc: 'وجهتك المميزة للنظارات الفاخرة. نجمع بين أحدث التقنيات والأناقة الخالدة.',
    footerQuickLinks: 'روابط سريعة', footerContact: 'تواصل معنا',
    footerRights: 'جميع الحقوق محفوظة.',
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('smartoptix_lang') || 'en';
  });

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('smartoptix_lang', language);
  }, [language]);

  const t = (key) => translations[language][key] || translations['en'][key] || key;

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isRTL: language === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
