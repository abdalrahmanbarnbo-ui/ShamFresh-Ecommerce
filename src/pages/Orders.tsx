import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order } from '../types';
import { Package, Truck, CheckCircle, Clock, Star } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Orders() {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingData, setRatingData] = useState<{ [key: number]: { rating: number, review: string } }>({});

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/my-orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else {
        fetchOrders();
      }
    }
  }, [user, authLoading, navigate]);

  const handleRatingSubmit = async (orderId: number) => {
    if (!token) return;
    const data = ratingData[orderId];
    if (!data || data.rating === 0) {
      alert('يرجى اختيار التقييم أولاً');
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}/rating`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating: data.rating, review: data.review })
      });
      if (res.ok) {
        alert('شكراً لتقييمك!');
        fetchOrders();
      }
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء إرسال التقييم');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SY', { style: 'currency', currency: 'SYP', maximumFractionDigits: 0 }).format(price);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending': return { text: 'قيد الانتظار', icon: <Clock className="text-amber-500" />, color: 'text-amber-500', bg: 'bg-amber-100', step: 1 };
      case 'accepted': return { text: 'قيد التجهيز', icon: <Package className="text-blue-500" />, color: 'text-blue-500', bg: 'bg-blue-100', step: 2 };
      case 'out_for_delivery': return { text: 'مع عامل التوصيل', icon: <Truck className="text-purple-500" />, color: 'text-purple-500', bg: 'bg-purple-100', step: 3 };
      case 'delivered': return { text: 'تم التوصيل', icon: <CheckCircle className="text-emerald-500" />, color: 'text-emerald-500', bg: 'bg-emerald-100', step: 4 };
      default: return { text: 'غير معروف', icon: <Clock />, color: 'text-slate-500', bg: 'bg-slate-100', step: 0 };
    }
  };

  if (loading || authLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  );

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3">
        <Package className="text-emerald-600" size={32} />
        طلباتي
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
          <Package className="mx-auto text-slate-300 mb-4" size={64} />
          <h2 className="text-xl font-bold text-slate-600">لا يوجد طلبات سابقة</h2>
          <p className="text-slate-500 mt-2">قم بإنشاء طلبك الأول الآن!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const statusInfo = getStatusInfo(order.status);
            const orderDate = new Date(order.created_at).toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="text-sm text-slate-500 mb-1">طلب رقم #{order.id} {order.seller_name && <span className="text-emerald-600 font-bold mr-2">من: {order.seller_name}</span>}</div>
                    <div className="font-medium text-slate-800">{orderDate}</div>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold ${statusInfo.bg} ${statusInfo.color}`}>
                    {statusInfo.icon}
                    <span>{statusInfo.text}</span>
                  </div>
                </div>

                {/* Tracking Stepper */}
                <div className="p-6 border-b border-slate-100">
                  <div className="relative flex justify-between items-center max-w-2xl mx-auto">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10"></div>
                    <div className={`absolute right-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 -z-10 transition-all duration-500`} style={{ width: `${(statusInfo.step - 1) * 33.33}%` }}></div>
                    
                    {[
                      { step: 1, icon: Clock, label: 'تم الطلب' },
                      { step: 2, icon: Package, label: 'قيد التجهيز' },
                      { step: 3, icon: Truck, label: 'في الطريق' },
                      { step: 4, icon: CheckCircle, label: 'تم التوصيل' }
                    ].map((item) => {
                      const isActive = statusInfo.step >= item.step;
                      const Icon = item.icon;
                      return (
                        <div key={item.step} className="flex flex-col items-center gap-2 bg-white px-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${isActive ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-slate-400'}`}>
                            <Icon size={20} />
                          </div>
                          <span className={`text-xs sm:text-sm font-bold ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-slate-800 mb-4">المنتجات</h3>
                  <div className="space-y-3">
                    {order.items?.map(item => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={item.product_image || `https://picsum.photos/seed/${item.product_id}/50/50`} alt={item.product_name} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <div className="font-medium text-slate-800">{item.product_name}</div>
                            <div className="text-sm text-slate-500">{item.quantity} {item.unit === 'kg' ? 'كغ' : item.unit === 'g' ? 'غ' : 'قطعة'}</div>
                          </div>
                        </div>
                        <div className="font-bold text-slate-800">{formatPrice(item.price_at_time * item.quantity)}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-600">الإجمالي (شامل التوصيل)</span>
                    <span className="text-xl font-bold text-emerald-600">{formatPrice(order.total_amount + 5000)}</span>
                  </div>
                </div>

                {/* Rating Section */}
                {order.status === 'delivered' && (
                  <div className="p-6 bg-slate-50 border-t border-slate-200">
                    {order.rating ? (
                      <div>
                        <h3 className="font-bold text-slate-800 mb-2">تقييمك للطلب</h3>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} size={20} className={star <= order.rating! ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                          ))}
                        </div>
                        {order.review && <p className="text-slate-600 text-sm bg-white p-3 rounded-lg border border-slate-200">{order.review}</p>}
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-bold text-slate-800 mb-3">كيف كانت تجربتك؟</h3>
                        <div className="flex items-center gap-2 mb-4">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button 
                              key={star}
                              onClick={() => setRatingData(prev => ({ ...prev, [order.id]: { ...prev[order.id], rating: star } }))}
                              className="focus:outline-none transition-transform hover:scale-110"
                            >
                              <Star 
                                size={28} 
                                className={(ratingData[order.id]?.rating || 0) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300'} 
                              />
                            </button>
                          ))}
                        </div>
                        <textarea 
                          placeholder="أخبرنا عن رأيك بالخدمة والمنتجات (اختياري)"
                          className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none mb-3 text-sm"
                          rows={2}
                          value={ratingData[order.id]?.review || ''}
                          onChange={e => setRatingData(prev => ({ ...prev, [order.id]: { ...prev[order.id], review: e.target.value } }))}
                        ></textarea>
                        <button 
                          onClick={() => handleRatingSubmit(order.id)}
                          className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors text-sm"
                        >
                          إرسال التقييم
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
