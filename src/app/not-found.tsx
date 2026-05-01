'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Home } from 'lucide-react';

export default function NotFound() {
    const router = useRouter();

    return (
        <div
            className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
            style={{ background: '#0A0A14' }}
            dir="rtl"
        >
            {/* تأثيرات خلفية متحركة (نيون) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10"
                    style={{
                        background: 'radial-gradient(circle, rgba(108,58,255,0.6), transparent)',
                        filter: 'blur(40px)',
                    }}
                />
                <div
                    className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
                    style={{
                        background: 'radial-gradient(circle, rgba(0,212,255,0.6), transparent)',
                        filter: 'blur(40px)',
                    }}
                />
            </div>

            <div className="relative z-10 w-full max-w-lg text-center">
                {/* رقم 404 بتصميم عصري متدرج */}
                <div className="relative mb-8 select-none">
                    <h1
                        className="text-[150px] md:text-[200px] font-black leading-none"
                        style={{
                            background: 'linear-gradient(135deg, rgba(108,58,255,0.4), rgba(0,212,255,0.2))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-5xl md:text-6xl" role="img" aria-label="مرتبك">🧭</span>
                    </div>
                </div>

                {/* العنوان والوصف بالعربية */}
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                    الصفحة غير موجودة
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-md mx-auto">
                    يبدو أنك قد ضللت الطريق! الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
                    لا تقلق، يمكننا مساعدتك في العودة.
                </p>

                {/* أزرار الإجراء */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/homepage"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95"
                        style={{
                            background: 'linear-gradient(135deg, #6C3AFF, #00D4FF)',
                            boxShadow: '0 6px 20px rgba(108,58,255,0.3)',
                        }}
                    >
                        <Home size={18} />
                        <span>الرئيسية</span>
                    </Link>

                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold transition-all duration-200 hover:scale-105 active:scale-95"
                        style={{
                            background: 'rgba(108,58,255,0.1)',
                            border: '1px solid rgba(108,58,255,0.3)',
                            color: '#B899FF',
                        }}
                    >
                        <ArrowRight size={18} />
                        <span>العودة للخلف</span>
                    </button>
                </div>

                {/* تلميح للدعم الفني */}
                <p className="text-gray-600 text-sm mt-8">
                    أو تواصل مع الدعم الفني إذا كنت تعتقد أن هذا خطأ.
                </p>
            </div>
        </div>
    );
}