import { prisma } from '@aegisciso/db';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@aegisciso/ui';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getPolicyStatusColor, formatDate } from '@aegisciso/shared';

async function getPolicies() {
  return prisma.policy.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      owner: { select: { name: true } },
      _count: { select: { statements: true } },
    },
  });
}

export default async function PoliciesPage() {
  const policies = await getPolicies();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Policies</h2>
          <p className="text-muted-foreground">Manage your security policies and statements</p>
        </div>
        <Link href="/policies/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Policy
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Statements</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No policies found. Create your first policy to get started.
                  </TableCell>
                </TableRow>
              ) : (
                policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-mono font-medium">{policy.code}</TableCell>
                    <TableCell>{policy.title}</TableCell>
                    <TableCell>
                      <Badge className={getPolicyStatusColor(policy.status as any)}>
                        {policy.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{policy._count.statements}</TableCell>
                    <TableCell>{policy.owner?.name || '-'}</TableCell>
                    <TableCell>{formatDate(policy.updatedAt)}</TableCell>
                    <TableCell>
                      <Link href={`/policies/${policy.id}`}>
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
