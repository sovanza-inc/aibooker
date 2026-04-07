'use client';

import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import {
  Users, Building2, CalendarCheck, Key, UsersRound, UserCheck,
  TrendingUp, AlertTriangle, Clock, Webhook,
} from 'lucide-react';

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) return null;
  return r.json();
};

const PLATFORM_COLORS: Record<string, string> = {
  openai: '#10b981',
  claude: '#ef4444',
  gemini: '#3b82f6',
  mcp: '#f97316',
  unknown: '#a855f7',
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#10b981',
  pending: '#eab308',
  held: '#3b82f6',
  cancelled: '#ef4444',
  completed: '#059669',
  no_show: '#6b7280',
};

const ROLE_COLORS: Record<string, string> = {
  admin: '#ef4444',
  partner: '#a855f7',
  provider: '#3b82f6',
};

interface StatsData {
  totalProviders: number;
  totalBookings: number;
  totalIntegrations: number;
  totalUsers: number;
  totalTeams: number;
  totalCustomers: number;
  recentBookings7d: number;
  recentUsers30d: number;
  failedWebhooks: number;
  pendingIntegrations: number;
  platformStats: { platform: string; count: number; percentage: number }[];
  bookingStatusStats: { status: string; count: number }[];
  providerStatusStats: { status: string; count: number }[];
  userRoleStats: { role: string; count: number }[];
  topProviders: { name: string; city: string | null; status: string; bookingsCount: number }[];
  recentBookingsList: {
    id: number; date: string; time: string; partySize: number;
    status: string; aiPlatform: string | null; providerName: string | null;
    customerName: string; createdAt: string;
  }[];
  recentSignups: {
    id: number; name: string | null; email: string; role: string;
    authProvider: string | null; createdAt: string;
  }[];
  integrationSources: { source: string; count: number }[];
}

function StatCard({ title, value, icon: Icon, subtitle, accent }: {
  title: string; value: number; icon: React.ElementType;
  subtitle?: string; accent?: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${accent || 'bg-orange-50'}`}>
            <Icon className={`h-5 w-5 ${accent ? 'text-white' : 'text-orange-600'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status, type }: { status: string; type: 'booking' | 'provider' | 'role' }) {
  const colorMap: Record<string, Record<string, string>> = {
    booking: {
      confirmed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      held: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700',
      completed: 'bg-emerald-100 text-emerald-700',
      no_show: 'bg-gray-100 text-gray-600',
    },
    provider: {
      active: 'bg-green-100 text-green-700',
      onboarding: 'bg-yellow-100 text-yellow-700',
      paused: 'bg-gray-100 text-gray-600',
    },
    role: {
      admin: 'bg-red-100 text-red-700',
      partner: 'bg-purple-100 text-purple-700',
      provider: 'bg-blue-100 text-blue-700',
    },
  };
  const colors = colorMap[type]?.[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full ${colors}`}>
      {status}
    </span>
  );
}

function PlatformDot({ platform }: { platform: string | null }) {
  const color = PLATFORM_COLORS[platform || 'unknown'] || '#6b7280';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
      <span className="text-gray-600">{platform || 'unknown'}</span>
    </span>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-gray-900">{payload[0].name}</p>
      <p className="text-gray-500">{payload[0].value} bookings</p>
    </div>
  );
};

export default function AdminDashboardPage() {
  const { data, isLoading } = useSWR<StatsData>('/api/admin/stats', fetcher);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  const s = data || {
    totalProviders: 0, totalBookings: 0, totalIntegrations: 0,
    totalUsers: 0, totalTeams: 0, totalCustomers: 0,
    recentBookings7d: 0, recentUsers30d: 0, failedWebhooks: 0, pendingIntegrations: 0,
    platformStats: [], bookingStatusStats: [], providerStatusStats: [],
    userRoleStats: [], topProviders: [], recentBookingsList: [],
    recentSignups: [], integrationSources: [],
  };

  const platformChartData = s.platformStats.map((p) => ({
    ...p,
    fill: PLATFORM_COLORS[p.platform] || '#6b7280',
  }));

  const statusChartData = s.bookingStatusStats.map((b) => ({
    ...b,
    fill: STATUS_COLORS[b.status] || '#6b7280',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Platform overview and key metrics</p>
      </div>

      {/* Row 1: Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={s.totalUsers} icon={Users} subtitle={`+${s.recentUsers30d} last 30 days`} />
        <StatCard title="Providers" value={s.totalProviders} icon={Building2} />
        <StatCard title="Total Bookings" value={s.totalBookings} icon={CalendarCheck} subtitle={`+${s.recentBookings7d} last 7 days`} />
        <StatCard title="Customer Leads" value={s.totalCustomers} icon={UserCheck} />
      </div>

      {/* Row 2: Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Teams" value={s.totalTeams} icon={UsersRound} />
        <StatCard title="Active Integrations" value={s.totalIntegrations} icon={Key} subtitle={`${s.pendingIntegrations} pending`} />
        <StatCard title="Bookings (7 days)" value={s.recentBookings7d} icon={TrendingUp} />
        <StatCard
          title="Failed Webhooks"
          value={s.failedWebhooks}
          icon={AlertTriangle}
          accent={s.failedWebhooks > 0 ? 'bg-red-500' : 'bg-green-50'}
        />
      </div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings by AI Platform - Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Bookings by AI Platform</CardTitle>
          </CardHeader>
          <CardContent>
            {platformChartData.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No booking data yet</p>
            ) : (
              <div className="flex items-center gap-6">
                <div className="w-[180px] h-[180px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={platformChartData}
                        dataKey="count"
                        nameKey="platform"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={80}
                        paddingAngle={2}
                        label={false}
                      >
                        {platformChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2.5 flex-1">
                  {platformChartData.map((p) => (
                    <div key={p.platform} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.fill }} />
                        <span className="text-sm text-gray-700 capitalize">{p.platform}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{p.count}</span>
                        <span className="text-xs text-gray-400">({p.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Booking Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {statusChartData.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No booking data yet</p>
            ) : (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="status" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {statusChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Provider Status + User Roles + Integration Sources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Provider Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Provider Status</CardTitle>
          </CardHeader>
          <CardContent>
            {s.providerStatusStats.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No providers yet</p>
            ) : (
              <div className="space-y-3">
                {s.providerStatusStats.map((p) => {
                  const total = s.totalProviders || 1;
                  const pct = Math.round((p.count / total) * 100);
                  const colors: Record<string, string> = { active: '#10b981', onboarding: '#eab308', paused: '#9ca3af' };
                  return (
                    <div key={p.status}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="capitalize text-gray-700 font-medium">{p.status}</span>
                        <span className="text-gray-900 font-semibold">{p.count} <span className="text-gray-400 font-normal text-xs">({pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: colors[p.status] || '#f97316' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Role Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">User Roles</CardTitle>
          </CardHeader>
          <CardContent>
            {s.userRoleStats.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No users yet</p>
            ) : (
              <div className="space-y-3">
                {s.userRoleStats.map((r) => {
                  const total = s.totalUsers || 1;
                  const pct = Math.round((r.count / total) * 100);
                  return (
                    <div key={r.role}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="capitalize text-gray-700 font-medium">{r.role}</span>
                        <span className="text-gray-900 font-semibold">{r.count} <span className="text-gray-400 font-normal text-xs">({pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: ROLE_COLORS[r.role] || '#f97316' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Integration Sources */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Integration Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {s.integrationSources.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No integrations yet</p>
            ) : (
              <div className="space-y-3">
                {s.integrationSources.map((src) => (
                  <div key={src.source} className="flex items-center justify-between">
                    <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-700 capitalize">{src.source}</span>
                    <span className="text-sm font-semibold text-gray-900">{src.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Top Providers + Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Providers by Bookings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Top Providers by Bookings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {s.topProviders.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No providers yet</p>
              ) : (
                s.topProviders.map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-300 w-5">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.city || 'No location'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={p.status} type="provider" />
                      <span className="text-sm font-bold text-gray-900 min-w-[32px] text-right">{p.bookingsCount}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {s.recentBookingsList.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No bookings yet</p>
              ) : (
                s.recentBookingsList.map((b) => (
                  <div key={b.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{b.customerName}</p>
                        <StatusBadge status={b.status} type="booking" />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {b.providerName} &middot; {new Date(b.date).toLocaleDateString()} {b.time} &middot; {b.partySize} guests
                      </p>
                    </div>
                    <PlatformDot platform={b.aiPlatform} />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 6: Recent Signups */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Recent User Signups</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {s.recentSignups.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No users yet</p>
            ) : (
              s.recentSignups.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold flex-shrink-0">
                      {(u.name || u.email)[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.name || 'Unnamed'}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={u.role} type="role" />
                    {u.authProvider && (
                      <span className="text-[11px] text-gray-400 capitalize">{u.authProvider}</span>
                    )}
                    <span className="text-xs text-gray-400 hidden sm:block">{new Date(u.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
