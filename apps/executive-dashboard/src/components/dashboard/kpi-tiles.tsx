'use client';

import { Card, CardContent } from '@aegisciso/ui';
import {
  Shield,
  FileCheck,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
} from 'lucide-react';
import { getScoreConfig } from '@/lib/theme';

interface KPITilesProps {
  data: {
    overallScore: number;
    complianceCoverage: number;
    policyHealthScore: number;
    criticalRisks: number;
    highRisks: number;
    overdueActions: number;
    maturityLevel: number;
    policyViolations: number;
    // Trends (comparison with previous period)
    scoreTrend?: number;
    complianceTrend?: number;
    riskTrend?: number;
  } | null;
}

export function KPITiles({ data }: KPITilesProps) {
  if (!data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const scoreConfig = getScoreConfig(data.overallScore);

  const tiles = [
    {
      title: 'Security Posture',
      value: data.overallScore,
      unit: '%',
      subtitle: scoreConfig.label,
      trend: data.scoreTrend,
      icon: Shield,
      color: scoreConfig.color,
      bgColor: `${scoreConfig.color}15`,
    },
    {
      title: 'Compliance Coverage',
      value: data.complianceCoverage,
      unit: '%',
      subtitle: 'Framework coverage',
      trend: data.complianceTrend,
      icon: FileCheck,
      color: getScoreConfig(data.complianceCoverage).color,
      bgColor: `${getScoreConfig(data.complianceCoverage).color}15`,
    },
    {
      title: 'Policy Health',
      value: data.policyHealthScore,
      unit: '%',
      subtitle: data.policyViolations > 0 ? `${data.policyViolations} violations` : 'All healthy',
      trend: undefined,
      icon: Activity,
      color: getScoreConfig(data.policyHealthScore).color,
      bgColor: `${getScoreConfig(data.policyHealthScore).color}15`,
    },
    {
      title: 'Critical Risks',
      value: data.criticalRisks + data.highRisks,
      unit: '',
      subtitle: `${data.criticalRisks} critical, ${data.highRisks} high`,
      trend: data.riskTrend,
      icon: AlertTriangle,
      color: data.criticalRisks > 0 ? '#dc2626' : data.highRisks > 0 ? '#ea580c' : '#16a34a',
      bgColor: data.criticalRisks > 0 ? '#fee2e2' : data.highRisks > 0 ? '#ffedd5' : '#dcfce7',
      invertTrend: true,
    },
    {
      title: 'Overdue Actions',
      value: data.overdueActions,
      unit: '',
      subtitle: data.overdueActions > 0 ? 'Requires attention' : 'All on track',
      trend: undefined,
      icon: Clock,
      color: data.overdueActions > 0 ? '#dc2626' : '#16a34a',
      bgColor: data.overdueActions > 0 ? '#fee2e2' : '#dcfce7',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {tiles.map((tile, index) => (
        <Card key={index} className="kpi-tile overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {tile.title}
                </span>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: tile.bgColor }}
                >
                  <tile.icon
                    className="h-4 w-4"
                    style={{ color: tile.color }}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span
                  className="text-3xl font-bold"
                  style={{ color: tile.color }}
                >
                  {tile.value}
                </span>
                {tile.unit && (
                  <span className="text-lg text-muted-foreground">{tile.unit}</span>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{tile.subtitle}</span>
                {tile.trend !== undefined && (
                  <TrendIndicator
                    value={tile.trend}
                    inverted={tile.invertTrend}
                  />
                )}
              </div>
            </div>

            {/* Bottom accent bar */}
            <div
              className="h-1 w-full"
              style={{ backgroundColor: tile.color }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TrendIndicator({ value, inverted = false }: { value: number; inverted?: boolean }) {
  const isPositive = inverted ? value < 0 : value > 0;
  const isNegative = inverted ? value > 0 : value < 0;

  return (
    <div
      className={`flex items-center gap-1 text-xs font-medium ${
        isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-muted-foreground'
      }`}
    >
      {isPositive && <TrendingUp className="h-3 w-3" />}
      {isNegative && <TrendingDown className="h-3 w-3" />}
      {value === 0 && <Minus className="h-3 w-3" />}
      <span>{Math.abs(value)}%</span>
    </div>
  );
}
