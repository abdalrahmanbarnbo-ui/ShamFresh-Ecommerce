import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Restaurant } from '../types';
import { Store, ChevronLeft } from 'lucide-react';
import { useSettings } from '../SettingsContext';

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // استدعاء دالة الترجمة واللغة من الإعدادات
  const { t, language } = useSettings();

  useEffect(() => {
    fetch('/api/restaurants')
      .then(async res => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`فشل الاتصال: ${res.status} - ${errorText}`);
        }
        return res.json();
      })
      .then(data => {
        setRestaurants(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("تفاصيل الخطأ التقني:", err);
        setError(language === 'ar' ? 'حدث خطأ أثناء تحميل المتاجر.' : 'Error loading stores.');
        setLoading(false);
      });
  }, [language]);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;
  if (error) return <div className="text-center text-red-500 dark:text-red-400 p-8 font-bold">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{t('stores')}</h1>
        <p className="text-slate-500 dark:text-slate-400">
          {language === 'ar' ? 'اختر متجرك المفضل وتصفح منتجاته' : 'Choose your favorite store and browse its products'}
        </p>
      </div>
      
      {restaurants.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <Store className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">{t('no_products')}</h3>
          <p className="text-slate-500 dark:text-slate-400">
            {language === 'ar' ? 'لم يتم إضافة أي متاجر أو حسابات مدراء بعد.' : 'No stores or admin accounts have been added yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {restaurants.map(restaurant => (
            <div 
              key={restaurant.id} 
              onClick={() => navigate(`/restaurant/${restaurant.id}`)}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-100 dark:border-slate-700 cursor-pointer group"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-50 dark:bg-slate-700/50">
                {restaurant.store_image ? (
                  <img 
                    src={restaurant.store_image} 
                    alt={restaurant.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Store';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                    <Store className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                  </div>
                )}
              </div>
              
              <div className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1">{restaurant.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {language === 'ar' ? 'اضغط لتصفح المنتجات' : 'Click to browse products'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:bg-emerald-500 dark:group-hover:text-white transition-colors">
                  {/* السهم يلتف تلقائياً إذا كانت اللغة إنجليزية */}
                  <ChevronLeft className={`w-5 h-5 ${language === 'en' ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}