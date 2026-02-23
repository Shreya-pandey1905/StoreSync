import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: typeof LucideIcon;
  color: 'blue' | 'emerald' | 'amber' | 'red' | 'indigo' | 'green' | 'purple' | 'violet';
  trend?: string;
  subtitle?: string;
}

// Minimal, explicit color map — no dynamic Tailwind class building
const colorVariants: Record<string, { iconBg: string; iconText: string; iconBorder: string }> = {
  blue: {
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconText: 'text-blue-600 dark:text-blue-400',
    iconBorder: 'border border-blue-100 dark:border-blue-800/50',
  },
  emerald: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    iconBorder: 'border border-emerald-100 dark:border-emerald-800/50',
  },
  amber: {
    iconBg: 'bg-amber-50 dark:bg-amber-900/20',
    iconText: 'text-amber-600 dark:text-amber-400',
    iconBorder: 'border border-amber-100 dark:border-amber-800/50',
  },
  red: {
    iconBg: 'bg-red-50 dark:bg-red-900/20',
    iconText: 'text-red-600 dark:text-red-400',
    iconBorder: 'border border-red-100 dark:border-red-800/50',
  },
  // Mapping indigo to blue to support gradual migration/avoid purple
  indigo: {
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconText: 'text-blue-600 dark:text-blue-400',
    iconBorder: 'border border-blue-100 dark:border-blue-800/50',
  },
  green: { iconBg: 'bg-emerald-50 dark:bg-emerald-900/20', iconText: 'text-emerald-600 dark:text-emerald-400', iconBorder: 'border border-emerald-100 dark:border-emerald-800/50' },
  purple: { iconBg: 'bg-blue-50 dark:bg-blue-900/20', iconText: 'text-blue-600 dark:text-blue-400', iconBorder: 'border border-blue-100 dark:border-blue-800/50' },
  violet: { iconBg: 'bg-blue-50 dark:bg-blue-900/20', iconText: 'text-blue-600 dark:text-blue-400', iconBorder: 'border border-blue-100 dark:border-blue-800/50' },
};

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, trend, subtitle }) => {
  const variant = colorVariants[color] ?? colorVariants.blue;

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${variant.iconBg} ${variant.iconBorder}`}>
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${variant.iconText}`} />
        </div>
        {trend && (
          <span className={`inline-flex items-center text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full ${trend.startsWith('+')
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
            : trend.startsWith('-')
              ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
            }`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 truncate">{title}</p>
      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-white tracking-tight truncate">{value}</p>
      {subtitle && (
        <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5 sm:mt-1 truncate">{subtitle}</p>
      )}
    </div>
  );
};

export default StatsCard;