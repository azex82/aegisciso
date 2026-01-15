import { notFound } from 'next/navigation';
import { prisma } from '@aegisciso/db';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Progress } from '@aegisciso/ui';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import { getObjectiveStatusColor, getKPIStatusColor, getTrendIcon, formatDate, formatCurrency } from '@aegisciso/shared';

interface ObjectivePageProps {
  params: { id: string };
}

async function getObjective(id: string) {
  return prisma.strategyObjective.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      initiatives: {
        orderBy: { targetDate: 'asc' },
        include: { owner: { select: { name: true } } },
      },
      kpis: {
        include: { measurements: { orderBy: { measuredAt: 'desc' }, take: 5 } },
      },
    },
  });
}

export default async function ObjectiveDetailPage({ params }: ObjectivePageProps) {
  const objective = await getObjective(params.id);

  if (!objective) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/objectives">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{objective.title}</h2>
              <Badge className={getObjectiveStatusColor(objective.status as any)}>
                {objective.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-muted-foreground">{objective.code}</p>
          </div>
        </div>
        <Link href={`/objectives/${objective.id}/edit`}>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Objective
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Objective Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground">Owner</div>
                <div className="font-medium">{objective.owner?.name || 'Unassigned'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Fiscal Year</div>
                <div className="font-medium">{objective.fiscalYear}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Priority</div>
                <div className="font-medium">P{objective.priority}</div>
              </div>
            </div>
            {objective.description && (
              <div>
                <div className="text-sm text-muted-foreground">Description</div>
                <p className="mt-1">{objective.description}</p>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground mb-2">Progress</div>
              <div className="flex items-center gap-4">
                <Progress value={objective.progressPercent} className="flex-1" />
                <span className="text-2xl font-bold">{objective.progressPercent}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="font-medium">{formatDate(objective.createdAt)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Target Date</div>
              <div className="font-medium">{objective.targetDate ? formatDate(objective.targetDate) : '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Last Updated</div>
              <div className="font-medium">{formatDate(objective.updatedAt)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Initiatives ({objective.initiatives.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {objective.initiatives.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No initiatives for this objective</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {objective.initiatives.map((init) => (
                <div key={init.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={init.status === 'IN_PROGRESS' ? 'default' : init.status === 'COMPLETED' ? 'secondary' : 'outline'}>
                      {init.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm font-medium">{init.progressPercent}%</span>
                  </div>
                  <h4 className="font-medium mb-1">{init.title}</h4>
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
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators ({objective.kpis.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {objective.kpis.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No KPIs for this objective</p>
          ) : (
            <div className="space-y-4">
              {objective.kpis.map((kpi) => (
                <div key={kpi.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{kpi.name}</h4>
                      <p className="text-sm text-muted-foreground">{kpi.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{kpi.currentValue?.toString() || '-'}</span>
                        <span className="text-muted-foreground">/ {kpi.targetValue?.toString()}</span>
                        <span className="text-sm">{kpi.unit}</span>
                      </div>
                      <div className="flex items-center gap-1 justify-end mt-1">
                        <span>{getTrendIcon(kpi.trend as any)}</span>
                        <Badge variant="outline" className={getKPIStatusColor(kpi.status as any)}>
                          {kpi.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {kpi.measurements.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-muted-foreground mb-2">Recent Measurements</div>
                      <div className="flex gap-2">
                        {kpi.measurements.map((m) => (
                          <div key={m.id} className="text-xs bg-muted px-2 py-1 rounded">
                            {m.value.toString()} ({formatDate(m.measuredAt)})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
