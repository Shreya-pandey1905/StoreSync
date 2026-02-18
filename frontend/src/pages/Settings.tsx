import React, { useEffect, useState } from 'react';
import { useDarkMode } from '../context/DarkModeContext.tsx';
import { getCurrentUser, updateProfile } from '../services/authService.ts';
import { Button } from '../components/ui/button.tsx';
import { Input } from '../components/ui/input.tsx';
import { Label } from '../components/ui/label.tsx';
import { toast } from 'react-hot-toast';

const Settings: React.FC = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [userForm, setUserForm] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'notifications'>('account');

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUserForm({ name: (user as any).name || '', email: (user as any).email || '' });
    }
    const savedNotif = localStorage.getItem('pref_email_notifications');
    if (savedNotif !== null) setEmailNotif(JSON.parse(savedNotif));
  }, []);

  const handleAccountSave = async () => {
    setSaving(true);
    try {
      try {
        const updated = await updateProfile({ name: userForm.name, email: userForm.email } as any);
        localStorage.setItem('currentUser', JSON.stringify(updated));
      } catch (apiErr) {
        const current = getCurrentUser();
        if (current) {
          const merged = { ...current, name: userForm.name, email: userForm.email };
          localStorage.setItem('currentUser', JSON.stringify(merged));
        }
      }
      toast.success('Account updated');
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleNotifSave = () => {
    localStorage.setItem('pref_email_notifications', JSON.stringify(emailNotif));
    toast.success('Preferences saved');
  };

  return (
    <div className={`p-6 min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <div className={`mb-6 inline-flex h-10 items-center justify-center rounded-md p-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          {(['account', 'appearance', 'notifications'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${activeTab === tab ? (darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 shadow-sm') : ''}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'account' && (
          <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <h2 className="text-xl font-semibold mb-4">Account</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className={`mt-2 ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`}
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className={`mt-2 ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`}
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleAccountSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <h2 className="text-xl font-semibold mb-4">Appearance</h2>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="darkmode">Dark Mode</Label>
                <p className="text-sm text-gray-500">Toggle between light and dark theme</p>
              </div>
              <input
                id="darkmode"
                type="checkbox"
                checked={darkMode}
                onChange={() => toggleDarkMode()}
                className="h-5 w-5 accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <h2 className="text-xl font-semibold mb-4">Notifications</h2>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotif">Email notifications</Label>
                <p className="text-sm text-gray-500">Receive updates by email</p>
              </div>
              <input
                id="emailNotif"
                type="checkbox"
                checked={emailNotif}
                onChange={(e) => setEmailNotif(e.target.checked)}
                className="h-5 w-5 accent-blue-600 cursor-pointer"
              />
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleNotifSave}>Save Preferences</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;