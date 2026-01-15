'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@aegisciso/ui';
import { Activity, LogIn, FileEdit, Plus, Trash2, Eye } from 'lucide-react';
import { formatDateTime } from '@aegisciso/shared';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  createdAt: Date;
  user: { name: string; email: string } | null;
}

interface RecentActivityProps {
  auditLogs: AuditLog[];
}

export function RecentActivity({ auditLogs }: RecentActivityProps) {
  if (auditLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
          No recent activity
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                {getActionIcon(log.action)}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{log.user?.name || 'System'}</span>
                  {' '}
                  {getActionVerb(log.action)}
                  {' '}
                  <span className="font-medium">{log.resource}</span>
                  {log.resourceId && (
                    <span className="text-muted-foreground"> ({log.resourceId.slice(0, 8)}...)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(log.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getActionIcon(action: string) {
  switch (action.toUpperCase()) {
    case 'LOGIN':
      return <LogIn className="h-4 w-4" />;
    case 'CREATE':
      return <Plus className="h-4 w-4" />;
    case 'UPDATE':
      return <FileEdit className="h-4 w-4" />;
    case 'DELETE':
      return <Trash2 className="h-4 w-4" />;
    case 'READ':
      return <Eye className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
}

function getActionVerb(action: string): string {
  switch (action.toUpperCase()) {
    case 'LOGIN':
      return 'logged in to';
    case 'CREATE':
      return 'created';
    case 'UPDATE':
      return 'updated';
    case 'DELETE':
      return 'deleted';
    case 'READ':
      return 'viewed';
    default:
      return action.toLowerCase();
  }
}
