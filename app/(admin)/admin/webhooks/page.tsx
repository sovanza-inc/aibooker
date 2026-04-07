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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    received: 'bg-blue-100 text-blue-700',
    processing: 'bg-yellow-100 text-yellow-700',
    processed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

interface WebhookRow {
  id: number;
  source: string;
  eventType: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  processedAt: string | null;
}

export default function AdminWebhooksPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  if (statusFilter) params.set('status', statusFilter);
  params.set('page', String(page));

  const { data, isLoading } = useSWR(`/api/admin/webhooks?${params}`, fetcher);
  const logs: WebhookRow[] = data?.logs || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Webhook Logs</h2>
        <p className="text-sm text-gray-500 mt-1">Track incoming webhook events from partners</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white h-9"
        >
          <option value="">All Statuses</option>
          <option value="received">Received</option>
          <option value="processing">Processing</option>
          <option value="processed">Processed</option>
          <option value="failed">Failed</option>
        </select>
        {statusFilter && (
          <Button variant="ghost" size="sm" className="h-9 text-xs text-gray-500" onClick={() => { setStatusFilter(''); setPage(1); }}>
            Clear
          </Button>
        )}
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
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Source</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Event Type</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Status</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide hidden sm:table-cell">Error</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Received</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide hidden sm:table-cell">Processed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-400 py-12 text-sm">No webhook logs found</TableCell>
                    </TableRow>
                  ) : (
                    logs.map((l) => (
                      <TableRow key={l.id} className="hover:bg-gray-50/50">
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded bg-orange-100 text-orange-700">
                            {l.source}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-gray-900">{l.eventType}</TableCell>
                        <TableCell><StatusBadge status={l.status} /></TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-red-500 max-w-[200px] truncate">{l.errorMessage || '—'}</TableCell>
                        <TableCell className="text-sm text-gray-500">{new Date(l.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-gray-500">{l.processedAt ? new Date(l.processedAt).toLocaleString() : '—'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500">Page {page} of {totalPages} &middot; {data?.total || 0} logs</p>
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
