import { notFound } from 'next/navigation';
import { prisma } from '@aegisciso/db';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@aegisciso/ui';
import { ArrowLeft, Edit, Link2, Plus } from 'lucide-react';
import Link from 'next/link';
import { getPolicyStatusColor, getPriorityColor, getCoverageLevelColor, formatDate } from '@aegisciso/shared';

interface PolicyPageProps {
  params: { id: string };
}

async function getPolicy(id: string) {
  return prisma.policy.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      statements: {
        orderBy: { code: 'asc' },
        include: {
          mappings: {
            include: {
              frameworkControl: {
                include: { framework: true },
              },
            },
          },
        },
      },
    },
  });
}

async function getFrameworks() {
  return prisma.framework.findMany({
    where: { isActive: true },
    include: {
      controls: { orderBy: { code: 'asc' } },
    },
  });
}

export default async function PolicyDetailPage({ params }: PolicyPageProps) {
  const [policy, frameworks] = await Promise.all([
    getPolicy(params.id),
    getFrameworks(),
  ]);

  if (!policy) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/policies">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{policy.title}</h2>
              <Badge className={getPolicyStatusColor(policy.status as any)}>
                {policy.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{policy.code} • v{policy.version}</p>
          </div>
        </div>
        <Link href={`/policies/${policy.id}/edit`}>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Policy
          </Button>
        </Link>
      </div>

      {/* Policy Details */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <div className="text-sm text-muted-foreground">Category</div>
              <div className="font-medium">{policy.category || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Department</div>
              <div className="font-medium">{policy.department || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Owner</div>
              <div className="font-medium">{policy.owner?.name || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Review Date</div>
              <div className="font-medium">{policy.reviewDate ? formatDate(policy.reviewDate) : '-'}</div>
            </div>
          </div>
          {policy.description && (
            <div className="mt-4">
              <div className="text-sm text-muted-foreground">Description</div>
              <p className="mt-1">{policy.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statements */}
      <Tabs defaultValue="statements">
        <TabsList>
          <TabsTrigger value="statements">Statements ({policy.statements.length})</TabsTrigger>
          <TabsTrigger value="mappings">Mappings</TabsTrigger>
        </TabsList>
        <TabsContent value="statements" className="mt-4 space-y-4">
          {policy.statements.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No statements yet. Add your first statement to this policy.
              </CardContent>
            </Card>
          ) : (
            policy.statements.map((statement) => (
              <Card key={statement.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-mono">{statement.code}</CardTitle>
                      <Badge className={getPriorityColor(statement.priority as any)}>
                        {statement.priority}
                      </Badge>
                      {statement.wordingScore && (
                        <Badge variant="outline">
                          Clarity: {statement.wordingScore}%
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {statement.mappings.length} mapping{statement.mappings.length !== 1 ? 's' : ''}
                      </span>
                      <Button variant="ghost" size="sm">
                        <Link2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{statement.content}</p>
                  {statement.requirement && (
                    <div className="mt-2">
                      <span className="text-xs text-muted-foreground">Requirement:</span>
                      <span className="ml-1 text-sm">{statement.requirement}</span>
                    </div>
                  )}
                  {statement.wordingFlags && statement.wordingFlags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {statement.wordingFlags.map((flag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs text-yellow-600">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {statement.mappings.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-xs text-muted-foreground mb-2">Mapped to:</div>
                      <div className="flex flex-wrap gap-2">
                        {statement.mappings.map((mapping) => (
                          <Badge
                            key={mapping.id}
                            variant="secondary"
                            className={getCoverageLevelColor(mapping.coverageLevel as any)}
                          >
                            {mapping.frameworkControl.framework.code}: {mapping.frameworkControl.code}
                            {mapping.isVerified && ' ✓'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        <TabsContent value="mappings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Control Mappings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {frameworks.map((framework) => (
                  <div key={framework.id} className="border rounded-lg p-4">
                    <h4 className="font-semibold">{framework.name} ({framework.code})</h4>
                    <p className="text-sm text-muted-foreground mb-3">{framework.description}</p>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {framework.controls.slice(0, 6).map((control) => {
                        const isMapped = policy.statements.some((s) =>
                          s.mappings.some((m) => m.frameworkControlId === control.id)
                        );
                        return (
                          <div
                            key={control.id}
                            className={`p-2 rounded text-sm ${
                              isMapped ? 'bg-green-50 border border-green-200' : 'bg-muted'
                            }`}
                          >
                            <div className="font-mono font-medium">{control.code}</div>
                            <div className="text-xs text-muted-foreground truncate">{control.title}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
