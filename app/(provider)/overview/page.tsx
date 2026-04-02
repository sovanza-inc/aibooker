"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) return null;
  return r.json();
};

const PLATFORM_COLORS = ["#f97316", "#7c3aed", "#10b981", "#3b82f6", "#ef4444"];

interface TodayBooking {
  id: number;
  time: string | null;
  partySize: number | null;
  status: string | null;
  aiPlatform: string | null;
  customerFirstName: string | null;
  customerLastName: string | null;
}

interface PlatformStat {
  platform: string;
  count: number;
  percentage: number;
}

interface WeeklyBooking {
  date: string;
  count: number;
}

interface StatsData {
  todayCount: number;
  upcomingCount: number;
  totalBookings: number;
  todayHours: string;
  platformStats: PlatformStat[];
  weeklyBookings: WeeklyBooking[];
  todayBookings: TodayBooking[];
}

interface ProviderData {
  name: string;
  [key: string]: unknown;
}

function formatWeekday(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  } catch {
    return dateStr;
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-64 bg-gray-200 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-gray-200 rounded-lg" />
        <div className="space-y-6">
          <div className="h-64 bg-gray-200 rounded-lg" />
          <div className="h-56 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const { data: provider } = useSWR<ProviderData>("/api/providers/me", fetcher);
  const { data: stats, isLoading } = useSWR<StatsData>(
    "/api/providers/me/stats",
    fetcher
  );

  if (isLoading || !stats || !stats.weeklyBookings) {
    return <LoadingSkeleton />;
  }

  const weeklyTotal = (stats.weeklyBookings || []).reduce(
    (sum, w) => sum + w.count,
    0
  );

  const weeklyChartData = (stats.weeklyBookings || []).map((w) => ({
    day: formatWeekday(w.date),
    reservations: w.count,
  }));

  const pieData = (stats.platformStats || []).map((p) => ({
    name: p.platform,
    value: p.percentage,
  }));

  const statCards = [
    {
      title: "Today",
      value: String(stats.todayCount),
      label: "Reservations",
    },
    {
      title: "Upcoming days",
      value: String(stats.upcomingCount),
      label: "Reservations",
    },
    {
      title: "Today opening hours",
      value: stats.todayHours,
      label: "",
    },
    {
      title: "Fill rate",
      value: stats.totalBookings > 0 ? "Active" : "No data",
      label: stats.totalBookings > 0 ? `${stats.totalBookings} total` : "",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {provider?.name || "there"}!
        </h1>
        <p className="text-gray-500 mt-1">
          Here is an overview of your restaurant
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className="bg-white border border-gray-200 shadow-sm"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              {stat.label && (
                <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Today's AI reservations table */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              AI reservations of today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(stats.todayBookings || []).length === 0 ? (
              <p className="text-gray-500 text-sm py-6 text-center">
                No reservations for today yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(stats.todayBookings || []).map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        {b.time || "-"}
                      </TableCell>
                      <TableCell>
                        {[b.customerFirstName, b.customerLastName]
                          .filter(Boolean)
                          .join(" ") || "-"}
                      </TableCell>
                      <TableCell>{b.partySize ?? "-"}</TableCell>
                      <TableCell>{b.aiPlatform || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            b.status === "confirmed"
                              ? "bg-green-100 text-green-700"
                              : b.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {b.status || "pending"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* Bar chart: AI reservations this week */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <div className="flex items-baseline justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  AI reservations this week
                </CardTitle>
                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-900">
                    {weeklyTotal}
                  </span>
                  <span className="text-sm text-gray-500 ml-1.5">
                    Reservations
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {weeklyChartData.length === 0 ? (
                <p className="text-gray-500 text-sm py-12 text-center">
                  No booking data for this week yet.
                </p>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="reservations"
                        fill="#f97316"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Donut chart: Reservations per AI platform */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Reservations per AI platform
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <p className="text-gray-500 text-sm py-6 text-center">
                  No platform data available yet.
                </p>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="h-44 w-44 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={
                                PLATFORM_COLORS[
                                  index % PLATFORM_COLORS.length
                                ]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {stats.platformStats.map((entry, index) => (
                      <div
                        key={entry.platform}
                        className="flex items-center gap-2"
                      >
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              PLATFORM_COLORS[
                                index % PLATFORM_COLORS.length
                              ],
                          }}
                        />
                        <span className="text-sm text-gray-700">
                          {entry.platform}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 ml-auto">
                          {entry.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
