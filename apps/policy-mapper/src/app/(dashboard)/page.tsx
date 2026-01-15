import { prisma } from '@aegisciso/db';
import { Card, CardContent, CardHeader, CardTitle } from '@aegisciso/ui';
import { FileText, Link2, FileCheck, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

async function getStats() {
  const [
    policiesCount,
    statementsCount,
    frameworksCount,
    mappingsCount,
    unmappedStatements,
    lowConfidenceMappings,
  ] = await Promise.all([
    prisma.policy.count(),
    prisma.policyStatement.count(),
    prisma.framework.count(),
    prisma.mapping.count(),
    prisma.policyStatement.count({
      where: { mappings: { none: {} } },
    }),
    prisma.mapping.count({
      where: { confidence: { lt: 70 }, isVerified: false },
    }),
  ]);

  return {
    policies: policiesCount,
    statements: statementsCount,
    frameworks: frameworksCount,
    mappings: mappingsCount,
    unmapped: unmappedStatements,
    needsReview: lowConfidenceMappings,
  };
}

async function getRecentMappings() {
  return prisma.mapping.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      policyStatement: {
        include: { policy: true },
      },
      frameworkControl: {
        include: { framework: true },
      },
    },
  });
}

export default async function DashboardPage() {
  const [stats, recentMappings] = await Promise.all([
    getStats(),
    getRecentMappings(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Policy Mapper Dashboard</h2>
        <p className="text-muted-foreground">
          Map policy statements to compliance framework controls
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Policies</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.policies}</div>
            <p className="text-xs text-muted-foreground">{stats.statements} statements</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frameworks</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.frameworks}</div>
            <p className="text-xs text-muted-foreground">Active frameworks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mappings</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mappings}</div>
            <p className="text-xs text-muted-foreground">Policy-to-control links</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Action Required</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unmapped + stats.needsReview}</div>
            <p className="text-xs text-muted-foreground">
              {stats.unmapped} unmapped, {stats.needsReview} to review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/policies">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Policies</h3>
                  <p className="text-sm text-muted-foreground">View and edit policy statements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/frameworks">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Browse Frameworks</h3>
                  <p className="text-sm text-muted-foreground">Explore compliance controls</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/mappings">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Link2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Create Mappings</h3>
                  <p className="text-sm text-muted-foreground">Link policies to controls</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Mappings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          {recentMappings.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No mappings yet</p>
          ) : (
            <div className="space-y-4">
              {recentMappings.map((mapping) => (
                <div key={mapping.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="font-medium">
                      {mapping.policyStatement.policy.code}: {mapping.policyStatement.code}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {mapping.policyStatement.content.slice(0, 80)}...
                    </div>
                  </div>
                  <div className="mx-4 text-muted-foreground">→</div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {mapping.frameworkControl.framework.code}: {mapping.frameworkControl.code}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {mapping.frameworkControl.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
