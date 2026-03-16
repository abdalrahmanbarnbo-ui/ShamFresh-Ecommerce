import React from 'react';
import { ShoppingCart, Menu, Store, ClipboardList, LogOut, User as UserIcon, Moon, Sun, Globe, LayoutDashboard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';

interface HeaderProps {
  cartCount: number;
}

export default function Header({ cartCount }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme, language, toggleLanguage, t } = useSettings();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-emerald-600/95 dark:bg-slate-900/95 border-b border-emerald-700/50 dark:border-slate-800 text-white shadow-sm transition-all duration-300">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">
        
        {/* ========================================= */}
        {/* الشعار وزر القائمة للموبايل */}
        {/* ========================================= */}
        <div className="flex items-center gap-3">
          <button className="md:hidden p-2 hover:bg-white/10 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <Menu size={24} />
          </button>
          <Link to="/" className="flex items-center gap-2 text-xl font-bold group">
            <div className="bg-white/20 dark:bg-emerald-500/20 p-1.5 rounded-lg group-hover:scale-105 transition-transform duration-300">
              <Store size={24} className="text-white dark:text-emerald-400" />
            </div>
            <span className="tracking-wide">{language === 'ar' ? 'شام فريش' : 'Sham Fresh'}</span>
          </Link>
        </div>
        
        {/* ========================================= */}
        {/* أدوات التحكم (لغة، ثيم، أزرار التنقل) */}
        {/* ========================================= */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* حاوية أنيقة (Pill) لزر الثيم واللغة للشاشات الكبيرة */}
          <div className="hidden sm:flex items-center gap-1 bg-black/10 dark:bg-black/30 p-1 rounded-full border border-white/10 dark:border-slate-700/50">
            <button 
              onClick={toggleTheme} 
              className="p-2 hover:bg-white/20 dark:hover:bg-slate-700 rounded-full transition-colors flex items-center justify-center"
              title={t('dark_mode')}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} className="text-amber-400" />}
            </button>
            <button 
              onClick={toggleLanguage} 
              className="px-3 py-1.5 hover:bg-white/20 dark:hover:bg-slate-700 rounded-full transition-colors flex items-center gap-1.5 text-sm font-bold"
            >
              <Globe size={18} className={language === 'en' ? 'text-blue-200' : ''} />
              <span>{t('lang')}</span>
            </button>
          </div>

          {/* خط فاصل عمودي */}
          <div className="hidden sm:block w-px h-6 bg-white/20 dark:bg-slate-700"></div>

          {/* روابط التنقل المخصصة (مدير أو مستخدم عادي) */}
          {user?.role === 'admin' && (
            <Link to="/admin" className="hidden md:flex items-center gap-1.5 text-sm hover:text-emerald-200 dark:hover:text-emerald-400 transition-colors font-medium">
              <LayoutDashboard size={18} />
              {t('admin_panel')}
            </Link>
          )}
          
          {user && user.role !== 'admin' && (
            <Link to="/orders" className="hidden md:flex items-center gap-1.5 text-sm hover:text-emerald-200 dark:hover:text-emerald-400 transition-colors font-medium">
              <ClipboardList size={18} />
              <span>{language === 'ar' ? 'طلباتي' : 'My Orders'}</span>
            </Link>
          )}

          {/* بيانات المستخدم وزر تسجيل الخروج/الدخول */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3 bg-white/10 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-white/10 dark:border-slate-700">
              <span className="hidden md:flex items-center gap-1.5 text-sm font-bold">
                <UserIcon size={16} className="text-emerald-200 dark:text-emerald-400" />
                {user.name}
              </span>
              <button 
                onClick={handleLogout}
                className="text-sm hover:text-red-200 dark:hover:text-red-400 flex items-center gap-1.5 transition-colors"
                title={t('logout')}
              >
                <LogOut size={18} />
                <span className="hidden md:inline">{t('logout')}</span>
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-sm bg-white text-emerald-600 dark:bg-emerald-500 dark:text-white px-5 py-2 rounded-xl font-bold hover:bg-emerald-50 dark:hover:bg-emerald-600 transition-all shadow-sm transform hover:-translate-y-0.5">
              {t('login')}
            </Link>
          )}

          {/* أيقونة السلة باحترافية وتأثيرات */}
          {(!user || user.role !== 'admin') && (
            <Link to="/checkout" className="relative p-2.5 hover:bg-white/10 dark:hover:bg-slate-800 rounded-xl transition-colors group">
              <ShoppingCart size={22} className="group-hover:scale-110 transition-transform duration-300" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 dark:bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full transform translate-x-1.5 -translate-y-1.5 border-2 border-emerald-600 dark:border-slate-900 shadow-sm transition-all">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          )}

          {/* ========================================= */}
          {/* أزرار الثيم واللغة مصغرة للموبايل (تظهر فقط في الشاشات الصغيرة) */}
          {/* ========================================= */}
          <div className="flex sm:hidden items-center gap-1 bg-black/10 dark:bg-slate-800 p-1 rounded-lg">
             <button onClick={toggleTheme} className="p-1.5 hover:bg-white/10 dark:hover:bg-slate-700 rounded-md transition-colors">
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} className="text-amber-400" />}
             </button>
             <button onClick={toggleLanguage} className="p-1.5 hover:bg-white/10 dark:hover:bg-slate-700 rounded-md font-bold text-xs transition-colors">
                {language === 'ar' ? 'EN' : 'عربي'}
             </button>
          </div>

        </div>
      </div>
    </header>
  );
}