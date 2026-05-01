import Link from 'next/link';
import { Shield, FileText, HelpCircle } from 'lucide-react';

export default function AboutSettings() {
  return (
    <div className="bg-dark-100 p-6 rounded-xl border border-gray-700 space-y-3">
      <Link href="/legal/privacy-policy" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors">
        <span className="text-white">سياسة الخصوصية</span>
        <Shield size={18} className="text-violet-400" />
      </Link>
      <Link href="/legal/terms-of-service" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors">
        <span className="text-white">شروط الاستخدام</span>
        <FileText size={18} className="text-violet-400" />
      </Link>
      <Link href="/legal/faq" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors">
        <span className="text-white">الأسئلة الشائعة</span>
        <HelpCircle size={18} className="text-violet-400" />
      </Link>
      <div className="pt-4 text-center text-gray-400 text-sm">
        <p>الإصدار 1.0.0</p>
        <p className="mt-1">Made with React by Mahmoud Shafyeh 2026</p>
      </div>
    </div>
  );
}