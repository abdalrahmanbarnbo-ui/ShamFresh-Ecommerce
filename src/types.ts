export interface Product {
  id: number;
  category_id: number;
  category_name?: string;
  seller_id?: number;
  name: string;
  description: string;
  price: number;
  unit: 'piece' | 'kg' | 'g';
  stock: number;
  image: string;
}

export interface Restaurant {
  id: number;
  name: string;
  store_image?: string;
}

export interface Category {
  id: number;
  name: string;
  image: string;
}

export interface CartItem extends Product {
  cartQuantity: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price_at_time: number;
  product_name: string;
  product_image: string;
  unit: string;
}

export interface Order {
  id: number;
  user_id: number;
  seller_id?: number;
  seller_name?: string;
  user_name?: string;
  user_phone?: string;
  user_address?: string;
  total_amount: number;
  status: 'pending' | 'accepted' | 'out_for_delivery' | 'delivered';
  payment_method: string;
  payment_reference?: string;
  delivery_lat?: number;
  delivery_lng?: number;
  created_at: string;
  rating?: number;
  review?: string;
  items: OrderItem[];
}
