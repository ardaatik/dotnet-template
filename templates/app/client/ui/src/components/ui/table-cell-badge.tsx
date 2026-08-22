import { cn } from '@/lib/utils';

interface TableCellBadgeProps {
  value: string | number;
  color?: string;
  className?: string;
}

export function TableCellBadge({ value, color, className }: TableCellBadgeProps) {
  return (
    <span
      className={cn('rounded-sm border px-1.5 py-0.5 font-mono text-xs', className)}
      style={
        color
          ? {
              color,
              backgroundColor: `${color}1a`,
              borderColor: `${color}33`,
            }
          : undefined
      }
    >
      {value}
    </span>
  );
}
