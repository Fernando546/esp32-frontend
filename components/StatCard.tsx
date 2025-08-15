"use client";

import React from 'react';
import classNames from 'classnames';

interface StatCardProps {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  highlightColor?: string; // Tailwind class or hex
  className?: string;
  icon?: React.ReactNode;
  small?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, unit = '', highlightColor, className, icon, small }) => {
  return (
    <div className={classNames(
      'relative overflow-hidden rounded-xl border border-white/10 backdrop-blur-sm shadow-sm transition-all',
      'bg-white/5 hover:bg-white/10 dark:bg-black/30 dark:hover:bg-black/40',
      small ? 'p-3 min-w-[120px]' : 'p-5',
      className
    )}>
      <div className="flex items-center gap-3">
        {icon && <div className="text-xl opacity-80">{icon}</div>}
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wide opacity-70 font-medium">
            {label}
          </span>
          <span className={classNames('font-bold leading-tight', small ? 'text-lg' : 'text-2xl')}
            style={highlightColor ? { color: highlightColor } : undefined}
          >
            {value == null ? '—' : value}{value != null && unit ? unit : ''}
          </span>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-20 bg-gradient-to-br from-transparent via-white/10 to-transparent" />
    </div>
  );
};

export default StatCard;
