import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  color?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'red';
  badge?: string;
  onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'cyan',
  badge,
  onClick,
}) => {
  const colorStyles = {
    cyan: {
      border: 'hover:border-cyan-500/40',
      bgGlow: 'from-cyan-500/10 to-transparent',
      iconBg: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20',
      valueColor: 'text-cyan-300',
    },
    violet: {
      border: 'hover:border-violet-500/40',
      bgGlow: 'from-violet-500/10 to-transparent',
      iconBg: 'bg-violet-500/15 text-violet-400 border border-violet-500/20',
      valueColor: 'text-violet-300',
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      bgGlow: 'from-emerald-500/10 to-transparent',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
      valueColor: 'text-emerald-300',
    },
    amber: {
      border: 'hover:border-amber-500/40',
      bgGlow: 'from-amber-500/10 to-transparent',
      iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
      valueColor: 'text-amber-300',
    },
    red: {
      border: 'hover:border-red-500/40',
      bgGlow: 'from-red-500/10 to-transparent',
      iconBg: 'bg-red-500/15 text-red-400 border border-red-500/20',
      valueColor: 'text-red-300',
    },
  }[color];

  return (
    <div
      onClick={onClick}
      className={`glass-card p-5 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
        onClick ? 'cursor-pointer' : ''
      } ${colorStyles.border}`}
    >
      {/* Background soft glow gradient */}
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${colorStyles.bgGlow} rounded-full blur-2xl pointer-events-none`}
      />

      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold tracking-tight ${colorStyles.valueColor}`}>
              {value}
            </span>
            {badge && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.08] text-slate-300 border border-white/[0.1]">
                {badge}
              </span>
            )}
          </div>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>

        <div className={`p-3 rounded-xl ${colorStyles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
