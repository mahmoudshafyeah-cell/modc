"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase"; // ✅ استخدم العميل الجاهز
import { jwtDecode } from "jwt-decode";

const loginSchema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // 1. تسجيل الدخول مباشرة عبر Supabase Auth باستخدام العميل الجاهز
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        toast.error(authError.message || 'فشل تسجيل الدخول');
        setIsLoading(false);
        return;
      }

      const session = authData.session;
      if (!session) {
        toast.error('لم يتم استلام جلسة المصادقة');
        setIsLoading(false);
        return;
      }

      // تخزين التوكن
      localStorage.setItem('auth_token', session.access_token);

      // 2. جلب دور المستخدم من جدول profiles (باستخدام supabase العادي – لكن بعد تسجيل الدخول سيكون التوكن مضمنًا)
      // نستخدم supabase.admin مباشرة؟ الأسهل: نستدعي API مخصص لجلب الدور حتى لا نضطر لاستخدام service role.
      // بدلاً من ذلك، يمكننا قراءة الدور من التوكن إذا كان مضمنًا في user_metadata.
      // لنحاول أولاً قراءة الدور من التوكن:
      let role = 'customer';
      try {
        const decoded: any = jwtDecode(session.access_token);
        role = decoded.role || decoded.user_metadata?.role || 'customer';
      } catch {
        // إذا لم نستطع فك التوكن، نستخدم طريقة احتياطية: جلب الدور من profiles عبر API بسيط
        try {
          const res = await fetch('/api/user/role', {
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          const roleData = await res.json();
          if (res.ok && roleData.role) role = roleData.role;
        } catch {}
      }

      // 3. تحديد مسار التوجيه
      let redirectPath = '/customer-dashboard';
      if (role === 'super_admin' || role === 'admin') redirectPath = '/dashboard';
      else if (role === 'agent' || role === 'sub_agent') redirectPath = '/agent-dashboard';

      toast.success('تم تسجيل الدخول بنجاح');
      window.location.href = redirectPath;
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ غير متوقع');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">البريد الإلكتروني</label>
        <div className="relative">
          <Mail className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            {...register("email")}
            placeholder="example@domain.com"
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-10 pl-3 text-right text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">كلمة المرور</label>
        <div className="relative">
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
          <Lock className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            {...register("password")}
            placeholder="••••••••"
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-10 pl-10 text-right text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input type="checkbox" {...register("remember")} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          تذكرني
        </label>
        <Link href="/auth/reset-password" className="text-sm text-blue-600 hover:underline dark:text-blue-400">نسيت كلمة المرور؟</Link>
      </div>

      <button type="submit" disabled={isLoading} className="w-full rounded-lg bg-blue-600 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70">
        {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
      </button>
    </form>
  );
}