'use client';

import { Card, CardContent, CardHeader, CardTitle, Badge, Progress } from '@aegisciso/ui';
import { Target } from 'lucide-react';
import { getObjectiveStatusColor } from '@aegisciso/shared';

interface Objective {
  id: string;
  code: string;
  title: string;
  status: string;
  progressPercent: number;
  targetDate: Date | null;
  owner: { name: string } | null;
}

interface ObjectivesSummaryProps {
  objectives: Objective[];
}

export function ObjectivesSummary({ objectives }: ObjectivesSummaryProps) {
  if (objectives.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Strategy Objectives
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
          No objectives defined
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Strategy Objectives
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {objectives.map((objective) => {
            const statusColor = getObjectiveStatusColor(objective.status as any);
            const statusLabel = objective.status.replace('_', ' ');

            return (
              <div key={objective.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{objective.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {objective.code}
                      {objective.owner && ` • ${objective.owner.name}`}
                    </div>
                  </div>
                  <Badge className={getObjectiveStatusColor(objective.status as any)}>
                    {statusLabel}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={objective.progressPercent} className="flex-1" />
                  <span className="text-sm font-medium w-12 text-right">
                    {objective.progressPercent}%
                  </span>
                </div>
                {objective.targetDate && (
                  <div className="text-xs text-muted-foreground">
                    Target: {new Date(objective.targetDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
