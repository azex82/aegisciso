'use client';

import { Card, CardContent, Progress } from '@aegisciso/ui';
import { Shield, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getScoreColor, getScoreLabel } from '@aegisciso/shared';

interface PostureCardProps {
  snapshot: {
    overallScore: number;
    policyHealthScore: number;
    complianceCoverage: number;
    riskExposureScore: number;
    strategyAlignmentScore: number;
  } | null;
}

export function PostureCard({ snapshot }: PostureCardProps) {
  if (!snapshot) {
    return (
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white">
        <CardContent className="p-8 text-center">
          <p>No posture data available. Run the seed to populate data.</p>
        </CardContent>
      </Card>
    );
  }

  const score = snapshot.overallScore;
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  // Mock trend - in production this would compare with previous snapshot
  const trend = score >= 70 ? 'up' : score >= 50 ? 'stable' : 'down';
  const trendChange = 3;

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden">
      <CardContent className="p-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Score Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div
                className="flex h-32 w-32 items-center justify-center rounded-full border-8"
                style={{ borderColor: scoreColor }}
              >
                <div className="text-center">
                  <div className="text-4xl font-bold">{score}</div>
                  <div className="text-sm text-slate-300">{scoreLabel}</div>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 rounded-full bg-slate-700 p-2">
                <Shield className="h-6 w-6" style={{ color: scoreColor }} />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold">Security Posture</h3>
              <div className="mt-2 flex items-center gap-2">
                {trend === 'up' && <TrendingUp className="h-5 w-5 text-green-400" />}
                {trend === 'down' && <TrendingDown className="h-5 w-5 text-red-400" />}
                {trend === 'stable' && <Minus className="h-5 w-5 text-yellow-400" />}
                <span className="text-sm text-slate-300">
                  {trend === 'up' && `+${trendChange}% from last month`}
                  {trend === 'down' && `-${trendChange}% from last month`}
                  {trend === 'stable' && 'No change from last month'}
                </span>
              </div>
            </div>
          </div>

          {/* Sub-scores Section */}
          <div className="space-y-4">
            <ScoreBar label="Policy Health" value={snapshot.policyHealthScore} />
            <ScoreBar label="Compliance Coverage" value={snapshot.complianceCoverage} />
            <ScoreBar label="Risk Exposure" value={snapshot.riskExposureScore} />
            <ScoreBar label="Strategy Alignment" value={snapshot.strategyAlignmentScore} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = getScoreColor(value);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
