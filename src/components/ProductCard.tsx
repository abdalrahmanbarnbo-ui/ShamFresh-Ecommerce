import React, { useState } from 'react';
import { ShoppingBag, X, Info } from 'lucide-react';
import { Product } from '../types';
import { useSettings } from '../SettingsContext';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [showModal, setShowModal] = useState(false);
  const { language } = useSettings();

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col group relative">
        
        {/* منطقة فتح التفاصيل */}
        <div 
          className="cursor-pointer p-4 flex flex-col items-center flex-grow"
          onClick={() => setShowModal(true)}
        >
          <div className="relative w-48 h-48 mb-4">
            <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <img 
              src={product.image || 'https://via.placeholder.com/200'} 
              alt={product.name}
              className="relative w-full h-full object-cover rounded-full border-4 border-white dark:border-slate-800 shadow-md group-hover:scale-105 transition-transform duration-500"
            />
            {product.category_name && (
              <span className="absolute top-2 right-2 bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                {product.category_name}
              </span>
            )}
          </div>
          
          <h3 className="font-bold text-slate-900 dark:text-white text-lg text-center mb-1 group-hover:text-emerald-600 transition-colors">
            {product.name}
          </h3>
          <p className="font-black text-emerald-600 dark:text-emerald-400 text-lg">
            {product.price.toLocaleString()} <span className="text-sm">ل.س</span>
            <span className="text-xs text-slate-400 font-normal mx-1">/ {product.unit}</span>
          </p>
        </div>

        {/* زر الإضافة للسلة الخارجي */}
        <div className="p-3 relative z-10">
          <button 
            onClick={(e) => {
              e.stopPropagation(); // السطر السحري لمنع تداخل الأحداث
              onAddToCart(product);
            }}
            className="w-full bg-slate-900 dark:bg-slate-700 hover:bg-emerald-600 dark:hover:bg-emerald-500 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {language === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
            <ShoppingBag size={18} />
          </button>
        </div>
      </div>

      {/* النافذة المنبثقة (Modal) */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)} 
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]"
            onClick={handleModalClick}
          >
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(false);
              }}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
            >
              <X size={18} />
            </button>

            <div className="w-full h-64 bg-slate-100 dark:bg-slate-900 relative flex-shrink-0">
              <img 
                src={product.image || 'https://via.placeholder.com/500'} 
                alt={product.name}
                className="w-full h-full object-contain p-4"
              />
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                    {product.name}
                  </h2>
                  {product.category_name && (
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                      {product.category_name}
                    </span>
                  )}
                </div>
                <div className="text-left rtl:text-right">
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {product.price.toLocaleString()} <span className="text-sm">ل.س</span>
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {language === 'ar' ? 'لكل' : 'Per'} {product.unit}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl mb-6 border border-slate-100 dark:border-slate-600">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={18} className="text-slate-400 dark:text-slate-300" />
                  <h4 className="font-bold text-slate-700 dark:text-slate-200">
                    {language === 'ar' ? 'تفاصيل المنتج' : 'Product Details'}
                  </h4>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  {product.description || (language === 'ar' ? 'لا يوجد وصف متاح لهذا المنتج حالياً.' : 'No description available for this product.')}
                </p>
              </div>

              {/* زر الإضافة للسلة الداخلي */}
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // السطر السحري هنا أيضاً
                  onAddToCart(product);
                  setShowModal(false); 
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-emerald-600/30"
              >
                <ShoppingBag size={22} />
                {language === 'ar' ? 'إضافة إلى السلة' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}