'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@aegisciso/ui';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PostureChartProps {
  history: Array<{
    snapshotDate: Date;
    overallScore: number;
    policyHealthScore: number;
    complianceCoverage: number;
    riskExposureScore: number;
  }>;
}

export function PostureChart({ history }: PostureChartProps) {
  const chartData = history.map((h) => ({
    date: new Date(h.snapshotDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    overall: h.overallScore,
    policy: h.policyHealthScore,
    compliance: h.complianceCoverage,
    risk: h.riskExposureScore,
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Posture Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No historical data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Posture Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis domain={[0, 100]} className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="overall"
                name="Overall"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="policy"
                name="Policy"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="compliance"
                name="Compliance"
                stroke="#eab308"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="risk"
                name="Risk"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
