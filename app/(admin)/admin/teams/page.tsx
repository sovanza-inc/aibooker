'use client';

import useSWR from 'swr';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) return [];
  return r.json();
};

function SubBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-gray-300 text-xs">—</span>;
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    trialing: 'bg-blue-100 text-blue-700',
    past_due: 'bg-red-100 text-red-700',
    canceled: 'bg-gray-100 text-gray-600',
    incomplete: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

interface TeamRow {
  id: number;
  name: string;
  planName: string | null;
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
  memberCount: number;
  integrationCount: number;
  createdAt: string;
}

export default function AdminTeamsPage() {
  const { data, isLoading } = useSWR<TeamRow[]>('/api/admin/teams', fetcher);
  const teams = data || [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Teams</h2>
        <p className="text-sm text-gray-500 mt-1">Team accounts and subscription status</p>
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
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Team Name</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide hidden sm:table-cell">Plan</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Subscription</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide text-center">Members</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide text-center hidden sm:table-cell">Integrations</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide hidden md:table-cell">Stripe ID</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide hidden sm:table-cell">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-400 py-12 text-sm">No teams found</TableCell>
                    </TableRow>
                  ) : (
                    teams.map((t) => (
                      <TableRow key={t.id} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium text-sm text-gray-900">{t.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-gray-600">{t.planName || '—'}</TableCell>
                        <TableCell><SubBadge status={t.subscriptionStatus} /></TableCell>
                        <TableCell className="text-center text-sm font-medium text-gray-900">{t.memberCount}</TableCell>
                        <TableCell className="text-center text-sm font-medium text-gray-900 hidden sm:table-cell">{t.integrationCount}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {t.stripeCustomerId ? (
                            <span className="font-mono text-xs text-gray-500">{t.stripeCustomerId.slice(0, 18)}...</span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
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
