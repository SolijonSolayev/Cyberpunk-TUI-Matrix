import type React from 'react';
import { cn } from '@/lib/utils';
import { Velaris } from '@/components/ui/velaris';

interface DarkGradientBgProps {
  active?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function DarkGradientBg({ active = true, children, className }: DarkGradientBgProps) {
  return (
    <div className={cn('relative min-h-screen w-full overflow-hidden bg-black', className)}>
      <Velaris active={active} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(167,243,208,.42) 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}
      />
      <div className="relative z-10 h-full min-h-0">{children}</div>
    </div>
  );
}
