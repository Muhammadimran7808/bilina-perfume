import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names, with later Tailwind utilities beating earlier ones.
 *
 * Without twMerge, `cn('bg-primary', 'bg-gold')` emits both classes and the
 * winner depends on stylesheet order — so passing a `className` override to a
 * shadcn component silently did nothing.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
