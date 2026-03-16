import React from 'react';
import { Plus, Minus, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { useAuth } from '../AuthContext';

interface ProductCardProps {
  product: Product;
  quantity: number;
  onAdd: (product: Product) => void;
  onRemove: (productId: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, quantity, onAdd, onRemove }) => {
  const { user } = useAuth();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SY', { style: 'currency', currency: 'SYP', maximumFractionDigits: 0 }).format(price);
  };

  const getUnitLabel = (unit: string) => {
    switch (unit) {
      case 'kg': return 'كغ';
      case 'g': return 'غرام';
      case 'piece': return 'قطعة';
      default: return unit;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-slate-100 flex flex-col h-full">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img 
          src={product.image || `https://picsum.photos/seed/${product.id}/400/300`} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          referrerPolicy="no-referrer"
        />
        {product.category_name && (
          <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            {product.category_name}
          </span>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-slate-800 text-lg mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-slate-500 text-sm mb-3 line-clamp-2 flex-grow">{product.description}</p>
        
        <div className="flex items-end justify-between mt-auto mb-4">
          <div>
            <span className="text-emerald-600 font-bold text-xl">{formatPrice(product.price)}</span>
            <span className="text-slate-400 text-sm mr-1">/ {getUnitLabel(product.unit)}</span>
          </div>
        </div>
        
        {user?.role !== 'admin' && (
          quantity > 0 ? (
            <div className="flex items-center justify-between bg-emerald-50 rounded-xl p-1 border border-emerald-100">
              <button 
                onClick={() => onRemove(product.id)}
                className="w-10 h-10 flex items-center justify-center bg-white text-emerald-600 rounded-lg shadow-sm hover:bg-emerald-100 transition-colors"
              >
                <Minus size={20} />
              </button>
              <span className="font-bold text-emerald-800 w-12 text-center">
                {product.unit === 'kg' ? quantity.toFixed(1) : quantity}
              </span>
              <button 
                onClick={() => onAdd(product)}
                className="w-10 h-10 flex items-center justify-center bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => onAdd(product)}
              className="w-full py-3 flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium"
            >
              <ShoppingBag size={18} />
              <span>أضف للسلة</span>
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default ProductCard;
