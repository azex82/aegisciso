'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Badge, Button } from '@aegisciso/ui';
import { Filter, Search, Download } from 'lucide-react';

const filterOptions = [
  { label: 'All Risks', value: 'all', className: '' },
  { label: 'Critical', value: 'critical', className: 'bg-red-50 text-red-800 hover:bg-red-100' },
  { label: 'High', value: 'high', className: 'bg-orange-50 text-orange-800 hover:bg-orange-100' },
  { label: 'Medium', value: 'medium', className: 'bg-amber-50 text-amber-800 hover:bg-amber-100' },
  { label: 'Low', value: 'low', className: 'bg-green-50 text-green-800 hover:bg-green-100' },
];

interface RiskFiltersProps {
  risks: any[];
}

export function RiskFilters({ risks }: RiskFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentFilter = searchParams.get('filter') || 'all';
  const currentSearch = searchParams.get('search') || '';
  const [searchValue, setSearchValue] = useState(currentSearch);

  const handleFilterChange = (filter: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (filter === 'all') {
        params.delete('filter');
      } else {
        params.set('filter', filter);
      }
      router.push(`/risks?${params.toString()}`);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue) {
        params.set('search', searchValue);
      } else {
        params.delete('search');
      }
      router.push(`/risks?${params.toString()}`);
    });
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Code', 'Title', 'Category', 'Priority', 'Inherent Score', 'Residual Score', 'Status', 'Owner'];
    const rows = risks.map(risk => [
      risk.code,
      risk.title,
      risk.category || '',
      `P${risk.priority}`,
      risk.inherentRiskScore,
      risk.residualRiskScore || '',
      risk.status,
      risk.owner?.name || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `risks-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Filter:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Badge
            key={option.value}
            variant="outline"
            className={`cursor-pointer transition-all ${option.className} ${
              currentFilter === option.value ? 'ring-2 ring-primary ring-offset-1' : ''
            }`}
            onClick={() => handleFilterChange(option.value)}
          >
            {option.label}
          </Badge>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search risks..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 pr-4 py-1.5 text-sm border rounded-md bg-background w-64 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </form>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
      {isPending && (
        <span className="text-xs text-muted-foreground">Loading...</span>
      )}
    </div>
  );
}
