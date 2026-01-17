import { prisma } from '@aegisciso/db';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@aegisciso/ui';
import { Plus, FileText, AlertTriangle, Clock, CheckCircle, XCircle, Filter, Search, Download, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import { getPolicyStatusColor, formatDate } from '@aegisciso/shared';
import { PolicyFilters } from '@/components/policies/policy-filters';
import { ExportButton } from '@/components/risks/export-button';

async function getPoliciesData() {
  const [policies, policyStats] = await Promise.all([
    prisma.policy.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        owner: { select: { name: true } },
        _count: { select: { statements: true } },
        statements: {
          select: {
            _count: { select: { mappings: true } },
          },
        },
      },
    }),
    prisma.policy.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
  ]);

  // Calculate stats
  const totalPolicies = policies.length;
  const publishedPolicies = policies.filter(p => p.status === 'PUBLISHED').length;
  const draftPolicies = policies.filter(p => p.status === 'DRAFT').length;
  const needsReview = policies.filter(p => {
    if (!p.reviewDate) return false;
    const reviewDate = new Date(p.reviewDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return reviewDate <= thirtyDaysFromNow;
  }).length;
  const expiringSoon = policies.filter(p => {
    if (!p.expiryDate) return false;
    const expiryDate = new Date(p.expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
  }).length;

  return {
    policies,
    stats: {
      total: totalPolicies,
      published: publishedPolicies,
      draft: draftPolicies,
      needsReview,
      expiringSoon,
    },
  };
}

function getMaturityColor(level: number): string {
  const colors: Record<number, string> = {
    1: 'bg-red-100 text-red-800 border-red-200',
    2: 'bg-orange-100 text-orange-800 border-orange-200',
    3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    4: 'bg-lime-100 text-lime-800 border-lime-200',
    5: 'bg-green-100 text-green-800 border-green-200',
  };
  return colors[level] || colors[1];
}

function getValidityBadge(policy: any) {
  const now = new Date();

  if (policy.expiryDate && new Date(policy.expiryDate) < now) {
    return <Badge variant="destructive" className="text-[10px]"><XCircle className="h-3 w-3 mr-1" />Expired</Badge>;
  }

  if (policy.expiryDate) {
    const expiryDate = new Date(policy.expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    if (expiryDate <= thirtyDaysFromNow) {
      return <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800"><Clock className="h-3 w-3 mr-1" />Expiring Soon</Badge>;
    }
  }

  if (policy.reviewDate && new Date(policy.reviewDate) < now) {
    return <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-800"><Calendar className="h-3 w-3 mr-1" />Review Due</Badge>;
  }

  return <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Valid</Badge>;
}

interface PageProps {
  searchParams: { filter?: string; search?: string };
}

export default async function PoliciesPage({ searchParams }: PageProps) {
  const { policies: allPolicies, stats } = await getPoliciesData();

  // Filter policies based on URL params
  const filter = searchParams.filter || 'all';
  const search = searchParams.search?.toLowerCase() || '';
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const policies = allPolicies.filter((policy) => {
    // Apply status filter
    let matchesFilter = true;
    if (filter === 'published') matchesFilter = policy.status === 'PUBLISHED';
    else if (filter === 'draft') matchesFilter = policy.status === 'DRAFT';
    else if (filter === 'review') {
      matchesFilter = !!(policy.reviewDate && new Date(policy.reviewDate) <= thirtyDaysFromNow);
    }
    else if (filter === 'expiring') {
      const expiryDate = policy.expiryDate ? new Date(policy.expiryDate) : null;
      matchesFilter = !!(expiryDate && expiryDate <= thirtyDaysFromNow && expiryDate > now);
    }

    // Apply search filter
    const matchesSearch = !search ||
      policy.title.toLowerCase().includes(search) ||
      policy.code.toLowerCase().includes(search) ||
      policy.category?.toLowerCase().includes(search) ||
      policy.description?.toLowerCase().includes(search);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cybersecurity Policies</h2>
          <p className="text-muted-foreground">
            Policy management, framework mapping, and compliance tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            data={allPolicies}
            filename="policies-export"
            headers={['Code', 'Title', 'Status', 'Maturity', 'Category', 'Framework', 'Owner', 'Review Date']}
            getRow={(policy) => [
              policy.code,
              policy.title,
              policy.status,
              `Level ${policy.maturityLevel}`,
              policy.category || '',
              policy.frameworkSource || '',
              policy.owner?.name || '',
              policy.reviewDate ? formatDate(policy.reviewDate) : ''
            ]}
          />
          <Link href="/policies/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Policy
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Policies</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Published</p>
                <p className="text-2xl font-bold text-green-600">{stats.published}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold text-blue-600">{stats.draft}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-100" />
            </div>
          </CardContent>
        </Card>
        <Card className={stats.needsReview > 0 ? 'border-amber-200 bg-amber-50/30' : ''}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Needs Review</p>
                <p className={`text-2xl font-bold ${stats.needsReview > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {stats.needsReview}
                </p>
              </div>
              <Calendar className={`h-8 w-8 ${stats.needsReview > 0 ? 'text-amber-100' : 'text-green-100'}`} />
            </div>
          </CardContent>
        </Card>
        <Card className={stats.expiringSoon > 0 ? 'border-red-200 bg-red-50/30' : ''}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Expiring Soon</p>
                <p className={`text-2xl font-bold ${stats.expiringSoon > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.expiringSoon}
                </p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${stats.expiringSoon > 0 ? 'text-red-100' : 'text-green-100'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Row */}
      <Card>
        <CardContent className="py-3">
          <PolicyFilters policies={allPolicies} />
        </CardContent>
      </Card>

      {/* Policies Table */}
      <Card className="executive-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[100px]">Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[90px]">Maturity</TableHead>
                <TableHead className="w-[110px]">Validity</TableHead>
                <TableHead className="w-[100px]">Statements</TableHead>
                <TableHead className="w-[120px]">Owner</TableHead>
                <TableHead className="w-[100px]">Framework</TableHead>
                <TableHead className="w-[110px]">Review Date</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="font-medium">No policies found</p>
                    <p className="text-sm">Create your first policy to get started.</p>
                  </TableCell>
                </TableRow>
              ) : (
                policies.map((policy) => {
                  const totalMappings = policy.statements.reduce(
                    (acc, stmt) => acc + stmt._count.mappings,
                    0
                  );

                  return (
                    <TableRow key={policy.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-medium text-primary">
                        {policy.code}
                      </TableCell>
                      <TableCell>
                        <Link href={`/policies/${policy.id}`} className="hover:text-primary hover:underline">
                          {policy.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${getPolicyStatusColor(policy.status as any)}`}>
                          {policy.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${getMaturityColor(policy.maturityLevel)}`}>
                          Level {policy.maturityLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getValidityBadge(policy)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{policy._count.statements}</span>
                          {totalMappings > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({totalMappings} mapped)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{policy.owner?.name || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {policy.frameworkSource ? (
                          <Badge variant="outline" className="text-[10px]">
                            {policy.frameworkSource}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {policy.reviewDate ? formatDate(policy.reviewDate) : '-'}
                      </TableCell>
                      <TableCell>
                        <Link href={`/policies/${policy.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
