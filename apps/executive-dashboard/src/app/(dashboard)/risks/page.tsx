import { prisma } from '@aegisciso/db';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tooltip, TooltipContent, TooltipTrigger } from '@aegisciso/ui';
import { ShieldAlert, FileWarning, CheckCircle, AlertTriangle, Clock, Plus, Download, Filter, Search, User, Calendar, Target, ArrowRight, Activity, XCircle } from 'lucide-react';
import Link from 'next/link';
import { getRiskLevel, getRiskColor, formatDate } from '@aegisciso/shared';

async function getDashboardData() {
  const [risks, findings, exceptions, remediationPlans] = await Promise.all([
    prisma.risk.findMany({
      where: { status: { not: 'CLOSED' } },
      orderBy: { inherentRiskScore: 'desc' },
      include: {
        owner: { select: { name: true } },
        remediationPlans: {
          orderBy: { dueDate: 'asc' },
          include: { owner: { select: { name: true } } },
        },
      },
    }),
    prisma.finding.findMany({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }, orderBy: { severity: 'asc' } }),
    prisma.exception.findMany({ where: { status: { in: ['PENDING', 'APPROVED'] } } }),
    prisma.remediationPlan.findMany({
      where: { status: { not: 'COMPLETED' } },
      orderBy: { dueDate: 'asc' },
      include: {
        risk: { select: { code: true, title: true } },
        owner: { select: { name: true } },
      },
    }),
  ]);

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const criticalRisks = risks.filter((r) => r.inherentRiskScore >= 20).length;
  const highRisks = risks.filter((r) => r.inherentRiskScore >= 12 && r.inherentRiskScore < 20).length;
  const mediumRisks = risks.filter((r) => r.inherentRiskScore >= 6 && r.inherentRiskScore < 12).length;
  const lowRisks = risks.filter((r) => r.inherentRiskScore < 6).length;
  const criticalFindings = findings.filter((f) => f.severity === 'CRITICAL').length;
  const overdueFindings = findings.filter((f) => f.dueDate && new Date(f.dueDate) < now).length;
  const pendingExceptions = exceptions.filter((e) => e.status === 'PENDING').length;
  const overdueRemediations = remediationPlans.filter((r) => new Date(r.dueDate) < now).length;
  const expiringSoonRemediations = remediationPlans.filter((r) => {
    const dueDate = new Date(r.dueDate);
    return dueDate >= now && dueDate <= thirtyDaysFromNow;
  }).length;

  return {
    risks,
    findings,
    exceptions,
    remediationPlans,
    stats: {
      criticalRisks,
      highRisks,
      mediumRisks,
      lowRisks,
      totalRisks: risks.length,
      criticalFindings,
      overdueFindings,
      pendingExceptions,
      overdueRemediations,
      expiringSoonRemediations,
      totalRemediations: remediationPlans.length,
    },
  };
}

function getRiskCellColor(score: number): string {
  if (score >= 20) return '#dc2626'; // Critical - Red
  if (score >= 12) return '#ea580c'; // High - Orange
  if (score >= 6) return '#d97706';  // Medium - Amber
  return '#16a34a';                   // Low - Green
}

export default async function RisksPage() {
  const { risks, findings, remediationPlans, stats } = await getDashboardData();

  const now = new Date();
  const overdueRemediations = remediationPlans.filter((r) => new Date(r.dueDate) < now);
  const expiringSoonRemediations = remediationPlans.filter((r) => {
    const dueDate = new Date(r.dueDate);
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    return dueDate >= now && dueDate <= thirtyDays;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Risk Management</h2>
          <p className="text-muted-foreground">
            Monitor risks, remediation plans, and findings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/risks/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Risk
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Open Risks</p>
                <p className="text-2xl font-bold">{stats.totalRisks}</p>
                <div className="flex gap-2 mt-1 text-xs">
                  <span className="text-red-600">{stats.criticalRisks}C</span>
                  <span className="text-orange-600">{stats.highRisks}H</span>
                  <span className="text-amber-600">{stats.mediumRisks}M</span>
                  <span className="text-green-600">{stats.lowRisks}L</span>
                </div>
              </div>
              <ShieldAlert className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card className={stats.criticalRisks > 0 ? 'border-red-200 bg-red-50/30' : ''}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Critical Risks</p>
                <p className={`text-2xl font-bold ${stats.criticalRisks > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.criticalRisks}
                </p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${stats.criticalRisks > 0 ? 'text-red-100' : 'text-green-100'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className={stats.overdueRemediations > 0 ? 'border-red-200 bg-red-50/30' : ''}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Overdue Remediations</p>
                <p className={`text-2xl font-bold ${stats.overdueRemediations > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.overdueRemediations}
                </p>
              </div>
              <XCircle className={`h-8 w-8 ${stats.overdueRemediations > 0 ? 'text-red-100' : 'text-green-100'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className={stats.expiringSoonRemediations > 0 ? 'border-amber-200 bg-amber-50/30' : ''}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Expiring Soon</p>
                <p className={`text-2xl font-bold ${stats.expiringSoonRemediations > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {stats.expiringSoonRemediations}
                </p>
              </div>
              <Clock className={`h-8 w-8 ${stats.expiringSoonRemediations > 0 ? 'text-amber-100' : 'text-green-100'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Open Findings</p>
                <p className="text-2xl font-bold">{findings.length}</p>
                <p className="text-xs text-muted-foreground">{stats.overdueFindings} overdue</p>
              </div>
              <FileWarning className="h-8 w-8 text-amber-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap and Remediation Panels */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Interactive Risk Heatmap */}
        <Card className="executive-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Risk Heatmap (Impact vs Likelihood)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[400px]">
                {/* Header Row */}
                <div className="grid grid-cols-6 gap-2 mb-2">
                  <div className="text-xs text-muted-foreground text-center py-2"></div>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="text-xs font-medium text-center py-2 bg-muted/30 rounded">
                      Impact: {i}
                    </div>
                  ))}
                </div>

                {/* Heatmap Grid */}
                {[5, 4, 3, 2, 1].map((likelihood) => (
                  <div key={likelihood} className="grid grid-cols-6 gap-2 mb-2">
                    <div className="text-xs font-medium flex items-center justify-center bg-muted/30 rounded py-4">
                      L: {likelihood}
                    </div>
                    {[1, 2, 3, 4, 5].map((impact) => {
                      const score = likelihood * impact;
                      const cellRisks = risks.filter(
                        (r) => r.inherentLikelihood === likelihood && r.inherentImpact === impact
                      );
                      const count = cellRisks.length;
                      const bgColor = count > 0 ? getRiskCellColor(score) : '#f3f4f6';
                      const textColor = count > 0 ? 'white' : '#9ca3af';

                      return (
                        <Tooltip key={`${likelihood}-${impact}`}>
                          <TooltipTrigger asChild>
                            <div
                              className="h-14 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:ring-2 hover:ring-primary hover:ring-offset-2"
                              style={{ backgroundColor: bgColor, color: textColor }}
                            >
                              {count > 0 && (
                                <>
                                  <span className="text-lg font-bold">{count}</span>
                                  <span className="text-[10px] opacity-80">Score: {score}</span>
                                </>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-medium">
                              L:{likelihood} × I:{impact} = Score {score}
                            </p>
                            {count > 0 ? (
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-muted-foreground">{count} risk(s):</p>
                                {cellRisks.slice(0, 3).map((r) => (
                                  <p key={r.id} className="text-xs truncate">{r.code}: {r.title}</p>
                                ))}
                                {count > 3 && <p className="text-xs">+{count - 3} more...</p>}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">No risks</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-6 rounded" style={{ backgroundColor: '#dc2626' }} />
                    <span>Critical (20-25)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-6 rounded" style={{ backgroundColor: '#ea580c' }} />
                    <span>High (12-19)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-6 rounded" style={{ backgroundColor: '#d97706' }} />
                    <span>Medium (6-11)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-6 rounded" style={{ backgroundColor: '#16a34a' }} />
                    <span>Low (1-5)</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Remediation Panels */}
        <div className="space-y-4">
          {/* Overdue Remediations */}
          <Card className={overdueRemediations.length > 0 ? 'border-red-200' : ''}>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <XCircle className={`h-4 w-4 ${overdueRemediations.length > 0 ? 'text-red-500' : 'text-green-500'}`} />
                Overdue Remediations
                {overdueRemediations.length > 0 && (
                  <Badge variant="destructive" className="ml-auto">{overdueRemediations.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {overdueRemediations.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {overdueRemediations.slice(0, 4).map((plan) => {
                    const daysOverdue = Math.ceil((now.getTime() - new Date(plan.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={plan.id} className="p-2 rounded bg-red-50 border border-red-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium truncate">{plan.title}</span>
                          <Badge variant="destructive" className="text-[10px]">{daysOverdue}d</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{plan.risk?.code}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-1" />
                  <p className="text-xs text-muted-foreground">No overdue remediations</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expiring Soon */}
          <Card className={expiringSoonRemediations.length > 0 ? 'border-amber-200' : ''}>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className={`h-4 w-4 ${expiringSoonRemediations.length > 0 ? 'text-amber-500' : 'text-green-500'}`} />
                Expiring Soon (30 days)
                {expiringSoonRemediations.length > 0 && (
                  <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-800">{expiringSoonRemediations.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {expiringSoonRemediations.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {expiringSoonRemediations.slice(0, 4).map((plan) => {
                    const daysUntil = Math.ceil((new Date(plan.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={plan.id} className="p-2 rounded bg-amber-50 border border-amber-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium truncate">{plan.title}</span>
                          <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800">{daysUntil}d</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{plan.risk?.code}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-1" />
                  <p className="text-xs text-muted-foreground">No plans expiring soon</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Risks */}
      <Card className="executive-card">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Top Risks by Score
            </CardTitle>
            <Link href="/risks" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {risks.slice(0, 6).map((risk) => (
              <Link key={risk.id} href={`/risks/${risk.id}`}>
                <div className="p-4 rounded-lg border hover:border-primary/30 hover:bg-muted/30 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{risk.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{risk.code} | {risk.category}</p>
                    </div>
                    <Badge
                      className="shrink-0"
                      style={{
                        backgroundColor: getRiskCellColor(risk.inherentRiskScore),
                        color: 'white',
                      }}
                    >
                      {risk.inherentRiskScore}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{risk.owner?.name || 'Unassigned'}</span>
                    {risk.targetDate && (
                      <>
                        <span>|</span>
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(risk.targetDate)}</span>
                      </>
                    )}
                  </div>
                  {risk.remediationPlans && risk.remediationPlans.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {risk.remediationPlans.length} remediation plan(s)
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filter:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">All Risks</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted bg-red-50 text-red-800">Critical</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted bg-orange-50 text-orange-800">High</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted bg-amber-50 text-amber-800">Medium</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted bg-green-50 text-green-800">Low</Badge>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search risks..."
                  className="pl-9 pr-4 py-1.5 text-sm border rounded-md bg-background w-64"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Risks Table */}
      <Card className="executive-card">
        <CardHeader className="py-4">
          <CardTitle className="text-lg">All Risks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[100px]">Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-[120px]">Category</TableHead>
                <TableHead className="w-[80px]">Priority</TableHead>
                <TableHead className="w-[100px]">Inherent</TableHead>
                <TableHead className="w-[100px]">Residual</TableHead>
                <TableHead className="w-[120px]">Owner</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[100px]">Target Date</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {risks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="font-medium">No risks found</p>
                    <p className="text-sm">Create your first risk to start tracking.</p>
                  </TableCell>
                </TableRow>
              ) : (
                risks.map((risk) => (
                  <TableRow key={risk.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono font-medium text-primary">{risk.code}</TableCell>
                    <TableCell>
                      <Link href={`/risks/${risk.id}`} className="hover:text-primary hover:underline">
                        {risk.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{risk.category || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          risk.priority === 1 ? 'bg-red-100 text-red-800' :
                          risk.priority === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        P{risk.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        style={{
                          backgroundColor: getRiskCellColor(risk.inherentRiskScore),
                          color: 'white',
                        }}
                      >
                        {risk.inherentRiskScore}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {risk.residualRiskScore ? (
                        <Badge variant="outline">{risk.residualRiskScore}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{risk.owner?.name || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">{risk.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {risk.targetDate ? formatDate(risk.targetDate) : '-'}
                    </TableCell>
                    <TableCell>
                      <Link href={`/risks/${risk.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
