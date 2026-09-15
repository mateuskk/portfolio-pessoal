import { ChartNoAxesCombined } from 'lucide-react';

import type { TechnologyMeta } from '@/lib/technology-catalog';
import { cn } from '@/lib/utils';
import { StackIcon } from './stack-icon';

type TechnologyIconProps = {
  icon: TechnologyMeta['icon'];
  className?: string;
};

export function TechnologyIcon({ icon, className }: TechnologyIconProps) {
  if (icon === 'recharts') {
    return (
      <ChartNoAxesCombined
        aria-hidden="true"
        className={cn('size-[1.15em] shrink-0 text-[#22B5BF]', className)}
        data-testid="stack-icon"
      />
    );
  }

  return <StackIcon className={className} slug={icon} />;
}
