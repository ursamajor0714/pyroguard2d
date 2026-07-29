// components/common/Badge.tsx
import React from 'react';
import clsx from 'clsx';
import { SensorStatus } from '../../types/sensor';

interface BadgeProps {
  status: SensorStatus | 'ALERT' | 'INFO' | 'LOCKED' | 'UNLOCKED';
  children?: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  children,
  pulse = false,
  className
}) => {
  const getStatusLabel = () => {
    switch (status) {
      case 'NORMAL': return '정상';
      case 'MAINTENANCE': return '점검중';
      case 'ALARM': return '경보발생';
      case 'OFFLINE': return '통신오류';
      default: return children;
    }
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide border',
        {
          // NORMAL
          'bg-emerald-950/40 text-emerald-400 border-emerald-500/30': status === 'NORMAL',
          
          // MAINTENANCE
          'bg-amber-950/40 text-amber-400 border-amber-500/30': status === 'MAINTENANCE',
          
          // ALARM / ALERT
          'bg-red-950/60 text-red-400 border-red-500/40': status === 'ALARM' || status === 'ALERT',
          
          // OFFLINE
          'bg-slate-800 text-slate-400 border-slate-700': status === 'OFFLINE',
          
          // INFO
          'bg-blue-950/40 text-blue-400 border-blue-500/30': status === 'INFO',

          // LOCKED
          'bg-slate-900 text-slate-400 border-slate-700': status === 'LOCKED',

          // UNLOCKED
          'bg-orange-950/40 text-orange-400 border-orange-500/30': status === 'UNLOCKED',
        },
        className
      )}
    >
      {pulse && (
        <span className={clsx("w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse", {
          'bg-emerald-400': status === 'NORMAL',
          'bg-amber-400': status === 'MAINTENANCE',
          'bg-red-400': status === 'ALARM' || status === 'ALERT',
          'bg-slate-400': status === 'OFFLINE',
          'bg-blue-400': status === 'INFO',
          'bg-orange-400': status === 'UNLOCKED',
        })} />
      )}
      {children || getStatusLabel()}
    </span>
  );
};
