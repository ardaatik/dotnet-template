import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCompactNumber(value: number): string {
  if (value >= 100 && value < 1000) {
    return value.toString();
  }
  if (value >= 1000 && value < 1_000_000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  return value.toString();
}
