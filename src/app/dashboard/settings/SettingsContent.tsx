'use client';
import { useState, useEffect } from 'react';
import PaymentMethodsManager from './PaymentMethodsManager';
import WithdrawalMethodsManager from './WithdrawalMethodsManager';
import GeneralSettings from './GeneralSettings';
import NotificationSettings from './NotificationSettings';
import LegalPagesManager from './LegalPagesManager';
import { toast } from 'sonner';

type SettingTab = 'payment-methods' | 'withdrawal-methods' | 'notifications' | 'general' | 'legal';

export default function SettingsContent() {
  const [activeTab, setActiveTab] = useState<SettingTab>('payment-methods');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setIsSuperAdmin(decoded.role === 'super_admin');
      } catch {}
    }
  }, []);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold text-white">الإعدادات</h1>

      <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-2">
        <button
          onClick={() => setActiveTab('payment-methods')}
          className={`px-4 py-2 ${activeTab === 'payment-methods' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
        >
          طرق الدفع
        </button>
        <button
          onClick={() => setActiveTab('withdrawal-methods')}
          className={`px-4 py-2 ${activeTab === 'withdrawal-methods' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
        >
          طرق السحب
        </button>
        {isSuperAdmin && (
          <>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-2 ${activeTab === 'notifications' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
            >
              الإشعارات
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 py-2 ${activeTab === 'general' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
            >
              عام
            </button>
            <button
              onClick={() => setActiveTab('legal')}
              className={`px-4 py-2 ${activeTab === 'legal' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
            >
              الصفحات القانونية
            </button>
          </>
        )}
      </div>

      {activeTab === 'payment-methods' && <PaymentMethodsManager />}
      {activeTab === 'withdrawal-methods' && <WithdrawalMethodsManager />}
      {activeTab === 'notifications' && <NotificationSettings />}
      {activeTab === 'general' && <GeneralSettings />}
      {activeTab === 'legal' && <LegalPagesManager />}
    </div>
  );
}