'use client';

import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) return null;
  return r.json();
};

const COLORS = ['#f97316', '#7c3aed', '#10b981', '#3b82f6', '#ef4444'];

interface PlatformStat {
  platform: string;
  count: number;
  percentage: number;
}

interface StatsData {
  totalProviders: number;
  totalBookings: number;
  totalIntegrations: number;
  platformStats: PlatformStat[];
}

export default function AdminOverviewPage() {
  const { data, isLoading } = useSWR<StatsData>('/api/admin/stats', fetcher);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  const stats = data || { totalProviders: 0, totalBookings: 0, totalIntegrations: 0, platformStats: [] };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Overview</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{stats.totalProviders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{stats.totalIntegrations}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings by Platform */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings by AI Platform</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.platformStats.length === 0 ? (
            <p className="text-sm text-gray-500">No booking data yet.</p>
          ) : (
            <div className="flex items-center gap-8">
              <div className="w-64 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.platformStats}
                      dataKey="count"
                      nameKey="platform"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }: any) => `${name} ${Math.round((percent || 0) * 100)}%`}
                    >
                      {stats.platformStats.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {stats.platformStats.map((s, i) => (
                  <div key={s.platform} className="flex items-center gap-2 text-sm">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-gray-700 font-medium">{s.platform}</span>
                    <span className="text-gray-400">({s.count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
