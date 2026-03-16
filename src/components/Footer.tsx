import React from 'react';
import { Code2, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 py-6 mt-auto border-t-4 border-emerald-600 z-50">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
        
        {/* اسم المتجر */}
        <div>
          جميع الحقوق محفوظة &copy; {currentYear} - <span className="text-white font-bold">شام فريش</span>
        </div>

        {/* بصمتك كمهندس ورابط لينكد إن */}
        <div className="flex items-center gap-1.5" dir="ltr">
          <Code2 size={16} className="text-emerald-500" />
          <span>Developed & Designed with</span>
          <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" />
          <span>by</span>
          <a 
            href="https://www.linkedin.com/in/abdalrahman-barnbo-79201b3b6" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white font-bold ml-1 hover:text-emerald-400 transition-all cursor-pointer underline decoration-transparent hover:decoration-emerald-400 underline-offset-4"
            title="Visit my LinkedIn profile"
          >
            Abdalrahman Barnbo
          </a>
        </div>

      </div>
    </footer>
  );
}