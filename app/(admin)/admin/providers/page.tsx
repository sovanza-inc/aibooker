'use client';

import useSWR from 'swr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) return [];
  return r.json();
};

interface ProviderRow {
  id: number;
  name: string;
  city: string;
  status: string;
  partner: string;
  rating: number | null;
  bookingsCount: number;
  createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    onboarding: 'bg-yellow-100 text-yellow-700',
    paused: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

export default function AdminProvidersPage() {
  const { data, isLoading, mutate } = useSWR<ProviderRow[]>('/api/admin/providers', fetcher);
  const providers = data || [];

  async function handleStatusChange(id: number, newStatus: string) {
    try {
      const res = await fetch(`/api/admin/providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) mutate();
    } catch {}
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Providers</h2>
        <p className="text-sm text-gray-500 mt-1">All registered providers and their status</p>
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
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Name</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide">City</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Status</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide hidden sm:table-cell">Partner</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide text-right hidden sm:table-cell">Rating</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide text-right">Bookings</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide hidden md:table-cell">Created</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-400 py-12 text-sm">No providers found</TableCell>
                    </TableRow>
                  ) : (
                    providers.map((p) => (
                      <TableRow key={p.id} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium text-sm text-gray-900">{p.name}</TableCell>
                        <TableCell className="text-sm text-gray-600">{p.city}</TableCell>
                        <TableCell><StatusBadge status={p.status} /></TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-gray-600">{p.partner}</TableCell>
                        <TableCell className="text-right hidden sm:table-cell text-sm text-gray-600">
                          {p.rating != null ? p.rating.toFixed(1) : '—'}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-gray-900">{p.bookingsCount}</TableCell>
                        <TableCell className="text-sm text-gray-500 hidden md:table-cell">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {p.status !== 'active' && (
                              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50 text-xs h-7 px-2" onClick={() => handleStatusChange(p.id, 'active')}>
                                Activate
                              </Button>
                            )}
                            {p.status === 'active' && (
                              <Button variant="ghost" size="sm" className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 text-xs h-7 px-2" onClick={() => handleStatusChange(p.id, 'paused')}>
                                Pause
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
