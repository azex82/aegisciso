'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@aegisciso/ui';
import {
  AlertTriangle,
  ArrowUpDown,
  ChevronRight,
  Clock,
  User,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Flag,
} from 'lucide-react';
import { getRiskLevel } from '@/lib/theme';

interface Risk {
  id: string;
  code: string;
  title: string;
  category: string;
  inherentRiskScore: number;
  residualRiskScore: number | null;
  priority: number;
  status: string;
  targetDate: string | null;
  owner: { name: string } | null;
  isOverdue: boolean;
  daysOverdue?: number;
}

interface TopRisksTableProps {
  risks: Risk[];
  showViewAll?: boolean;
}

type SortField = 'score' | 'priority' | 'severity' | 'overdue';
type SortOrder = 'asc' | 'desc';

export function TopRisksTable({ risks, showViewAll = true }: TopRisksTableProps) {
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sortedRisks = [...risks].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'score':
        comparison = a.inherentRiskScore - b.inherentRiskScore;
        break;
      case 'priority':
        comparison = a.priority - b.priority;
        break;
      case 'severity':
        // Severity based on residual risk if available, otherwise inherent
        const aScore = a.residualRiskScore ?? a.inherentRiskScore;
        const bScore = b.residualRiskScore ?? b.inherentRiskScore;
        comparison = aScore - bScore;
        break;
      case 'overdue':
        comparison = (a.daysOverdue || 0) - (b.daysOverdue || 0);
        break;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortLabel = () => {
    const labels: Record<SortField, string> = {
      score: 'Risk Score',
      priority: 'Priority',
      severity: 'Severity',
      overdue: 'Overdue Days',
    };
    return labels[sortField];
  };

  return (
    <Card className="executive-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg font-semibold">Top Risks</CardTitle>
            <Badge variant="secondary" className="ml-2">
              {risks.length}
            </Badge>
          </div>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{getSortLabel()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSort('score')}>
                <span className={sortField === 'score' ? 'font-medium' : ''}>
                  Risk Score {sortField === 'score' && (sortOrder === 'desc' ? '↓' : '↑')}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('priority')}>
                <span className={sortField === 'priority' ? 'font-medium' : ''}>
                  Priority {sortField === 'priority' && (sortOrder === 'desc' ? '↓' : '↑')}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('severity')}>
                <span className={sortField === 'severity' ? 'font-medium' : ''}>
                  Severity {sortField === 'severity' && (sortOrder === 'desc' ? '↓' : '↑')}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('overdue')}>
                <span className={sortField === 'overdue' ? 'font-medium' : ''}>
                  Overdue {sortField === 'overdue' && (sortOrder === 'desc' ? '↓' : '↑')}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y">
          {sortedRisks.map((risk) => {
            const riskLevel = getRiskLevel(risk.inherentRiskScore);

            return (
              <div
                key={risk.id}
                className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors"
              >
                {/* Risk Level Indicator */}
                <div
                  className="h-10 w-1 rounded-full shrink-0"
                  style={{ backgroundColor: riskLevel.color }}
                />

                {/* Risk Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/risks/${risk.id}`}
                      className="text-sm font-medium hover:text-primary truncate"
                    >
                      {risk.title}
                    </Link>
                    {risk.isOverdue && (
                      <Badge variant="destructive" className="text-[10px] h-5 shrink-0">
                        <Clock className="h-3 w-3 mr-1" />
                        {risk.daysOverdue}d overdue
                      </Badge>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-mono">{risk.code}</span>
                    <span className="hidden sm:inline">|</span>
                    <span className="hidden sm:inline">{risk.category}</span>
                    {risk.owner && (
                      <>
                        <span>|</span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {risk.owner.name}
                        </span>
                      </>
                    )}
                    {risk.targetDate && (
                      <>
                        <span className="hidden md:inline">|</span>
                        <span className="hidden md:flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(risk.targetDate).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 shrink-0">
                  {/* Priority Badge */}
                  <div className="hidden sm:flex flex-col items-center">
                    <span className="text-[10px] text-muted-foreground uppercase">Priority</span>
                    <PriorityBadge priority={risk.priority} />
                  </div>

                  {/* Risk Score */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-muted-foreground uppercase">Score</span>
                    <span
                      className="text-lg font-bold"
                      style={{ color: riskLevel.color }}
                    >
                      {risk.inherentRiskScore}
                    </span>
                  </div>

                  {/* Level Badge */}
                  <Badge
                    className="w-20 justify-center"
                    style={{
                      backgroundColor: riskLevel.bgColor,
                      color: riskLevel.color,
                      border: `1px solid ${riskLevel.color}30`,
                    }}
                  >
                    {riskLevel.label}
                  </Badge>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/risks/${risk.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Risk
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Flag className="h-4 w-4 mr-2" />
                        Update Status
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}

          {risks.length === 0 && (
            <div className="px-6 py-8 text-center text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p>No critical or high risks found</p>
            </div>
          )}
        </div>

        {/* View All Link */}
        {showViewAll && risks.length > 0 && (
          <div className="border-t px-6 py-3">
            <Link
              href="/risks"
              className="flex items-center justify-center gap-1 text-sm text-primary hover:underline"
            >
              View all risks
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PriorityBadge({ priority }: { priority: number }) {
  const config: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: 'P1', color: '#dc2626', bg: '#fee2e2' },
    2: { label: 'P2', color: '#ea580c', bg: '#ffedd5' },
    3: { label: 'P3', color: '#d97706', bg: '#fef3c7' },
    4: { label: 'P4', color: '#65a30d', bg: '#ecfccb' },
    5: { label: 'P5', color: '#16a34a', bg: '#dcfce7' },
  };

  const p = config[priority] || config[3];

  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-bold"
      style={{ backgroundColor: p.bg, color: p.color }}
    >
      {p.label}
    </span>
  );
}

// Sample data generator
export function getSampleTopRisks(): Risk[] {
  return [
    {
      id: '1',
      code: 'RSK-001',
      title: 'Insufficient Identity and Access Management Controls',
      category: 'Access Control',
      inherentRiskScore: 20,
      residualRiskScore: 15,
      priority: 1,
      status: 'TREATING',
      targetDate: '2025-01-15',
      owner: { name: 'Ahmed Al-Rashid' },
      isOverdue: true,
      daysOverdue: 5,
    },
    {
      id: '2',
      code: 'RSK-002',
      title: 'Unpatched Critical Vulnerabilities in Production Systems',
      category: 'Vulnerability Management',
      inherentRiskScore: 25,
      residualRiskScore: 20,
      priority: 1,
      status: 'TREATING',
      targetDate: '2025-01-20',
      owner: { name: 'Sarah Hassan' },
      isOverdue: false,
    },
    {
      id: '3',
      code: 'RSK-003',
      title: 'Inadequate Security Logging and Monitoring',
      category: 'Security Operations',
      inherentRiskScore: 16,
      residualRiskScore: 12,
      priority: 2,
      status: 'MONITORING',
      targetDate: '2025-02-01',
      owner: { name: 'Mohammed Ali' },
      isOverdue: false,
    },
    {
      id: '4',
      code: 'RSK-004',
      title: 'Third-Party Vendor Security Assessment Gaps',
      category: 'Third Party Risk',
      inherentRiskScore: 15,
      residualRiskScore: null,
      priority: 2,
      status: 'ASSESSING',
      targetDate: '2025-02-15',
      owner: { name: 'Fatima Khalid' },
      isOverdue: false,
    },
    {
      id: '5',
      code: 'RSK-005',
      title: 'Cloud Configuration Security Misconfigurations',
      category: 'Cloud Security',
      inherentRiskScore: 12,
      residualRiskScore: 8,
      priority: 3,
      status: 'TREATING',
      targetDate: '2025-01-10',
      owner: { name: 'Omar Saeed' },
      isOverdue: true,
      daysOverdue: 10,
    },
  ];
}
