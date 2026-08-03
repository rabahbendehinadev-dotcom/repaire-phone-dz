/**
 * Shared admin badge components — consistent status/stock colors across all
 * admin pages. Light + dark mode support, accessible contrast ratios.
 */
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Design tokens ─────────────────────────────────────────────────────────────
// Each semantic meaning maps to one set of Tailwind classes so the whole admin
// panel stays visually consistent.

export const statusTokens = {
  success:  'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-700',
  warning:  'bg-amber-100   text-amber-700   border-amber-300   dark:bg-amber-900/40   dark:text-amber-400   dark:border-amber-700',
  danger:   'bg-red-100     text-red-700     border-red-300     dark:bg-red-900/40     dark:text-red-400     dark:border-red-700',
  danger_solid: 'bg-red-600 text-white border-red-700 dark:bg-red-700 dark:text-white dark:border-red-600',
  orange:   'bg-orange-100  text-orange-700  border-orange-300  dark:bg-orange-900/40  dark:text-orange-400  dark:border-orange-700',
  info:     'bg-blue-100    text-blue-700    border-blue-300    dark:bg-blue-900/40    dark:text-blue-400    dark:border-blue-700',
  purple:   'bg-purple-100  text-purple-700  border-purple-300  dark:bg-purple-900/40  dark:text-purple-400  dark:border-purple-700',
  indigo:   'bg-indigo-100  text-indigo-700  border-indigo-300  dark:bg-indigo-900/40  dark:text-indigo-400  dark:border-indigo-700',
  neutral:  'bg-gray-100    text-gray-600    border-gray-300    dark:bg-gray-800       dark:text-gray-400    dark:border-gray-700',
} as const;

// ── Stock Badge ───────────────────────────────────────────────────────────────

interface StockBadgeProps {
  stock: number;
  className?: string;
}

export function StockBadge({ stock, className }: StockBadgeProps) {
  const base = 'gap-1 font-semibold px-2 py-0.5 text-xs whitespace-nowrap';

  if (stock === 0) {
    return (
      <Badge variant="outline" className={cn(base, statusTokens.danger_solid, className)}>
        <XCircle className="h-3 w-3 shrink-0" />
        0 — Rupture
      </Badge>
    );
  }
  if (stock <= 5) {
    return (
      <Badge variant="outline" className={cn(base, statusTokens.danger, className)}>
        <AlertTriangle className="h-3 w-3 shrink-0" />
        {stock} — Stock critique
      </Badge>
    );
  }
  if (stock <= 10) {
    return (
      <Badge variant="outline" className={cn(base, statusTokens.orange, className)}>
        <AlertTriangle className="h-3 w-3 shrink-0" />
        {stock} — Stock faible
      </Badge>
    );
  }
  if (stock <= 30) {
    return (
      <Badge variant="outline" className={cn(base, statusTokens.warning, className)}>
        <CheckCircle2 className="h-3 w-3 shrink-0" />
        {stock} — Stock moyen
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn(base, statusTokens.success, className)}>
      <CheckCircle2 className="h-3 w-3 shrink-0" />
      {stock} — En stock
    </Badge>
  );
}

/** True when stock level warrants a red row highlight */
export function isCriticalStock(stock: number) {
  return stock <= 5;
}

// ── Product status badges ─────────────────────────────────────────────────────

export function FeaturedBadge({ className }: { className?: string }) {
  return (
    <Badge className={cn(
      'bg-orange-500 hover:bg-orange-500 text-white border-orange-600',
      'text-[10px] py-0 leading-none h-[18px] w-fit px-1.5',
      className
    )}>
      En avant
    </Badge>
  );
}

export function NewBadge({ className }: { className?: string }) {
  return (
    <Badge className={cn(
      'bg-blue-600 hover:bg-blue-600 text-white border-blue-700',
      'text-[10px] py-0 leading-none h-[18px] w-fit px-1.5',
      className
    )}>
      Nouveau
    </Badge>
  );
}

export function PromotionBadge({ className }: { className?: string }) {
  return (
    <Badge className={cn(
      'bg-red-500 hover:bg-red-500 text-white border-red-600',
      'text-[10px] py-0 leading-none h-[18px] w-fit px-1.5',
      className
    )}>
      Promotion
    </Badge>
  );
}

export function ActiveBadge({ className }: { className?: string }) {
  return (
    <Badge variant="outline" className={cn(statusTokens.success, 'text-xs font-medium', className)}>
      Actif
    </Badge>
  );
}

export function InactiveBadge({ className }: { className?: string }) {
  return (
    <Badge variant="outline" className={cn(statusTokens.neutral, 'text-xs font-medium', className)}>
      Inactif
    </Badge>
  );
}
