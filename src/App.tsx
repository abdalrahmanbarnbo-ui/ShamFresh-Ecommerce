import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import RestaurantDetails from './pages/RestaurantDetails';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SystemAdmin from './pages/SystemAdmin';
import { CartItem } from './types';
import { AuthProvider } from './AuthContext';
import { SettingsProvider } from './SettingsContext'; // 👈 استدعاء ملف الإعدادات

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);

  return (
    <AuthProvider>
      <SettingsProvider> {/* 👈 تغليف التطبيق هنا */}
        <Router>
          {/* لاحظ أننا أضفنا dark:bg-slate-900 للوضع الليلي، وأزلنا dir="rtl" الثابتة */}
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 font-sans flex flex-col text-slate-900 dark:text-slate-100">
            <Header cartCount={cart.length} />
            
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/restaurant/:id" element={<RestaurantDetails cart={cart} setCart={setCart} />} />
                <Route path="/checkout" element={<Checkout cart={cart} setCart={setCart} />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/system-admin" element={<SystemAdmin />} />
              </Routes>
            </main>

            <Footer />
          </div>
        </Router>
      </SettingsProvider>
    </AuthProvider>
  );
}