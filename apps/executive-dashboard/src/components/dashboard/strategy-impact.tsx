'use client';

import { Card, CardContent, CardHeader, CardTitle, Badge, Tooltip, TooltipContent, TooltipTrigger } from '@aegisciso/ui';
import { Target, AlertTriangle, TrendingDown, ArrowRight, Info, Shield } from 'lucide-react';

interface StrategyObjective {
  id: string;
  code: string;
  title: string;
  status: string;
  progressPercent: number;
  impactingRisks: number;
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
}

interface StrategyImpactProps {
  objectives: StrategyObjective[];
  totalImpactedObjectives: number;
  strategyImpactScore: number;
}

export function StrategyImpact({ objectives, totalImpactedObjectives, strategyImpactScore }: StrategyImpactProps) {
  const impactedObjectives = objectives.filter((obj) => obj.impactingRisks > 0);

  return (
    <Card className="executive-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Risk Impact on Strategy</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground">
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Shows how open risks affect your cybersecurity strategy objectives. High impact risks can delay or derail critical initiatives.</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>Impacted Objectives</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-amber-600">
                {totalImpactedObjectives}
              </span>
              <span className="text-sm text-muted-foreground">
                / {objectives.length}
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingDown className="h-4 w-4" />
              <span>Strategy Impact</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className={`text-2xl font-bold ${
                  strategyImpactScore > 50
                    ? 'text-red-600'
                    : strategyImpactScore > 25
                    ? 'text-amber-600'
                    : 'text-green-600'
                }`}
              >
                {strategyImpactScore}%
              </span>
              <span className="text-sm text-muted-foreground">at risk</span>
            </div>
          </div>
        </div>

        {/* Impacted Objectives List */}
        {impactedObjectives.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Objectives at Risk
            </h4>
            {impactedObjectives.slice(0, 4).map((objective) => (
              <div
                key={objective.id}
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
              >
                <ImpactIndicator level={objective.impactLevel} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {objective.title}
                    </span>
                    <Badge variant="outline" className="text-[10px] h-5 shrink-0">
                      {objective.code}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusBadge status={objective.status} />
                    <span>|</span>
                    <span>{objective.progressPercent}% complete</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-sm shrink-0">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">{objective.impactingRisks}</span>
                  <span className="text-muted-foreground">risks</span>
                </div>
              </div>
            ))}

            {impactedObjectives.length > 4 && (
              <button className="w-full text-sm text-primary hover:underline flex items-center justify-center gap-1 py-2">
                View all {impactedObjectives.length} impacted objectives
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <Shield className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="text-sm font-medium text-green-700">
              No strategic objectives are currently impacted by risks
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              All objectives are on track
            </p>
          </div>
        )}

        {/* Risk-Objective Impact Legend */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span>High Impact</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
              <span>Low</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ImpactIndicator({ level }: { level: string }) {
  const colors = {
    HIGH: 'bg-red-500',
    MEDIUM: 'bg-amber-500',
    LOW: 'bg-yellow-500',
    NONE: 'bg-green-500',
  };

  return (
    <div className={`h-10 w-1 rounded-full ${colors[level as keyof typeof colors] || colors.NONE}`} />
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ON_TRACK: 'bg-green-100 text-green-800',
    AT_RISK: 'bg-amber-100 text-amber-800',
    DELAYED: 'bg-red-100 text-red-800',
    NOT_STARTED: 'bg-gray-100 text-gray-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
  };

  const labels: Record<string, string> = {
    ON_TRACK: 'On Track',
    AT_RISK: 'At Risk',
    DELAYED: 'Delayed',
    NOT_STARTED: 'Not Started',
    COMPLETED: 'Completed',
  };

  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[status] || styles.NOT_STARTED}`}>
      {labels[status] || status}
    </span>
  );
}

// Sample data generator for demo
export function getSampleStrategyImpact(): {
  objectives: StrategyObjective[];
  totalImpactedObjectives: number;
  strategyImpactScore: number;
} {
  return {
    objectives: [
      {
        id: '1',
        code: 'OBJ-001',
        title: 'Implement Zero Trust Architecture',
        status: 'AT_RISK',
        progressPercent: 45,
        impactingRisks: 3,
        impactLevel: 'HIGH',
      },
      {
        id: '2',
        code: 'OBJ-002',
        title: 'Achieve NCA ECC Compliance',
        status: 'ON_TRACK',
        progressPercent: 72,
        impactingRisks: 2,
        impactLevel: 'MEDIUM',
      },
      {
        id: '3',
        code: 'OBJ-003',
        title: 'Deploy SIEM Solution',
        status: 'DELAYED',
        progressPercent: 30,
        impactingRisks: 4,
        impactLevel: 'HIGH',
      },
      {
        id: '4',
        code: 'OBJ-004',
        title: 'Security Awareness Training Program',
        status: 'ON_TRACK',
        progressPercent: 85,
        impactingRisks: 1,
        impactLevel: 'LOW',
      },
      {
        id: '5',
        code: 'OBJ-005',
        title: 'Cloud Security Posture Management',
        status: 'ON_TRACK',
        progressPercent: 60,
        impactingRisks: 0,
        impactLevel: 'NONE',
      },
    ],
    totalImpactedObjectives: 4,
    strategyImpactScore: 35,
  };
}
