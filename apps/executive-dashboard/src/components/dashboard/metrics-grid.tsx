'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@aegisciso/ui';
import { FileText, AlertTriangle, Target, CheckCircle, XCircle, Clock } from 'lucide-react';

interface MetricsGridProps {
  snapshot: {
    totalPolicies: number;
    activePolicies: number;
    policiesNeedingReview: number;
    totalRisks: number;
    criticalRisks: number;
    highRisks: number;
    risksWithoutControls: number;
    totalObjectives: number;
    objectivesOnTrack: number;
    objectivesAtRisk: number;
    totalControls: number;
    implementedControls: number;
  } | null;
}

export function MetricsGrid({ snapshot }: MetricsGridProps) {
  if (!snapshot) {
    return null;
  }

  const metrics = [
    {
      title: 'Policies',
      value: snapshot.totalPolicies,
      subValue: `${snapshot.activePolicies} active`,
      change: snapshot.policiesNeedingReview > 0 ? `${snapshot.policiesNeedingReview} need review` : 'All current',
      changeType: snapshot.policiesNeedingReview > 0 ? 'warning' : 'success',
      icon: FileText,
    },
    {
      title: 'Open Risks',
      value: snapshot.totalRisks,
      subValue: `${snapshot.criticalRisks} critical, ${snapshot.highRisks} high`,
      change: snapshot.risksWithoutControls > 0 ? `${snapshot.risksWithoutControls} uncontrolled` : 'All controlled',
      changeType: snapshot.risksWithoutControls > 0 ? 'danger' : 'success',
      icon: AlertTriangle,
    },
    {
      title: 'Objectives',
      value: snapshot.totalObjectives,
      subValue: `${snapshot.objectivesOnTrack} on track`,
      change: snapshot.objectivesAtRisk > 0 ? `${snapshot.objectivesAtRisk} at risk` : 'All on track',
      changeType: snapshot.objectivesAtRisk > 0 ? 'warning' : 'success',
      icon: Target,
    },
    {
      title: 'Controls',
      value: snapshot.totalControls,
      subValue: `${snapshot.implementedControls} implemented`,
      change: `${Math.round((snapshot.implementedControls / snapshot.totalControls) * 100)}% coverage`,
      changeType: snapshot.implementedControls === snapshot.totalControls ? 'success' : 'info',
      icon: CheckCircle,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted-foreground">{metric.subValue}</p>
            <div className={`mt-2 text-xs ${getChangeColor(metric.changeType)}`}>
              {getChangeIcon(metric.changeType)}
              <span className="ml-1">{metric.change}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function getChangeColor(type: string): string {
  switch (type) {
    case 'success':
      return 'text-green-600';
    case 'warning':
      return 'text-yellow-600';
    case 'danger':
      return 'text-red-600';
    default:
      return 'text-blue-600';
  }
}

function getChangeIcon(type: string) {
  switch (type) {
    case 'success':
      return <CheckCircle className="inline h-3 w-3" />;
    case 'warning':
      return <Clock className="inline h-3 w-3" />;
    case 'danger':
      return <XCircle className="inline h-3 w-3" />;
    default:
      return null;
  }
}
