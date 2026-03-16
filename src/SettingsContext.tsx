import React, { createContext, useContext, useState, useEffect } from 'react';

// ==========================================
// 1. قاموس الترجمة (Dictionary)
// يمكنك إضافة أي كلمات جديدة هنا مستقبلاً
// ==========================================
const translations = {
  ar: {
    home: 'الرئيسية',
    stores: 'المتاجر',
    cart: 'السلة',
    login: 'تسجيل الدخول',
    logout: 'تسجيل خروج',
    admin_panel: 'لوحة التحكم',
    search: 'ابحث عن منتج...',
    dark_mode: 'الوضع الليلي',
    light_mode: 'الوضع العادي',
    lang: 'English', // الكلمة التي ستظهر على الزر للتبديل للإنجليزية
    welcome: 'مرحباً بك في شام فريش',
    no_products: 'لا يوجد منتجات',
  },
  en: {
    home: 'Home',
    stores: 'Stores',
    cart: 'Cart',
    login: 'Login',
    logout: 'Logout',
    admin_panel: 'Dashboard',
    search: 'Search for a product...',
    dark_mode: 'Dark Mode',
    light_mode: 'Light Mode',
    lang: 'العربية', // الكلمة التي ستظهر على الزر للتبديل للعربية
    welcome: 'Welcome to Sham Fresh',
    no_products: 'No products available',
  }
};

type Language = 'ar' | 'en';
type Theme = 'light' | 'dark';

interface SettingsContextType {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations['ar']) => string; // دالة الترجمة السحرية
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // قراءة الإعدادات السابقة من المتصفح (حتى لا يفقدها المستخدم عند تحديث الصفحة)
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'light';
  });
  
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'ar';
  });

  // تأثير (Effect) لتطبيق الوضع الليلي على الموقع بأكمله
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // تأثير (Effect) لتغيير اتجاه الموقع (RTL/LTR) واللغة
  useEffect(() => {
    const root = document.documentElement;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    root.lang = language;
    localStorage.setItem('language', language);
  }, [language]);

  // دوال التبديل
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  const toggleLanguage = () => setLanguage(prev => (prev === 'ar' ? 'en' : 'ar'));
  
  // دالة الترجمة: تبحث عن الكلمة في القاموس حسب اللغة الحالية
  const t = (key: keyof typeof translations['ar']) => {
    return translations[language][key] || key;
  };

  return (
    <SettingsContext.Provider value={{ theme, toggleTheme, language, toggleLanguage, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

// دالة جاهزة للاستخدام في أي صفحة أخرى
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};