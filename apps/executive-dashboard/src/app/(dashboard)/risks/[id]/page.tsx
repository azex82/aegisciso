export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { prisma } from '@aegisciso/db';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@aegisciso/ui';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import { getRiskLevel, getRiskColor, formatDate } from '@aegisciso/shared';

interface RiskPageProps {
  params: { id: string };
}

async function getRisk(id: string) {
  return prisma.risk.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      controlLinks: {
        include: {
          frameworkControl: {
            include: { framework: true },
          },
        },
      },
      findings: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });
}

export default async function RiskDetailPage({ params }: RiskPageProps) {
  const risk = await getRisk(params.id);

  if (!risk) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/risks">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{risk.title}</h2>
              <Badge className={risk.inherentRiskScore >= 20 ? 'bg-red-500' : risk.inherentRiskScore >= 12 ? 'bg-yellow-500' : 'bg-green-500'}>
                {getRiskLevel(risk.inherentRiskScore)}
              </Badge>
            </div>
            <p className="text-muted-foreground">{risk.code}</p>
          </div>
        </div>
        <Link href={`/risks/${risk.id}/edit`}>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Risk
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Risk Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">Category</div>
                <div className="font-medium">{risk.category}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge variant="secondary">{risk.status}</Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Owner</div>
                <div className="font-medium">{risk.owner?.name || 'Unassigned'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Treatment Status</div>
                <div className="font-medium">{risk.treatmentStatus || '-'}</div>
              </div>
            </div>
            {risk.description && (
              <div>
                <div className="text-sm text-muted-foreground">Description</div>
                <p className="mt-1">{risk.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Scoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground mb-2">Inherent Risk</div>
                <div className="text-3xl font-bold" style={{ color: getRiskColor(risk.inherentRiskScore) }}>
                  {risk.inherentRiskScore}
                </div>
                <div className="text-sm mt-1">
                  Likelihood: {risk.inherentLikelihood} × Impact: {risk.inherentImpact}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground mb-2">Residual Risk</div>
                <div className="text-3xl font-bold" style={{ color: getRiskColor(risk.residualRiskScore || 0) }}>
                  {risk.residualRiskScore || '-'}
                </div>
                {risk.residualLikelihood && risk.residualImpact && (
                  <div className="text-sm mt-1">
                    Likelihood: {risk.residualLikelihood} × Impact: {risk.residualImpact}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Linked Controls ({risk.controlLinks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {risk.controlLinks.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No controls linked to this risk</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {risk.controlLinks.filter((link) => link.frameworkControl).map((link) => (
                <div key={link.id} className="p-3 rounded-lg border bg-card">
                  <div className="font-mono font-medium">{link.frameworkControl?.code}</div>
                  <div className="text-sm text-muted-foreground">{link.frameworkControl?.title}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{link.frameworkControl?.framework?.code}</Badge>
                    <Badge variant={link.effectiveness === 'EFFECTIVE' ? 'default' : 'secondary'}>
                      {link.effectiveness || 'Not assessed'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Related Findings ({risk.findings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {risk.findings.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No findings linked to this risk</p>
          ) : (
            <div className="space-y-3">
              {risk.findings.map((finding) => (
                <div key={finding.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <div className="font-medium">{finding.title}</div>
                    <div className="text-sm text-muted-foreground">{finding.code}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={finding.severity === 'CRITICAL' ? 'destructive' : finding.severity === 'HIGH' ? 'default' : 'secondary'}>
                      {finding.severity}
                    </Badge>
                    <Badge variant="outline">{finding.status}</Badge>
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
