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
  if (!r.ok) return { bookings: [], total: 0, page: 1, totalPages: 1 };
  return r.json();
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    held: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    no_show: 'bg-gray-100 text-gray-600',
    completed: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: string | null }) {
  if (!platform) return <span className="text-gray-300 text-xs">—</span>;
  const colors: Record<string, string> = {
    openai: 'bg-green-50 text-green-700',
    claude: 'bg-orange-50 text-orange-700',
    gemini: 'bg-blue-50 text-blue-700',
    mcp: 'bg-purple-50 text-purple-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${colors[platform] || 'bg-gray-100 text-gray-600'}`}>
      {platform}
    </span>
  );
}

interface BookingRow {
  id: number;
  date: string;
  time: string;
  partySize: number;
  status: string;
  aiPlatform: string | null;
  providerName: string | null;
  customerName: string;
  customerEmail: string | null;
  bookingType: string | null;
  createdAt: string;
  specialRequests: string | null;
}

export default function AdminBookingsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  if (statusFilter) params.set('status', statusFilter);
  if (platformFilter) params.set('platform', platformFilter);
  params.set('page', String(page));

  const { data, isLoading } = useSWR(`/api/admin/bookings?${params}`, fetcher);
  const bookings: BookingRow[] = data?.bookings || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Bookings</h2>
        <p className="text-sm text-gray-500 mt-1">All reservations across all providers</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white h-9"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="held">Held</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
          <option value="no_show">No Show</option>
        </select>
        <select
          value={platformFilter}
          onChange={(e) => { setPlatformFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white h-9"
        >
          <option value="">All Platforms</option>
          <option value="openai">OpenAI</option>
          <option value="claude">Claude</option>
          <option value="gemini">Gemini</option>
        </select>
        {(statusFilter || platformFilter) && (
          <Button variant="ghost" size="sm" className="h-9 text-xs text-gray-500" onClick={() => { setStatusFilter(''); setPlatformFilter(''); setPage(1); }}>
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
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
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Date / Time</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Customer</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide hidden sm:table-cell">Provider</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide hidden md:table-cell">Type</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide text-center">Guests</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Status</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide hidden sm:table-cell">Platform</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-400 py-12 text-sm">No bookings found</TableCell>
                    </TableRow>
                  ) : (
                    bookings.map((b) => (
                      <TableRow key={b.id} className="hover:bg-gray-50/50">
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{new Date(b.date).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-500">{b.time}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{b.customerName}</p>
                            {b.customerEmail && <p className="text-xs text-gray-500 truncate">{b.customerEmail}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-gray-600">{b.providerName || '—'}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-gray-600">{b.bookingType || '—'}</TableCell>
                        <TableCell className="text-center text-sm font-medium text-gray-900">{b.partySize}</TableCell>
                        <TableCell><StatusBadge status={b.status} /></TableCell>
                        <TableCell className="hidden sm:table-cell"><PlatformBadge platform={b.aiPlatform} /></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500">Page {page} of {totalPages} &middot; {data?.total || 0} bookings</p>
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
