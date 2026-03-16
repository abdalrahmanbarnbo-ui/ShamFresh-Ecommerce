import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Category, Order } from '../types';
import { Plus, Pencil, Trash2, X, Search, Package, AlertCircle, Save, ClipboardList, CheckCircle, Truck, Clock, Star, Store, MapPin, Upload } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Admin() {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'settings'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // ملف الصورة الجديد للمنتج
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    unit: 'piece',
    stock: 0,
    category_id: 1,
    image: ''
  });

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // ملف الصورة الجديد للمتجر
  const [storeImage, setStoreImage] = useState('');
  const [storeImageFile, setStoreImageFile] = useState<File | null>(null);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [prodRes, catRes, ordRes, meRes] = await Promise.all([
        fetch('/api/admin/products', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/categories'),
        fetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      setProducts(await prodRes.json());
      setCategories(await catRes.json());
      setOrders(await ordRes.json());
      
      const meData = await meRes.json();
      if (meData.user?.store_image) {
        setStoreImage(meData.user.store_image);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        navigate('/');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, navigate]);

  // إنشاء معاينة للصورة عند اختيار ملف
  useEffect(() => {
    if (imageFile) {
      const objectUrl = URL.createObjectURL(imageFile);
      setImagePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setImagePreview(null);
    }
  }, [imageFile]);

  const handleOpenModal = (product?: Product) => {
    setImageFile(null); // تصفير الصورة عند فتح النافذة
    setImagePreview(null);

    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        unit: 'piece',
        stock: 0,
        category_id: categories[0]?.id || 1,
        image: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';

    // استخدام FormData بدلاً من JSON لدعم إرسال الملفات
    const submitData = new FormData();
    submitData.append('name', formData.name || '');
    submitData.append('description', formData.description || '');
    submitData.append('price', String(formData.price || 0));
    submitData.append('unit', formData.unit || 'piece');
    submitData.append('stock', String(formData.stock || 0));
    submitData.append('category_id', String(formData.category_id || 1));
    
    // إذا كان هناك رابط صورة قديم نرسله
    if (formData.image) {
      submitData.append('image', formData.image);
    }
    
    // إذا تم اختيار ملف صورة جديد من الجهاز، نرفقه
    if (imageFile) {
      submitData.append('image', imageFile);
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          // ملاحظة هامة: لا نضع 'Content-Type': 'application/json' هنا
          // المتصفح سيقوم تلقائياً بوضع النوع المناسب لـ FormData
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      });
      if (res.ok) {
        handleCloseModal();
        fetchData();
      } else {
        alert('حدث خطأ أثناء حفظ المنتج');
      }
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء حفظ المنتج');
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/products/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchData();
      } else {
        alert('حدث خطأ أثناء حذف المنتج');
      }
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء حذف المنتج');
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('حدث خطأ أثناء تحديث حالة الطلب');
      }
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء تحديث حالة الطلب');
    }
  };

  const handleUpdateStoreImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const submitData = new FormData();
    if (storeImage) submitData.append('store_image', storeImage);
    if (storeImageFile) submitData.append('image', storeImageFile);

    try {
      const res = await fetch('/api/auth/store-image', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      });
      if (res.ok) {
        alert('تم تحديث صورة المتجر بنجاح');
        fetchData(); // لجلب الصورة المحدثة
      } else {
        alert('حدث خطأ أثناء تحديث صورة المتجر');
      }
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء تحديث صورة المتجر');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.category_name && p.category_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SY', { style: 'currency', currency: 'SYP', maximumFractionDigits: 0 }).format(price);
  };

  if (loading || authLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  );

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Package className="text-emerald-600" size={32} />
            لوحة التحكم
          </h1>
          <p className="text-slate-500 mt-1">إدارة المنتجات والطلبات</p>
        </div>
        
        {activeTab === 'products' && (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 font-bold shadow-sm"
          >
            <Plus size={20} />
            إضافة منتج جديد
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-4 font-bold text-lg flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'products' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Package size={20} />
          المنتجات
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 font-bold text-lg flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'orders' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <ClipboardList size={20} />
          الطلبات
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-4 font-bold text-lg flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'settings' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Store size={20} />
          إعدادات المتجر
        </button>
      </div>

      {activeTab === 'products' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="ابحث عن منتج..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-bold">المنتج</th>
                  <th className="p-4 font-bold">التصنيف</th>
                  <th className="p-4 font-bold">السعر</th>
                  <th className="p-4 font-bold">المخزون</th>
                  <th className="p-4 font-bold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={product.image || `https://picsum.photos/seed/${product.id}/50/50`} 
                          alt={product.name} 
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 shadow-sm" 
                          referrerPolicy="no-referrer" 
                        />
                        <div>
                          <div className="font-bold text-slate-800">{product.name}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[200px]">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {product.category_name || 'غير محدد'}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-emerald-700">
                      {formatPrice(product.price)} <span className="text-slate-400 text-sm font-normal">/ {product.unit === 'kg' ? 'كغ' : product.unit === 'g' ? 'غ' : 'قطعة'}</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stock > 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {product.stock} متوفر
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleOpenModal(product)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm(product.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      لا يوجد منتجات مطابقة للبحث
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'orders' ? (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="text-sm text-slate-500 mb-1">طلب رقم #{order.id}</div>
                  <div className="font-medium text-slate-800">{new Date(order.created_at).toLocaleString('ar-SY')}</div>
                  <div className="text-sm text-slate-600 mt-1 font-bold">العميل: {order.user_name} ({order.user_phone})</div>
                  {order.user_address && (
                    <div className="text-sm text-slate-600 mt-1">العنوان: {order.user_address}</div>
                  )}
                  {order.delivery_lat && order.delivery_lng && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${order.delivery_lat},${order.delivery_lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 mt-2 font-medium"
                    >
                      <MapPin size={16} />
                      عرض الموقع على الخريطة
                    </a>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="font-bold text-emerald-600 text-xl">{formatPrice(order.total_amount + 5000)}</div>
                  <select 
                    value={order.status}
                    onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                    className={`p-2 rounded-lg font-bold text-sm border outline-none ${
                      order.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      order.status === 'accepted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      order.status === 'out_for_delivery' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <option value="pending">قيد الانتظار</option>
                    <option value="accepted">تم القبول (قيد التجهيز)</option>
                    <option value="out_for_delivery">مع عامل التوصيل</option>
                    <option value="delivered">تم التوصيل</option>
                  </select>
                </div>
              </div>
              <div className="p-6">
                <h4 className="font-bold text-slate-800 mb-3">المنتجات:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {order.items?.map(item => (
                    <div key={item.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <img src={item.product_image || `https://picsum.photos/seed/${item.product_id}/50/50`} alt={item.product_name} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <div>
                        <div className="font-medium text-slate-800 text-sm">{item.product_name}</div>
                        <div className="text-xs text-slate-500">{item.quantity} {item.unit === 'kg' ? 'كغ' : item.unit === 'g' ? 'غ' : 'قطعة'}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {order.rating && (
                  <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <Star className="text-amber-500 fill-amber-500" size={18} />
                      تقييم العميل
                    </h4>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={16} className={star <= order.rating! ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                      ))}
                    </div>
                    {order.review && <p className="text-slate-600 text-sm italic">"{order.review}"</p>}
                  </div>
                )}
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
              <ClipboardList className="mx-auto text-slate-300 mb-4" size={64} />
              <h2 className="text-xl font-bold text-slate-600">لا يوجد طلبات حالياً</h2>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Store className="text-emerald-600" size={24} />
            إعدادات المتجر
          </h2>
          
          <form onSubmit={handleUpdateStoreImage} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">تغيير صورة المتجر (رفع من الجهاز)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={e => {
                  setStoreImageFile(e.target.files?.[0] || null);
                  // إفراغ الرابط القديم لتجنب التعارض
                  if (e.target.files?.[0]) setStoreImage('');
                }}
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="h-px bg-slate-200 flex-grow"></div>
              <span className="text-slate-400 text-sm font-bold">أو</span>
              <div className="h-px bg-slate-200 flex-grow"></div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">رابط صورة المتجر (URL)</label>
              <input 
                type="url" 
                value={storeImage}
                onChange={e => {
                  setStoreImage(e.target.value);
                  setStoreImageFile(null); // مسح الملف المختار
                }}
                placeholder="https://example.com/store-image.jpg"
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-left"
                dir="ltr"
              />
            </div>
            
            {/* معاينة صورة المتجر */}
            {(storeImage || storeImageFile) && (
              <div className="mt-4">
                <p className="text-sm font-bold text-slate-700 mb-2">معاينة الصورة:</p>
                <div className="relative aspect-[4/3] w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <img 
                    src={storeImageFile ? URL.createObjectURL(storeImageFile) : storeImage} 
                    alt="معاينة المتجر" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=صورة+غير+صالحة';
                    }}
                  />
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button 
                type="submit"
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <Save size={18} />
                حفظ الإعدادات
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">
                {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* قسم الصورة - تم التعديل عليه ليدعم رفع الملفات */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Upload size={18} className="text-emerald-600" />
                    صورة المنتج
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="space-y-4 flex-grow">
                      <div>
                        <label className="text-sm font-bold text-slate-700 block mb-2">رفع صورة من الجهاز</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={e => {
                            setImageFile(e.target.files?.[0] || null);
                            if (e.target.files?.[0]) setFormData({...formData, image: ''}); // مسح الرابط إذا اختار ملف
                          }}
                          className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 cursor-pointer transition-colors"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="h-px bg-slate-200 flex-grow"></div>
                        <span className="text-slate-400 text-xs font-bold">أو</span>
                        <div className="h-px bg-slate-200 flex-grow"></div>
                      </div>

                      <div>
                        <label className="text-sm font-bold text-slate-700 block mb-2">وضع رابط صورة (URL)</label>
                        <input 
                          type="url" 
                          value={formData.image || ''}
                          onChange={e => {
                            setFormData({...formData, image: e.target.value});
                            setImageFile(null); // مسح الملف إذا كتب رابط
                            setImagePreview(null);
                          }}
                          placeholder="https://example.com/image.jpg"
                          className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-left"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* مربع معاينة الصورة */}
                    <div className="w-full sm:w-32 h-32 flex-shrink-0 border-2 border-dashed border-slate-300 rounded-xl overflow-hidden flex items-center justify-center bg-white relative group">
                      {(imagePreview || formData.image) ? (
                        <img 
                          src={imagePreview || formData.image} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=لا+توجد+صورة';
                          }}
                        />
                      ) : (
                        <div className="text-center text-slate-400">
                          <Package size={24} className="mx-auto mb-1 opacity-50" />
                          <span className="text-xs">معاينة</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">اسم المنتج</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">التصنيف</label>
                    <select 
                      value={formData.category_id}
                      onChange={e => setFormData({...formData, category_id: Number(e.target.value)})}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">السعر (ل.س)</label>
                    <input 
                      type="number" 
                      required min="0"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">وحدة القياس</label>
                    <select 
                      value={formData.unit}
                      onChange={e => setFormData({...formData, unit: e.target.value as any})}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="piece">قطعة</option>
                      <option value="kg">كيلوغرام</option>
                      <option value="g">غرام</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">المخزون المتوفر</label>
                    <input 
                      type="number" 
                      required min="0" step="any"
                      value={formData.stock}
                      onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">الوصف</label>
                  <textarea 
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  ></textarea>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={handleCloseModal}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
              <button 
                type="submit"
                form="product-form"
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <Save size={18} />
                {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">تأكيد الحذف</h3>
            <p className="text-slate-500 mb-6">هل أنت متأكد أنك تريد حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={() => handleDelete(deleteConfirm)}
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                نعم، احذف المنتج
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}