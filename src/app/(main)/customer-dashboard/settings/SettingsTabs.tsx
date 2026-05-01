'use client';
import { useState } from 'react';
import ProfileSettings from './ProfileSettings';
import SecuritySettings from './SecuritySettings';
import AboutSettings from './AboutSettings';

type Tab = 'profile' | 'security' | 'about';

export default function SettingsTabs({ userId, initialProfile }: { userId: string; initialProfile: any }) {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 ${activeTab === 'profile' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
        >
          الملف الشخصي
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 ${activeTab === 'security' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
        >
          الأمان
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`px-4 py-2 ${activeTab === 'about' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
        >
          حول
        </button>
      </div>

      {activeTab === 'profile' && <ProfileSettings userId={userId} initialProfile={initialProfile} />}
      {activeTab === 'security' && <SecuritySettings />}
      {activeTab === 'about' && <AboutSettings />}
    </div>
  );
}