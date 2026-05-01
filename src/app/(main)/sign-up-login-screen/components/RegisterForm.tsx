// src/app/(main)/sign-up-login-screen/components/RegisterForm.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2, Gift } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface RegisterValues {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: "customer" | "agent" | "vendor";
  terms: boolean;
  promoCode: string; // 🆕 برومو كود الوكيل
}

const roles = [
  { value: "customer", label: "عميل", desc: "شراء المنتجات الرقمية", icon: "🛒", color: "#6C3AFF", disabled: false },
  { value: "agent", label: "وكيل", desc: "وكيل رسمي للمنصة", icon: "💼", color: "#00D4FF", disabled: false },
  { value: "vendor", label: " (محل تجاري)", desc: "متوقف حالياً", icon: "🏪", color: "#FFB800", disabled: true },
];

export default function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const searchParams = useSearchParams();
  const refId = searchParams.get("ref");
  const promoCodeFromUrl = searchParams.get("code");
  const regType = searchParams.get("type");
  const isSubAgent = regType === "sub-agent";

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterValues>({
    defaultValues: { role: "customer", promoCode: "" },
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const selectedRole = watch("role");

  // إذا جاء من رابط دعوة وكيل فرعي، أجبره على دور وكيل واملأ البرومو كود تلقائياً
  useEffect(() => {
    if (isSubAgent) {
      setValue("role", "agent");
      if (promoCodeFromUrl) {
        setValue("promoCode", promoCodeFromUrl);
      }
      toast.info("أنت تنضم كوكيل فرعي عبر رابط دعوة 🎁", { duration: 5000 });
    }
  }, [isSubAgent, promoCodeFromUrl, setValue]);

  const onSubmit = async (data: RegisterValues) => {
    setLoading(true);
    try {
      // 1. إنشاء الحساب
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
            requested_role: data.role,
            promo_code: data.promoCode || null, // 🆕 إرسال البرومو كود
            ...(isSubAgent && {
              ref_agent_id: refId,
              promo_code: promoCodeFromUrl,
              is_sub_agent: true,
            }),
          },
        },
      });

      if (signUpError) {
        console.error("SignUp error:", signUpError);
        toast.error(signUpError.message);
        setLoading(false);
        return;
      }

      const userId = authData?.user?.id;
      if (!userId) {
        toast.error("لم يتم إنشاء الحساب – يرجى المحاولة لاحقاً");
        setLoading(false);
        return;
      }

      // 2. استدعاء API Route لإكمال الملف الشخصي (server-side)
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          fullName: data.fullName,
          phone: data.phone,
          role: data.role,
          isSubAgent,
          refId,
          promoCode: data.promoCode || null, // 🆕 إرسال البرومو كود للـ API
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Complete profile error:", err);
      }

      toast.success("تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب.");
      setTimeout(() => onSwitch(), 3000);
    } catch (err: any) {
      console.error("Unexpected error:", err);
      toast.error(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" dir="rtl">
      {/* 🎁 إشعار الدعوة عبر الرابط */}
      {isSubAgent && (
        <div
          className="rounded-xl p-4 text-center flex items-center gap-2 justify-center"
          style={{
            background: "rgba(0, 255, 148, 0.1)",
            border: "1px solid rgba(0, 255, 148, 0.3)",
          }}
        >
          <Gift size={20} className="text-green-400" />
          <span className="text-green-400 text-sm font-bold">
            أنت تنضم كوكيل فرعي عبر رابط دعوة!
          </span>
        </div>
      )}

      {/* اختيار الدور */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-2">نوع الحساب</label>
        <div className="grid grid-cols-3 gap-3">
          {roles.map((role) => (
            <button
              key={role.value}
              type="button"
              disabled={role.disabled || (isSubAgent && role.value !== "agent")}
              onClick={() => {
                if (!role.disabled && !(isSubAgent && role.value !== "agent"))
                  setValue("role", role.value as any);
              }}
              className={`rounded-xl p-4 text-center transition-all ${
                selectedRole === role.value ? "ring-2" : ""
              } ${role.disabled || (isSubAgent && role.value !== "agent") ? "opacity-50 cursor-not-allowed" : ""}`}
              style={{
                background:
                  selectedRole === role.value ? `${role.color}20` : "rgba(255,255,255,0.03)",
                border: `1px solid ${
                  selectedRole === role.value ? role.color : "rgba(255,255,255,0.08)"
                }`,
              }}
            >
              <div className="text-2xl mb-1">{role.icon}</div>
              <div
                className="text-xs font-bold"
                style={{ color: selectedRole === role.value ? role.color : "#9999BB" }}
              >
                {role.label}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{role.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* الاسم الكامل */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-1">الاسم الكامل</label>
        <div className="relative">
          <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="ادخل اسمك كاملاً"
            className="w-full rounded-xl border border-gray-700 bg-gray-900/50 py-3 pr-10 pl-3 text-right text-white placeholder:text-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            {...register("fullName", {
              required: "الاسم الكامل مطلوب",
              minLength: { value: 3, message: "الاسم يجب أن يكون 3 أحرف على الأقل" },
            })}
          />
        </div>
        {errors.fullName && <p className="mt-1 text-xs text-red-400">{errors.fullName.message}</p>}
      </div>

      {/* البريد الإلكتروني */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-1">البريد الإلكتروني</label>
        <div className="relative">
          <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-xl border border-gray-700 bg-gray-900/50 py-3 pr-10 pl-3 text-right text-white placeholder:text-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            {...register("email", {
              required: "البريد الإلكتروني مطلوب",
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "بريد غير صحيح" },
            })}
          />
        </div>
        {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
      </div>

      {/* رقم الهاتف */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-1">رقم الهاتف</label>
        <div className="relative">
          <Phone size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="tel"
            placeholder="09XXXXXXXX"
            className="w-full rounded-xl border border-gray-700 bg-gray-900/50 py-3 pr-10 pl-3 text-right text-white placeholder:text-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            dir="ltr"
            {...register("phone", { required: "رقم الهاتف مطلوب" })}
          />
        </div>
        {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>}
      </div>

      {/* 🆕 برومو كود الوكيل - اختياري */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-1">
          كود الدعوة / برومو كود الوكيل <span className="text-gray-500 text-xs">(اختياري)</span>
        </label>
        <div className="relative">
          <Gift size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="مثال: AGT-123ABC"
            className="w-full rounded-xl border border-gray-700 bg-gray-900/50 py-3 pr-10 pl-3 text-right text-white placeholder:text-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            dir="ltr"
            {...register("promoCode")}
          />
        </div>
      </div>

      {/* كلمة المرور */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-1">كلمة المرور</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            className="w-full rounded-xl border border-gray-700 bg-gray-900/50 py-3 pr-10 pl-10 text-right text-white placeholder:text-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            {...register("password", {
              required: "كلمة المرور مطلوبة",
              minLength: { value: 6, message: "كلمة المرور 6 أحرف على الأقل" },
            })}
          />
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
      </div>

      {/* تأكيد كلمة المرور */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-1">تأكيد كلمة المرور</label>
        <div className="relative">
          <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="password"
            placeholder="••••••••"
            className="w-full rounded-xl border border-gray-700 bg-gray-900/50 py-3 pr-10 text-right text-white placeholder:text-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            {...register("confirmPassword", {
              required: "تأكيد كلمة المرور مطلوب",
              validate: (val) => val === watch("password") || "كلمتا المرور غير متطابقتين",
            })}
          />
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* الموافقة على الشروط */}
      <label className="flex items-start gap-3 cursor-pointer pt-2">
        <input
          type="checkbox"
          className="mt-0.5 rounded"
          {...register("terms", { required: "يجب الموافقة على الشروط" })}
        />
        <span className="text-sm text-gray-400">
          أوافق على{" "}
          <a href="#" className="text-violet-400 hover:underline">
            شروط الاستخدام
          </a>{" "}
          و{" "}
          <a href="#" className="text-violet-400 hover:underline">
            سياسة الخصوصية
          </a>
        </span>
      </label>
      {errors.terms && <p className="text-xs text-red-400">{errors.terms.message}</p>}

      {/* زر التسجيل */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" /> جاري إنشاء الحساب...
          </>
        ) : isSubAgent ? (
          "الانضمام كوكيل فرعي 🎁"
        ) : (
          "إنشاء حساب مجاني"
        )}
      </button>

      <p className="text-center text-sm text-gray-400 pt-3">
        لديك حساب بالفعل؟{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="text-violet-400 font-semibold hover:text-violet-300"
        >
          سجل دخولك
        </button>
      </p>
    </form>
  );
}