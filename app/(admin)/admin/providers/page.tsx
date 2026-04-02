'use client';

import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

export default function AdminProvidersPage() {
  const { data, isLoading } = useSWR<ProviderRow[]>('/api/admin/providers', fetcher);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  const providers = data || [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">All Providers</h2>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Partner</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Rating</TableHead>
                <TableHead className="text-right">Bookings</TableHead>
                <TableHead className="hidden sm:table-cell">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No providers found.
                  </TableCell>
                </TableRow>
              ) : (
                providers.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.city}</TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{p.partner}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {p.rating != null ? p.rating.toFixed(1) : '-'}
                    </TableCell>
                    <TableCell className="text-right">{p.bookingsCount}</TableCell>
                    <TableCell className="text-gray-500 text-sm hidden sm:table-cell">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
