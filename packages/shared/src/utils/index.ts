import type { PolicyStatus, StatementPriority, MappingType, CoverageLevel } from '../types/policy';
import type { RiskStatus, TreatmentStatus, FindingSeverity, FindingStatus, ExceptionStatus } from '../types/risk';
import type { ObjectiveStatus, InitiativeStatus, KPIStatus, KPITrend } from '../types/strategy';

// Date utilities
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function daysAgo(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Status badge colors
export function getPolicyStatusColor(status: PolicyStatus): string {
  const colors: Record<PolicyStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    RETIRED: 'bg-red-100 text-red-800',
  };
  return colors[status];
}

export function getRiskStatusColor(status: RiskStatus): string {
  const colors: Record<RiskStatus, string> = {
    IDENTIFIED: 'bg-gray-100 text-gray-800',
    ASSESSING: 'bg-blue-100 text-blue-800',
    TREATING: 'bg-yellow-100 text-yellow-800',
    MONITORING: 'bg-green-100 text-green-800',
    ACCEPTED: 'bg-purple-100 text-purple-800',
    CLOSED: 'bg-slate-100 text-slate-800',
  };
  return colors[status];
}

export function getSeverityColor(severity: FindingSeverity): string {
  const colors: Record<FindingSeverity, string> = {
    CRITICAL: 'bg-red-100 text-red-800',
    HIGH: 'bg-orange-100 text-orange-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    LOW: 'bg-green-100 text-green-800',
    INFO: 'bg-blue-100 text-blue-800',
  };
  return colors[severity];
}

export function getPriorityColor(priority: StatementPriority): string {
  const colors: Record<StatementPriority, string> = {
    CRITICAL: 'bg-red-100 text-red-800',
    HIGH: 'bg-orange-100 text-orange-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    LOW: 'bg-green-100 text-green-800',
  };
  return colors[priority];
}

export function getObjectiveStatusColor(status: ObjectiveStatus): string {
  const colors: Record<ObjectiveStatus, string> = {
    NOT_STARTED: 'bg-gray-100 text-gray-800',
    ON_TRACK: 'bg-green-100 text-green-800',
    AT_RISK: 'bg-yellow-100 text-yellow-800',
    DELAYED: 'bg-orange-100 text-orange-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-slate-100 text-slate-800',
  };
  return colors[status];
}

export function getCoverageLevelColor(level: CoverageLevel): string {
  const colors: Record<CoverageLevel, string> = {
    FULL: 'bg-green-100 text-green-800',
    PARTIAL: 'bg-yellow-100 text-yellow-800',
    MINIMAL: 'bg-orange-100 text-orange-800',
    NONE: 'bg-red-100 text-red-800',
  };
  return colors[level];
}

// String utilities
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateCode(prefix: string, number: number): string {
  return `${prefix}-${String(number).padStart(3, '0')}`;
}

// Number utilities
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatCurrency(num: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatPercent(num: number, decimals = 0): string {
  return `${num.toFixed(decimals)}%`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Array utilities
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export function sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function unique<T>(array: T[], key?: keyof T): T[] {
  if (!key) return [...new Set(array)];
  const seen = new Set<unknown>();
  return array.filter((item) => {
    const val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

// CSV export
export function toCSV<T extends Record<string, unknown>>(data: T[], columns: { key: keyof T; label: string }[]): string {
  const headers = columns.map((c) => c.label).join(',');
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const value = row[c.key];
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(',')
  );
  return [headers, ...rows].join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
