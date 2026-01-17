export const dynamic = 'force-dynamic';

import { prisma } from '@aegisciso/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from '@aegisciso/ui';
import { FileCheck, Shield, CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react';

async function getComplianceData() {
  const frameworks = await prisma.framework.findMany({
    where: { isActive: true },
    include: {
      controls: {
        include: {
          mappings: {
            include: {
              policyStatement: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const latestSnapshot = await prisma.postureSnapshot.findFirst({
    orderBy: { snapshotDate: 'desc' },
  });

  return { frameworks, latestSnapshot };
}

function getFrameworkStats(controls: any[]) {
  const totalControls = controls.length;
  const mappedControls = controls.filter(c => c.mappings.length > 0).length;
  const fullyCovered = controls.filter(c =>
    c.mappings.some((m: any) => m.coverageLevel === 'FULL')
  ).length;
  const partiallyCovered = controls.filter(c =>
    c.mappings.length > 0 && !c.mappings.some((m: any) => m.coverageLevel === 'FULL')
  ).length;
  const notCovered = totalControls - mappedControls;

  const coveragePercent = totalControls > 0
    ? Math.round((mappedControls / totalControls) * 100)
    : 0;

  return {
    totalControls,
    mappedControls,
    fullyCovered,
    partiallyCovered,
    notCovered,
    coveragePercent,
  };
}

export default async function CompliancePage() {
  const { frameworks, latestSnapshot } = await getComplianceData();

  if (frameworks.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compliance</h1>
          <p className="text-muted-foreground">Framework compliance and control mappings</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <FileCheck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-medium">No compliance frameworks configured</p>
            <p className="text-sm text-muted-foreground">
              Compliance frameworks will appear here once added to the system.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate overall compliance metrics
  const allControls = frameworks.flatMap(f => f.controls);
  const overallStats = getFrameworkStats(allControls);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance</h1>
        <p className="text-muted-foreground">
          Framework compliance and control mappings
          {latestSnapshot && ` • Coverage: ${latestSnapshot.complianceCoverage}%`}
        </p>
      </div>

      {/* Overall Compliance Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Overall Coverage</p>
                <p className="text-3xl font-bold text-primary">{overallStats.coveragePercent}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/40" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Controls</p>
                <p className="text-3xl font-bold">{overallStats.totalControls}</p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Fully Covered</p>
                <p className="text-3xl font-bold text-green-600">{overallStats.fullyCovered}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600/40" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Gaps</p>
                <p className="text-3xl font-bold text-red-600">{overallStats.notCovered}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Frameworks List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Compliance Frameworks</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {frameworks.map((framework) => {
            const stats = getFrameworkStats(framework.controls);
            const statusColor = stats.coveragePercent >= 80
              ? 'text-green-600'
              : stats.coveragePercent >= 50
                ? 'text-amber-600'
                : 'text-red-600';

            return (
              <Card key={framework.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-primary" />
                      {framework.name}
                    </CardTitle>
                    <Badge variant="outline">{framework.code}</Badge>
                  </div>
                  {framework.description && (
                    <CardDescription className="line-clamp-2">
                      {framework.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Coverage Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Coverage</span>
                      <span className={`font-semibold ${statusColor}`}>
                        {stats.coveragePercent}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          stats.coveragePercent >= 80
                            ? 'bg-green-600'
                            : stats.coveragePercent >= 50
                              ? 'bg-amber-500'
                              : 'bg-red-600'
                        }`}
                        style={{ width: `${stats.coveragePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Control Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <p className="text-lg font-semibold text-green-600">{stats.fullyCovered}</p>
                      <p className="text-xs text-muted-foreground">Full</p>
                    </div>
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                      <p className="text-lg font-semibold text-amber-600">{stats.partiallyCovered}</p>
                      <p className="text-xs text-muted-foreground">Partial</p>
                    </div>
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                      <p className="text-lg font-semibold text-red-600">{stats.notCovered}</p>
                      <p className="text-xs text-muted-foreground">Gap</p>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t">
                    <span>Version {framework.version}</span>
                    <span>{stats.totalControls} controls</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Control Mappings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Control Coverage Details</CardTitle>
          <CardDescription>
            Breakdown of control coverage by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {frameworks.slice(0, 1).map((framework) => {
              // Group controls by category
              const categories = framework.controls.reduce((acc: Record<string, any[]>, control) => {
                const cat = control.category || 'Uncategorized';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(control);
                return acc;
              }, {});

              return Object.entries(categories).slice(0, 6).map(([category, controls]) => {
                const catStats = getFrameworkStats(controls as any[]);
                return (
                  <div key={category} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{category}</p>
                      <p className="text-xs text-muted-foreground">
                        {catStats.mappedControls} of {catStats.totalControls} controls mapped
                      </p>
                    </div>
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          catStats.coveragePercent >= 80
                            ? 'bg-green-600'
                            : catStats.coveragePercent >= 50
                              ? 'bg-amber-500'
                              : 'bg-red-600'
                        }`}
                        style={{ width: `${catStats.coveragePercent}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {catStats.coveragePercent}%
                    </span>
                  </div>
                );
              });
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
