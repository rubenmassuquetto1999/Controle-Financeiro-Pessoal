import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BudgetGroup } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  // Handles YYYY-MM-DD or ISO strings without timezone offsets breaking day
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateString;
}

export function getBudgetGroupLabel(group: BudgetGroup | string): string {
  switch (group) {
    case 'essencial':
      return 'Essencial (50%)';
    case 'investimento':
      return 'Investimento (20%)';
    case 'educacao':
      return 'Educação';
    case 'lazer':
      return 'Lazer (30%)';
    case 'adicional':
      return 'Adicional';
    case 'receita':
      return 'Receita';
    default:
      return group;
  }
}

export function getBudgetGroupColor(group: BudgetGroup | string): string {
  switch (group) {
    case 'essencial':
      return '#3b82f6'; // Blue
    case 'investimento':
      return '#22c55e'; // Green
    case 'educacao':
      return '#fbbf24'; // Yellow
    case 'lazer':
      return '#f43f5e'; // Rose/Red
    case 'adicional':
      return '#a855f7'; // Purple
    case 'receita':
      return '#22c55e'; // Green
    default:
      return '#64748b'; // Slate
  }
}

export function getBudgetGroupBadgeClass(group: BudgetGroup | string): string {
  switch (group) {
    case 'essencial':
      return 'bg-blue-900/30 text-blue-400 border-blue-800/40';
    case 'investimento':
      return 'bg-green-900/30 text-green-400 border-green-800/40';
    case 'educacao':
      return 'bg-amber-900/30 text-yellow-400 border-yellow-800/40';
    case 'lazer':
      return 'bg-red-900/30 text-red-400 border-red-800/40';
    case 'adicional':
      return 'bg-purple-900/30 text-purple-400 border-purple-800/40';
    case 'receita':
      return 'bg-green-900/30 text-green-400 border-green-800/40';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}

export function formatMonthName(monthStr: string): string {
  if (!monthStr || monthStr === 'all') return 'Todos os Meses';
  const [year, month] = monthStr.split('-');
  if (!year || !month) return monthStr;
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const idx = parseInt(month, 10) - 1;
  const name = monthNames[idx] || month;
  return `${name} de ${year}`;
}

export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getAdjacentMonth(monthStr: string, offset: number): string {
  const [yearStr, monthStrPart] = monthStr.split('-');
  let year = parseInt(yearStr, 10) || new Date().getFullYear();
  let month = parseInt(monthStrPart, 10) || (new Date().getMonth() + 1);

  month += offset;
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  while (month < 1) {
    month += 12;
    year -= 1;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}

