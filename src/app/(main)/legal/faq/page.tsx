import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 3600;

async function getPageContent(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase.from('legal_pages').select('title, content').eq('slug', slug).single();
  return data || { title: 'الأسئلة الشائعة', content: '<p>المحتوى غير متوفر حالياً.</p>' };
}

export default async function FAQPage() {
  const page = await getPageContent('faq');

  return (
    <div className="min-h-screen bg-dark-50 text-white p-8 md:p-12" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/homepage"
          className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>الرجوع إلى الصفحة الرئيسية</span>
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-l from-violet-400 to-cyan-400 bg-clip-text text-transparent">
          {page.title}
        </h1>
        <div
          className="prose prose-invert prose-violet max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </div>
  );
}