/**
 * Helper unificado para calcular el estado de stock
 * Regla única aplicada en todo el sistema:
 * - stock <= 0 → agotado
 * - stock entre 1 y 5 → limitado
 * - stock > 5 → disponible
 */

import type { EstadoStock } from '../types';

/**
 * Calcula el estado de stock según la regla unificada
 * @param stock - Cantidad en stock
 * @returns Estado del stock: 'disponible' | 'limitado' | 'agotado'
 */
export function getStockStatus(stock: number): EstadoStock {
  if (stock <= 0) return 'agotado';
  if (stock <= 5) return 'limitado';
  return 'disponible';
}

/**
 * Configuración visual por estado de stock
 */
export const stockStatusConfig: Record<EstadoStock, { 
  label: string; 
  card: string; 
  dot: string; 
  bar: string; 
}> = {
  disponible: {
    label: 'Disponible',
    card: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
  },
  limitado: {
    label: 'Stock bajo',
    card: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    dot: 'bg-amber-500',
    bar: 'bg-amber-400',
  },
  agotado: {
    label: 'Agotado',
    card: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    dot: 'bg-red-500',
    bar: 'bg-red-400',
  },
};
