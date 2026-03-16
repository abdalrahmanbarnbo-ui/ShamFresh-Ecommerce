import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, CartItem, Restaurant } from '../types';
import ProductCard from '../components/ProductCard';
import { Store, ArrowRight } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface RestaurantDetailsProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export default function RestaurantDetails({ cart, setCart }: RestaurantDetailsProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch restaurant details and products
    Promise.all([
      fetch(`/api/restaurants`),
      fetch(`/api/restaurants/${id}/products`)
    ])
      .then(async ([resRestaurants, resProducts]) => {
        if (!resRestaurants.ok || !resProducts.ok) throw new Error('Failed to fetch data');
        const restaurants: Restaurant[] = await resRestaurants.json();
        const productsData: Product[] = await resProducts.json();
        
        const currentRestaurant = restaurants.find(r => r.id === Number(id));
        if (currentRestaurant) setRestaurant(currentRestaurant);
        
        setProducts(productsData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('حدث خطأ أثناء تحميل بيانات المطعم');
        setLoading(false);
      });
  }, [id]);

  const handleAdd = (product: Product) => {
    if (user?.role === 'admin') {
      alert('حسابات البائعين لا يمكنها إجراء طلبات');
      return;
    }
    setCart(prev => {
      // Check if cart has items from a different seller
      if (prev.length > 0 && prev[0].seller_id !== product.seller_id) {
        if (window.confirm('لديك منتجات من مطعم آخر في السلة. هل تريد تفريغ السلة وإضافة هذا المنتج؟')) {
          return [{ ...product, cartQuantity: product.unit === 'kg' ? 0.5 : 1 }];
        }
        return prev;
      }

      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, cartQuantity: item.cartQuantity + (product.unit === 'kg' ? 0.5 : 1) } 
            : item
        );
      }
      return [...prev, { ...product, cartQuantity: product.unit === 'kg' ? 0.5 : 1 }];
    });
  };

  const handleRemove = (productId: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (!existing) return prev;
      
      const decrement = existing.unit === 'kg' ? 0.5 : 1;
      if (existing.cartQuantity <= decrement) {
        return prev.filter(item => item.id !== productId);
      }
      
      return prev.map(item => 
        item.id === productId 
          ? { ...item, cartQuantity: item.cartQuantity - decrement } 
          : item
      );
    });
  };

  const getQuantity = (productId: number) => {
    return cart.find(item => item.id === productId)?.cartQuantity || 0;
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;
  if (error) return <div className="text-center text-red-500 p-8">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center text-slate-500 hover:text-emerald-600 mb-6 transition-colors"
      >
        <ArrowRight className="w-5 h-5 ml-2" />
        العودة للمطاعم
      </button>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 flex items-center gap-6">
        <div className="w-24 h-24 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {restaurant?.store_image ? (
            <img src={restaurant.store_image} alt={restaurant.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <Store className="w-10 h-10 text-slate-400" />
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{restaurant?.name || 'مطعم غير معروف'}</h1>
          <p className="text-slate-500">تصفح واطلب من منتجاتنا الطازجة</p>
        </div>
      </div>
      
      {products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <Store className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">لا يوجد منتجات</h3>
          <p className="text-slate-500">هذا المطعم لم يقم بإضافة أي منتجات بعد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              quantity={getQuantity(product.id)}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
