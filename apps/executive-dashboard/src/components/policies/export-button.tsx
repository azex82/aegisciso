'use client';

import { Button } from '@aegisciso/ui';
import { Download } from 'lucide-react';

interface Policy {
  code: string;
  title: string;
  status: string;
  maturityLevel: number;
  category: string | null;
  frameworkSource: string | null;
  reviewDate: Date | null;
  owner?: { name: string | null } | null;
}

interface PolicyExportButtonProps {
  data: Policy[];
  filename: string;
}

export function PolicyExportButton({ data, filename }: PolicyExportButtonProps) {
  const handleExport = () => {
    const headers = ['Code', 'Title', 'Status', 'Maturity', 'Category', 'Framework', 'Owner', 'Review Date'];

    const rows = data.map(policy => [
      policy.code,
      policy.title,
      policy.status,
      `Level ${policy.maturityLevel}`,
      policy.category || '',
      policy.frameworkSource || '',
      policy.owner?.name || '',
      policy.reviewDate ? new Date(policy.reviewDate).toLocaleDateString() : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Export
    </Button>
  );
}
