import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: typeof LucideIcon;
  color: 'blue' | 'green' | 'red' | 'purple';
  trend?: string;
}

const colorVariants = {
  blue: {
    bg: 'from-blue-500 to-indigo-600',
    icon: 'text-blue-600',
    accent: 'bg-blue-50'
  },
  green: {
    bg: 'from-green-500 to-emerald-600',
    icon: 'text-green-600',
    accent: 'bg-green-50'
  },
  red: {
    bg: 'from-red-500 to-rose-600',
    icon: 'text-red-600',
    accent: 'bg-red-50'
  },
  purple: {
    bg: 'from-purple-500 to-pink-600',
    icon: 'text-purple-600',
    accent: 'bg-purple-50'
  }
};

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  const variant = colorVariants[color];

  return (
    <div className="relative overflow-hidden bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-slate-700/60 p-6 shadow-lg dark:shadow-slate-900/20 hover:shadow-2xl dark:hover:shadow-slate-900/40 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${variant.accent} dark:bg-slate-700/50 shadow-sm transition-transform duration-300 group-hover:scale-110`}>
          <Icon className={`h-6 w-6 ${variant.icon} dark:text-blue-400`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full shadow-sm ${trend.startsWith('+')
            ? 'bg-green-600 text-white'
            : trend.startsWith('-')
              ? 'bg-red-600 text-white'
              : 'bg-slate-600 text-white'
            }`}>
            {trend.startsWith('+') ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            ) : trend.startsWith('-') ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
            ) : null}
            <span className="text-xs font-bold">{trend}</span>
          </div>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white transition-all duration-300 group-hover:tracking-tight">{value}</p>
      </div>

      {/* Gradient accent */}
      <div className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${variant.bg} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-full mx-2 mb-1.5`} />
    </div>
  );
};

export default StatsCard;