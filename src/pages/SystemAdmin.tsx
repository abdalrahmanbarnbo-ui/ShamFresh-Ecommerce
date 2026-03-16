import React, { useState, useEffect } from 'react';
import { Shield, Key, Copy, CheckCircle, Plus } from 'lucide-react';

interface ActivationCode {
  id: number;
  code: string;
  used: number;
  created_at: string;
}

export default function SystemAdmin() {
  const [masterKey, setMasterKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchCodes = async (key: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/system/activation-codes', {
        headers: {
          'x-master-key': key
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setCodes(data);
        setIsAuthenticated(true);
      } else {
        setError('كلمة المرور غير صحيحة');
        setIsAuthenticated(false);
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCodes(masterKey);
  };

  const generateCode = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/activation-codes', {
        method: 'POST',
        headers: {
          'x-master-key': masterKey
        }
      });
      
      if (res.ok) {
        fetchCodes(masterKey);
      } else {
        setError('فشل في توليد كود جديد');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="text-center mb-8">
            <Shield className="mx-auto h-12 w-12 text-slate-800" />
            <h2 className="mt-4 text-3xl font-bold text-slate-800">إدارة النظام</h2>
            <p className="mt-2 text-slate-500">أدخل كلمة المرور الخاصة بإدارة المنصة</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm font-medium text-center">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور الرئيسية</label>
              <input
                type="password"
                required
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-800 outline-none text-left"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-slate-800 text-white p-3 rounded-xl font-bold hover:bg-slate-900 transition-colors disabled:opacity-70"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Key size={20} />
                  دخول
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Shield className="text-slate-800" size={32} />
            إدارة أكواد التفعيل
          </h1>
          <p className="text-slate-500 mt-1">توليد وإدارة أكواد تفعيل حسابات البائعين</p>
        </div>
        
        <button 
          onClick={generateCode}
          disabled={loading}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 font-bold shadow-sm disabled:opacity-70"
        >
          <Plus size={20} />
          توليد كود جديد
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase tracking-wider">
              <tr>
                <th className="p-4 font-bold">الكود</th>
                <th className="p-4 font-bold">الحالة</th>
                <th className="p-4 font-bold">تاريخ الإنشاء</th>
                <th className="p-4 font-bold text-center">نسخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    لا يوجد أكواد تفعيل مسبقة. قم بتوليد كود جديد.
                  </td>
                </tr>
              ) : (
                codes.map(code => (
                  <tr key={code.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <span className="font-mono font-bold text-lg tracking-widest text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
                        {code.code}
                      </span>
                    </td>
                    <td className="p-4">
                      {code.used ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          مستخدم
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                          متاح
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 text-sm">
                      {new Date(code.created_at).toLocaleString('ar-SY')}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-flex"
                        title="نسخ الكود"
                      >
                        {copiedCode === code.code ? (
                          <CheckCircle size={20} className="text-emerald-600" />
                        ) : (
                          <Copy size={20} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
