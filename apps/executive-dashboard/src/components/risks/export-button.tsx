'use client';

import { Button } from '@aegisciso/ui';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  data: any[];
  filename: string;
  headers: string[];
  getRow: (item: any) => (string | number)[];
}

export function ExportButton({ data, filename, headers, getRow }: ExportButtonProps) {
  const handleExport = () => {
    const rows = data.map(getRow);
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
