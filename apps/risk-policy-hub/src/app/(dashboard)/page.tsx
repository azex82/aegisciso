import { prisma } from '@aegisciso/db';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@aegisciso/ui';
import { ShieldAlert, FileWarning, CheckCircle, AlertTriangle, TrendingDown, Clock } from 'lucide-react';
import Link from 'next/link';
import { getRiskLevel, getRiskColor, formatDate } from '@aegisciso/shared';

async function getDashboardData() {
  const [risks, findings, exceptions] = await Promise.all([
    prisma.risk.findMany({ where: { status: { not: 'CLOSED' } }, orderBy: { inherentRiskScore: 'desc' }, include: { owner: { select: { name: true } } } }),
    prisma.finding.findMany({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }, orderBy: { severity: 'asc' } }),
    prisma.exception.findMany({ where: { status: { in: ['PENDING', 'APPROVED'] } } }),
  ]);

  const criticalRisks = risks.filter((r) => r.inherentRiskScore >= 20).length;
  const highRisks = risks.filter((r) => r.inherentRiskScore >= 12 && r.inherentRiskScore < 20).length;
  const criticalFindings = findings.filter((f) => f.severity === 'CRITICAL').length;
  const overdueFindings = findings.filter((f) => f.dueDate && new Date(f.dueDate) < new Date()).length;
  const pendingExceptions = exceptions.filter((e) => e.status === 'PENDING').length;
  const expiringExceptions = exceptions.filter((e) => {
    const daysUntil = Math.ceil((new Date(e.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 30 && daysUntil > 0;
  }).length;

  return { risks, findings, exceptions, stats: { criticalRisks, highRisks, criticalFindings, overdueFindings, pendingExceptions, expiringExceptions } };
}

export default async function DashboardPage() {
  const { risks, findings, stats } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Risk Dashboard</h2>
        <p className="text-muted-foreground">Monitor and manage organizational risks</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Risks</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.criticalRisks}</div>
            <p className="text-xs text-muted-foreground">+ {stats.highRisks} high risks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Findings</CardTitle>
            <FileWarning className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{findings.length}</div>
            <p className="text-xs text-muted-foreground">{stats.criticalFindings} critical, {stats.overdueFindings} overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Exceptions</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingExceptions}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expiringExceptions}</div>
            <p className="text-xs text-muted-foreground">Exceptions in 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Risk Heatmap</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-1 text-xs">
              <div></div>
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="text-center font-medium">I:{i}</div>)}
              {[5, 4, 3, 2, 1].map((l) => (
                <>
                  <div key={`l-${l}`} className="font-medium flex items-center">L:{l}</div>
                  {[1, 2, 3, 4, 5].map((i) => {
                    const score = l * i;
                    const count = risks.filter((r) => r.inherentLikelihood === l && r.inherentImpact === i).length;
                    return (
                      <div key={`${l}-${i}`} className="h-10 rounded flex items-center justify-center text-white font-medium" style={{ backgroundColor: count > 0 ? getRiskColor(score) : '#e5e7eb' }}>
                        {count > 0 ? count : ''}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Risks</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {risks.slice(0, 5).map((risk) => (
                <Link key={risk.id} href={`/risks/${risk.id}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div>
                    <div className="font-medium">{risk.title}</div>
                    <div className="text-sm text-muted-foreground">{risk.code} • {risk.owner?.name || 'Unassigned'}</div>
                  </div>
                  <Badge variant={risk.inherentRiskScore >= 20 ? 'danger' : risk.inherentRiskScore >= 12 ? 'warning' : 'secondary'}>
                    {getRiskLevel(risk.inherentRiskScore)}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Critical Findings</CardTitle></CardHeader>
        <CardContent>
          {findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No critical or high findings</p>
          ) : (
            <div className="space-y-3">
              {findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').slice(0, 5).map((finding) => (
                <div key={finding.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <div className="font-medium">{finding.title}</div>
                    <div className="text-sm text-muted-foreground">{finding.code} • Due: {finding.dueDate ? formatDate(finding.dueDate) : 'Not set'}</div>
                  </div>
                  <Badge variant={finding.severity === 'CRITICAL' ? 'danger' : 'warning'}>{finding.severity}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
