import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning';
}

const variants = {
  default: 'bg-card border',
  accent: 'bg-accent/10 border border-accent/20',
  success: 'bg-success/10 border border-success/20',
  warning: 'bg-warning/10 border border-warning/20',
};

const iconVariants = {
  default: 'bg-primary/10 text-primary',
  accent: 'bg-accent/20 text-accent-foreground',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
};

export function StatCard({ title, value, subtitle, icon, variant = 'default' }: StatCardProps) {
  return (
    <div className={cn('rounded-xl p-5 animate-fade-in', variants[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={cn('flex items-center justify-center w-10 h-10 rounded-lg', iconVariants[variant])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
