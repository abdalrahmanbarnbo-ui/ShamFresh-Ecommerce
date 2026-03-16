import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem } from '../types';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, CreditCard, Banknote, QrCode } from 'lucide-react';
import { useAuth } from '../AuthContext';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface CheckoutProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function Checkout({ cart, setCart }: CheckoutProps) {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'sham_cash' | 'bank_card'>('cod');
  const [paymentRef, setPaymentRef] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.address) setAddress(user.address);
      if (user.lat && user.lng) setPosition(L.latLng(user.lat, user.lng));
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (user.role === 'admin') {
        navigate('/admin');
      }
    }
  }, [user, authLoading, navigate]);

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SY', { style: 'currency', currency: 'SYP', maximumFractionDigits: 0 }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert('يرجى تسجيل الدخول أولاً');
      navigate('/login');
      return;
    }
    if (cart.length === 0) return alert('السلة فارغة');
    if (!position) return alert('يرجى تحديد موقع التوصيل على الخريطة');
    if (!address.trim()) return alert('يرجى إدخال عنوان التوصيل بالتفصيل');
    if (paymentMethod === 'sham_cash' && !paymentRef) return alert('يرجى إدخال رقم عملية شام كاش');

    setLoading(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart.map(item => ({ product_id: item.id, quantity: item.cartQuantity, price: item.price })),
          total_amount: totalAmount,
          payment_method: paymentMethod,
          payment_reference: paymentRef,
          lat: position.lat,
          lng: position.lng,
          address: address,
          seller_id: cart[0]?.seller_id
        })
      });

      if (!response.ok) throw new Error('فشل إرسال الطلب');
      
      const data = await response.json();
      if (data.success) {
        setCart([]);
        alert(`تم استلام طلبك بنجاح! رقم الطلب: ${data.orderId}`);
        navigate('/');
      }
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  );

  if (!user) return null;

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">سلة المشتريات فارغة</h2>
        <button onClick={() => navigate('/')} className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">
          العودة للتسوق
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">إتمام الطلب</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="text-emerald-600" />
              موقع التوصيل
            </h2>
            <p className="text-sm text-slate-500 mb-4">انقر على الخريطة لتحديد موقع التوصيل بدقة</p>
            <div className="h-[300px] rounded-xl overflow-hidden border border-slate-200 z-0 relative mb-4">
              <MapContainer center={user?.lat && user?.lng ? [user.lat, user.lng] : [33.5138, 36.2765]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>
            {position && (
              <p className="text-sm text-emerald-600 mt-2 font-medium mb-4">تم تحديد الموقع بنجاح</p>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">العنوان بالتفصيل</label>
              <textarea 
                required
                rows={2}
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="المنطقة، الشارع، البناء، الطابق..."
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              ></textarea>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">طريقة الدفع</h2>
            
            <div className="space-y-3">
              <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="hidden" />
                <Banknote className={`ml-3 ${paymentMethod === 'cod' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <div className="font-bold text-slate-800">الدفع عند الاستلام</div>
                  <div className="text-sm text-slate-500">ادفع نقداً عند استلام طلبك</div>
                </div>
              </label>

              <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'sham_cash' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" name="payment" value="sham_cash" checked={paymentMethod === 'sham_cash'} onChange={() => setPaymentMethod('sham_cash')} className="hidden" />
                <QrCode className={`ml-3 ${paymentMethod === 'sham_cash' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <div className="font-bold text-slate-800">شام كاش (Sham Cash)</div>
                  <div className="text-sm text-slate-500">الدفع عبر تطبيق شام كاش</div>
                </div>
              </label>

              {paymentMethod === 'sham_cash' && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-sm text-slate-600 mb-3">يرجى تحويل المبلغ إلى الرقم: <strong>0900000000</strong> ثم إدخال رقم العملية أدناه.</p>
                  <input 
                    type="text" 
                    placeholder="رقم العملية (Transaction ID)" 
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    required
                  />
                </div>
              )}

              <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'bank_card' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" name="payment" value="bank_card" checked={paymentMethod === 'bank_card'} onChange={() => setPaymentMethod('bank_card')} className="hidden" />
                <CreditCard className={`ml-3 ${paymentMethod === 'bank_card' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <div className="font-bold text-slate-800">بطاقة بنكية محلية</div>
                  <div className="text-sm text-slate-500">الدفع عبر بوابة الدفع الإلكتروني</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-24">
            <h2 className="text-xl font-bold text-slate-800 mb-4">ملخص الطلب</h2>
            
            <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center pb-4 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <img src={item.image || `https://picsum.photos/seed/${item.id}/100/100`} alt={item.name} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.cartQuantity} {item.unit === 'kg' ? 'كغ' : item.unit === 'g' ? 'غ' : 'قطعة'} × {formatPrice(item.price)}</div>
                    </div>
                  </div>
                  <div className="font-bold text-emerald-600">
                    {formatPrice(item.price * item.cartQuantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-500">المجموع الفرعي</span>
                <span className="font-bold text-slate-800">{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-500">رسوم التوصيل</span>
                <span className="font-bold text-slate-800">{formatPrice(5000)}</span>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
                <span className="text-lg font-bold text-slate-800">الإجمالي</span>
                <span className="text-2xl font-bold text-emerald-600">{formatPrice(totalAmount + 5000)}</span>
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                'تأكيد الطلب'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
