'use client';

import { Card, CardContent, CardHeader, CardTitle, Badge } from '@aegisciso/ui';
import { getRiskLevel, getRiskColor } from '@aegisciso/shared';
import { AlertTriangle } from 'lucide-react';

interface Risk {
  id: string;
  code: string;
  title: string;
  inherentRiskScore: number;
  residualRiskScore: number | null;
  status: string;
  owner: { name: string } | null;
}

interface RiskOverviewProps {
  risks: Risk[];
}

export function RiskOverview({ risks }: RiskOverviewProps) {
  if (risks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Top Risks
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
          No open risks
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Top Risks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {risks.map((risk) => {
            const level = getRiskLevel(risk.inherentRiskScore);
            const color = getRiskColor(risk.inherentRiskScore);
            const residualLevel = risk.residualRiskScore
              ? getRiskLevel(risk.residualRiskScore)
              : null;

            return (
              <div
                key={risk.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-10 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <div>
                    <div className="font-medium">{risk.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {risk.code} {risk.owner && `• ${risk.owner.name}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      Inherent: {risk.inherentRiskScore}
                    </div>
                    {risk.residualRiskScore && (
                      <div className="text-xs text-muted-foreground">
                        Residual: {risk.residualRiskScore}
                      </div>
                    )}
                  </div>
                  <Badge
                    variant={
                      level === 'CRITICAL'
                        ? 'danger'
                        : level === 'HIGH'
                        ? 'warning'
                        : level === 'MEDIUM'
                        ? 'secondary'
                        : 'success'
                    }
                  >
                    {level}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
