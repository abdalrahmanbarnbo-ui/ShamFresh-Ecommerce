import React, { useEffect, useState } from 'react';
import { Package, Clock, CheckCircle, Truck, XCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price_at_time: number;
  product_image: string | null;
  unit: string;
}

interface Order {
  id: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  seller_name: string;
  items: OrderItem[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { language, t } = useSettings();

  useEffect(() => {
    fetch('/api/my-orders', {
      headers: { 'Authorization': `Bearer ${user?.token}` }
    })
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching orders:", err);
        setLoading(false);
      });
  }, [user]);

  // دالة مساعدة لتحديد شكل ولون كل حالة لتكون راقية جداً
  const getStatusDisplay = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return { 
          icon: <Clock className="w-4 h-4" strokeWidth={2.5} />, 
          text: language === 'ar' ? 'قيد المراجعة' : 'Pending', 
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-500/10',
          border: 'border-amber-200 dark:border-amber-500/20'
        };
      case 'processing':
        return { 
          icon: <Package className="w-4 h-4" strokeWidth={2.5} />, 
          text: language === 'ar' ? 'جاري التجهيز' : 'Processing', 
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-500/10',
          border: 'border-blue-200 dark:border-blue-500/20'
        };
      case 'shipped':
        return { 
          icon: <Truck className="w-4 h-4" strokeWidth={2.5} />, 
          text: language === 'ar' ? 'في الطريق' : 'Shipped', 
          color: 'text-indigo-600 dark:text-indigo-400',
          bg: 'bg-indigo-50 dark:bg-indigo-500/10',
          border: 'border-indigo-200 dark:border-indigo-500/20'
        };
      case 'delivered':
        return { 
          icon: <CheckCircle className="w-4 h-4" strokeWidth={2.5} />, 
          text: language === 'ar' ? 'تم التوصيل' : 'Delivered', 
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-500/10',
          border: 'border-emerald-200 dark:border-emerald-500/20'
        };
      case 'cancelled':
        return { 
          icon: <XCircle className="w-4 h-4" strokeWidth={2.5} />, 
          text: language === 'ar' ? 'ملغي' : 'Cancelled', 
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-500/10',
          border: 'border-red-200 dark:border-red-500/20'
        };
      default:
        return { icon: <Clock className="w-4 h-4" />, text: status, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' };
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/30 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
           <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          {language === 'ar' ? 'سجل طلباتي' : 'My Orders'}
        </h1>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col items-center">
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-full border border-slate-100 dark:border-slate-700 mb-4">
            <Package className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            {language === 'ar' ? 'لا يوجد لديك طلبات سابقة' : 'You have no past orders'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const statusStyle = getStatusDisplay(order.status);
            
            return (
              <div key={order.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/80 overflow-hidden hover:shadow-md transition-shadow">
                
                {/* رأس الطلب (الرقم والحالة) - متجاوب مع الموبايل */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {language === 'ar' ? `طلب رقم #${order.id}` : `Order #${order.id}`}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                         <ArrowRight className={`w-3 h-3 ${language === 'en' ? 'rotate-180' : ''}`} />
                         {order.seller_name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      {new Date(order.created_at).toLocaleString(language === 'ar' ? 'ar-SY' : 'en-US', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  {/* شارة الحالة الراقية */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusStyle.bg} ${statusStyle.border} ${statusStyle.color} w-fit`}>
                    {statusStyle.icon}
                    <span className="text-sm font-bold tracking-wide">
                      {statusStyle.text}
                    </span>
                  </div>
                </div>

                {/* قائمة المنتجات في هذا الطلب */}
                <div className="p-5">
                  <div className="space-y-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700/30">
                        <img 
                          src={item.product_image || 'https://via.placeholder.com/100'} 
                          alt={item.product_name}
                          className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base">
                            {item.product_name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {language === 'ar' ? 'الكمية:' : 'Qty:'} {item.quantity} {item.unit}
                          </p>
                        </div>
                        <div className="text-left rtl:text-right">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm md:text-base">
                            {(item.price_at_time * item.quantity).toLocaleString()} <span className="text-xs">ل.س</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* الإجمالي */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="font-bold text-slate-600 dark:text-slate-300">
                      {language === 'ar' ? 'الإجمالي (شامل التوصيل)' : 'Total (incl. delivery)'}
                    </span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      {order.total_amount.toLocaleString()} <span className="text-sm font-bold">ل.س</span>
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}