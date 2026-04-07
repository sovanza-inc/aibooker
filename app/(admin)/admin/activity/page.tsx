'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) return { logs: [], total: 0, page: 1, totalPages: 1 };
  return r.json();
};

function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    SIGN_UP: 'bg-green-100 text-green-700',
    SIGN_IN: 'bg-blue-100 text-blue-700',
    SIGN_OUT: 'bg-gray-100 text-gray-600',
    UPDATE_PASSWORD: 'bg-yellow-100 text-yellow-700',
    DELETE_ACCOUNT: 'bg-red-100 text-red-700',
    UPDATE_ACCOUNT: 'bg-purple-100 text-purple-700',
    CREATE_TEAM: 'bg-indigo-100 text-indigo-700',
    REMOVE_TEAM_MEMBER: 'bg-red-100 text-red-700',
    INVITE_TEAM_MEMBER: 'bg-cyan-100 text-cyan-700',
    ACCEPT_INVITATION: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded ${colors[action] || 'bg-gray-100 text-gray-600'}`}>
      {action.replace(/_/g, ' ')}
    </span>
  );
}

interface ActivityRow {
  id: number;
  action: string;
  timestamp: string;
  ipAddress: string | null;
  userName: string | null;
  userEmail: string | null;
  teamName: string | null;
}

export default function AdminActivityPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useSWR(`/api/admin/activity?page=${page}`, fetcher);
  const logs: ActivityRow[] = data?.logs || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Activity Logs</h2>
        <p className="text-sm text-gray-500 mt-1">Audit trail of user actions across the platform</p>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-orange-500 border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Action</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide">User</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide hidden sm:table-cell">Team</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide hidden md:table-cell">IP Address</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-400 py-12 text-sm">No activity logs found</TableCell>
                    </TableRow>
                  ) : (
                    logs.map((l) => (
                      <TableRow key={l.id} className="hover:bg-gray-50/50">
                        <TableCell><ActionBadge action={l.action} /></TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{l.userName || '—'}</p>
                            {l.userEmail && <p className="text-xs text-gray-500 truncate">{l.userEmail}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-gray-600">{l.teamName || '—'}</TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs text-gray-500">{l.ipAddress || '—'}</TableCell>
                        <TableCell className="text-sm text-gray-500">{new Date(l.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500">Page {page} of {totalPages} &middot; {data?.total || 0} events</p>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-7 w-7 p-0">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="h-7 w-7 p-0">
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
