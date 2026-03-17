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

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  );

  if (error) return (
    <div className="text-center text-red-500 p-8 font-bold text-lg">
      <span className="inline-block bg-red-50 p-3 rounded-full border border-red-100 mb-4">
        ⚠️
      </span>
      <p>{error}</p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* رأس الصفحة مع عنوان ووصف */}
      <div className="mb-10 text-center md:text-right">
        <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">
          {t('stores')}
        </h1>
        <p className="text-slate-600 text-lg max-w-2xl">
          {language === 'ar' ? 'اختر متجرك المفضل وتصفح منتجاته الطازجة' : 'Choose your favorite store and browse its fresh products'}
        </p>
      </div>
      
      {restaurants.length === 0 ? (
        // حالة الصفحة الفارغة بتصميم أنيق
        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center gap-6">
          <div className="bg-slate-50 p-6 rounded-full border border-slate-100">
            <Store className="w-16 h-16 text-slate-300" />
          </div>
          <div className="max-w-md">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              {t('no_products')}
            </h3>
            <p className="text-slate-600">
              {language === 'ar' ? 'لم يتم إضافة أي متاجر بعد. كن أول من يضيف متجراً!' : 'No stores have been added yet. Be the first to add a store!'}
            </p>
          </div>
        </div>
      ) : (
        // حاوية شبكية متجاوبة وذكية للمتاجر
        // col-1 على الموبايل، col-2 على الشاشات المتوسطة، col-3-4 على الشاشات الكبيرة
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {restaurants.map(restaurant => (
            <div 
              key={restaurant.id} 
              onClick={() => navigate(`/restaurant/${restaurant.id}`)}
              className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-slate-100 cursor-pointer group flex flex-col"
            >
              {/* حاوية الصورة بنسبة عرض إلى ارتفاع ثابتة */}
              <div className="relative aspect-video overflow-hidden bg-slate-100">
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
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="w-16 h-16 text-slate-300" />
                  </div>
                )}
                {/* تأثير طبقة خفيفة على الصورة عند الحوم */}
                <div className="absolute inset-0 bg-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              {/* بيانات المتجر مع السهم */}
              <div className="p-6 flex items-center justify-between gap-3 mt-auto">
                <div className="flex-grow">
                  <h3 className="font-bold text-slate-900 text-xl mb-1 group-hover:text-emerald-700 transition-colors">
                    {restaurant.name}
                  </h3>
                  <p className="text-slate-500 text-sm">
                    {language === 'ar' ? 'تصفح المنتجات الطازجة' : 'Browse fresh products'}
                  </p>
                </div>
                {/* أيقونة السهم في دائرة أنيقة */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 transform group-hover:scale-110">
                  <ChevronLeft className={`w-6 h-6 ${language === 'en' ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}