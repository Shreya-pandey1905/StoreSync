import React, { useEffect, useState } from 'react';
import { useDarkMode } from '../context/DarkModeContext.tsx';
import { getCurrentUser, updateProfile } from '../services/authService.ts';
import { Button } from '../components/ui/button.tsx';
import { Input } from '../components/ui/input.tsx';
import { Label } from '../components/ui/label.tsx';
import { toast } from 'react-hot-toast';
import { Settings as SettingsIcon, User, Bell, Monitor, Moon, Sun } from 'lucide-react';

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

  const tabs = [
    { id: 'account' as const, label: 'Account', icon: User },
    { id: 'appearance' as const, label: 'Appearance', icon: Monitor },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm">
        <div className="page-container max-w-3xl py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <SettingsIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">Settings</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage your account preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container max-w-3xl py-4 sm:py-6 lg:py-8">
        {/* Tab Bar */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6 w-fit border border-slate-200 dark:border-slate-700">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-base font-semibold text-slate-800 dark:text-white">Account Information</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Update your name and email address</p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <Label htmlFor="name" className="text-slate-700 dark:text-slate-300 text-sm font-medium">Name</Label>
                <Input
                  id="name"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="mt-2 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="mt-2 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 flex justify-end">
              <button
                onClick={handleAccountSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-base font-semibold text-slate-800 dark:text-white">Appearance</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Choose your preferred theme</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Light Mode Option */}
                <button
                  onClick={() => darkMode && toggleDarkMode()}
                  className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${!darkMode
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                >
                  <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm">
                    <Sun className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Light</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Clean, bright interface</p>
                  </div>
                  {!darkMode && (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Active</span>
                  )}
                </button>

                {/* Dark Mode Option */}
                <button
                  onClick={() => !darkMode && toggleDarkMode()}
                  className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${darkMode
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                >
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center shadow-sm">
                    <Moon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Dark</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Easy on the eyes</p>
                  </div>
                  {darkMode && (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Active</span>
                  )}
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-700">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-white">Dark Mode</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Toggle between light and dark theme</p>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${darkMode ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-base font-semibold text-slate-800 dark:text-white">Notification Preferences</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Control how you receive alerts</p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-700">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-white">Email Notifications</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Receive updates and alerts by email</p>
                </div>
                <button
                  onClick={() => setEmailNotif(!emailNotif)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${emailNotif ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${emailNotif ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 flex justify-end">
              <button
                onClick={handleNotifSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;