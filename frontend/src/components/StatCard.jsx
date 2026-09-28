import React from 'react';

const colorMap = {
  blue: {
    bg: 'from-blue-500/10 to-indigo-500/5',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    iconBg: 'bg-blue-500/20 text-blue-400',
    accent: 'text-blue-400',
  },
  emerald: {
    bg: 'from-emerald-500/10 to-teal-500/5',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
    accent: 'text-emerald-400',
  },
  purple: {
    bg: 'from-purple-500/10 to-pink-500/5',
    border: 'border-purple-500/20 hover:border-purple-500/40',
    iconBg: 'bg-purple-500/20 text-purple-400',
    accent: 'text-purple-400',
  },
  amber: {
    bg: 'from-amber-500/10 to-orange-500/5',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    iconBg: 'bg-amber-500/20 text-amber-400',
    accent: 'text-amber-400',
  },
  rose: {
    bg: 'from-rose-500/10 to-red-500/5',
    border: 'border-rose-500/20 hover:border-rose-500/40',
    iconBg: 'bg-rose-500/20 text-rose-400',
    accent: 'text-rose-400',
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
  className = '',
}) {
  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${scheme.bg} ${scheme.border} ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">{value}</h3>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400 flex items-center gap-1.5">
              {trend && (
                <span className={trend.startsWith('+') ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                  {trend}
                </span>
              )}
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl p-2.5 ${scheme.iconBg}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-white/5 blur-2xl pointer-events-none" />
    </div>
  );
}
