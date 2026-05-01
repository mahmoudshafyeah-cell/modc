'use client';
import { useState } from 'react';
import ProfileSettings from './ProfileSettings';
import SecuritySettings from './SecuritySettings';
import AboutSettings from './AboutSettings';

type Tab = 'profile' | 'security' | 'about';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold text-white">الإعدادات</h1>

      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {[
          { id: 'profile' as Tab, label: 'الملف الشخصي' },
          { id: 'security' as Tab, label: 'الأمان' },
          { id: 'about' as Tab, label: 'حول' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-violet-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'profile' && <ProfileSettings />}
        {activeTab === 'security' && <SecuritySettings />}
        {activeTab === 'about' && <AboutSettings />}
      </div>
    </div>
  );
}