export const dynamic = 'force-dynamic';

import { prisma } from '@aegisciso/db';
import { Card, CardContent, CardHeader, CardTitle, Badge, Progress, Button } from '@aegisciso/ui';
import { Target, Rocket, LineChart, TrendingUp, CheckCircle, AlertTriangle, Clock, Plus } from 'lucide-react';
import Link from 'next/link';
import { getObjectiveStatusColor, getKPIStatusColor, getTrendIcon, formatDate, formatCurrency } from '@aegisciso/shared';

async function getDashboardData() {
  const [objectives, initiatives, kpis] = await Promise.all([
    prisma.strategyObjective.findMany({
      where: { status: { not: 'CANCELLED' } },
      orderBy: { priority: 'asc' },
      include: { owner: { select: { name: true } }, _count: { select: { initiatives: true, kpis: true } } },
    }),
    prisma.initiative.findMany({
      where: { status: { in: ['IN_PROGRESS', 'PLANNED'] } },
      orderBy: { targetDate: 'asc' },
      include: { owner: { select: { name: true } }, objective: { select: { title: true } } },
    }),
    prisma.kPI.findMany({
      include: { objective: { select: { title: true } }, measurements: { orderBy: { measuredAt: 'desc' }, take: 1 } },
    }),
  ]);

  const onTrack = objectives.filter((o) => o.status === 'ON_TRACK').length;
  const atRisk = objectives.filter((o) => o.status === 'AT_RISK').length;
  const delayed = objectives.filter((o) => o.status === 'DELAYED').length;
  const completed = objectives.filter((o) => o.status === 'COMPLETED').length;
  const avgProgress = objectives.length > 0 ? Math.round(objectives.reduce((sum, o) => sum + o.progressPercent, 0) / objectives.length) : 0;
  const kpisOnTarget = kpis.filter((k) => k.status === 'ON_TARGET').length;
  const kpisAtRisk = kpis.filter((k) => k.status === 'AT_RISK' || k.status === 'OFF_TARGET').length;

  return { objectives, initiatives, kpis, stats: { onTrack, atRisk, delayed, completed, avgProgress, kpisOnTarget, kpisAtRisk, total: objectives.length } };
}

export default async function ObjectivesPage() {
  const { objectives, initiatives, kpis, stats } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Strategy Objectives</h2>
          <p className="text-muted-foreground">Track security strategy objectives and initiatives</p>
        </div>
        <Link href="/objectives/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Objective
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">On Track</CardTitle><CheckCircle className="h-4 w-4 text-green-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{stats.onTrack}</div><p className="text-xs text-muted-foreground">of {stats.total} objectives</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">At Risk / Delayed</CardTitle><AlertTriangle className="h-4 w-4 text-yellow-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">{stats.atRisk + stats.delayed}</div><p className="text-xs text-muted-foreground">{stats.atRisk} at risk, {stats.delayed} delayed</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Avg Progress</CardTitle><TrendingUp className="h-4 w-4 text-blue-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.avgProgress}%</div><Progress value={stats.avgProgress} className="mt-2" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">KPIs Health</CardTitle><LineChart className="h-4 w-4 text-purple-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.kpisOnTarget}/{kpis.length}</div><p className="text-xs text-muted-foreground">{stats.kpisAtRisk} need attention</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Strategy Objectives</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {objectives.map((obj) => (
                <Link key={obj.id} href={`/objectives/${obj.id}`} className="block p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{obj.title}</div>
                    <Badge className={getObjectiveStatusColor(obj.status as any)}>{obj.status.replace('_', ' ')}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <span>{obj.code}</span>
                    {obj.owner && <span>• {obj.owner.name}</span>}
                    <span>• {obj._count.initiatives} initiatives</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={obj.progressPercent} className="flex-1" />
                    <span className="text-sm font-medium w-12 text-right">{obj.progressPercent}%</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Key Performance Indicators</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {kpis.slice(0, 6).map((kpi) => (
                <div key={kpi.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="font-medium">{kpi.name}</div>
                    <div className="text-sm text-muted-foreground">{kpi.objective.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{kpi.currentValue?.toString() || '-'}</span>
                      <span className="text-muted-foreground">/ {kpi.targetValue?.toString() || '-'}</span>
                      <span className="text-sm">{kpi.unit}</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <span className="text-sm">{getTrendIcon(kpi.trend as any)}</span>
                      <Badge variant="outline" className={getKPIStatusColor(kpi.status as any)}>{kpi.status.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Active Initiatives</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {initiatives.slice(0, 6).map((init) => (
              <div key={init.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={init.status === 'IN_PROGRESS' ? 'default' : 'secondary'}>{init.status.replace('_', ' ')}</Badge>
                  <span className="text-sm font-medium">{init.progressPercent}%</span>
                </div>
                <h4 className="font-medium mb-1">{init.title}</h4>
                <p className="text-sm text-muted-foreground mb-2">{init.objective.title}</p>
                <Progress value={init.progressPercent} className="mb-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{init.owner?.name || 'Unassigned'}</span>
                  <span>Due: {init.targetDate ? formatDate(init.targetDate) : 'TBD'}</span>
                </div>
                {init.budget && (
                  <div className="mt-2 text-xs">
                    <span className="text-muted-foreground">Budget: </span>
                    <span>{formatCurrency(Number(init.actualSpend) || 0)} / {formatCurrency(Number(init.budget))}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
