"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Reservation {
  id: number;
  date: string;
  time: string;
  partySize: number;
  status: "confirmed" | "pending" | "cancelled";
  aiPlatform: "openai" | "claude" | "gemini";
  specialRequests: string | null;
  externalBookingId: string | null;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  bookingTypeName: string | null;
  createdAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) return [];
  const data = await r.json();
  return Array.isArray(data) ? data : [];
};

const ALL = "__all__";

const platformLabel: Record<string, string> = {
  openai: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
};

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusBadgeClass(status: Reservation["status"]): string {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-800 border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ReservationsPage() {
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [platformFilter, setPlatformFilter] = useState(ALL);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Reservation | null>(null);

  // Build query string
  const params = new URLSearchParams();
  if (statusFilter !== ALL) params.set("status", statusFilter);
  if (platformFilter !== ALL) params.set("platform", platformFilter);
  if (dateFilter) {
    params.set("dateFrom", dateFilter);
    params.set("dateTo", dateFilter);
  }
  const qs = params.toString();
  const url = `/api/providers/me/reservations${qs ? `?${qs}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<Reservation[]>(url, fetcher, {
    keepPreviousData: true,
  });

  const reservations = data ?? [];

  /* ---- Confirm / Cancel action ---- */
  const handleAction = useCallback(
    async (bookingId: number, action: "confirm" | "cancel") => {
      setActionLoading(bookingId);
      try {
        const res = await fetch("/api/providers/me/reservations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId, action }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "Action failed");
        }
        await mutate();
        toast.success(action === "confirm" ? "Booking confirmed" : "Booking cancelled");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed");
      } finally {
        setActionLoading(null);
      }
    },
    [mutate],
  );

  /* ---- Clear filters ---- */
  const hasFilters = dateFilter || statusFilter !== ALL || platformFilter !== ALL;

  const clearFilters = () => {
    setDateFilter("");
    setStatusFilter(ALL);
    setPlatformFilter(ALL);
  };

  /* ---- Render ---- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
        <p className="text-gray-500 mt-1">
          Manage your restaurant reservations
        </p>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Date</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full sm:w-44"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Platform */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                AI Platform
              </label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All</SelectItem>
                  <SelectItem value="openai">ChatGPT</SelectItem>
                  <SelectItem value="claude">Claude</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear */}
            {hasFilters && (
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            All Reservations
            {!isLoading && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({reservations.length} result
                {reservations.length !== 1 ? "s" : ""})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-center text-red-500 py-8">
              Failed to load reservations. Please try again.
            </p>
          ) : isLoading && reservations.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Platform</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-gray-500 py-8"
                    >
                      No reservations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  reservations.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatDate(r.date)}
                      </TableCell>
                      <TableCell>{r.time}</TableCell>
                      <TableCell>
                        {r.customerFirstName} {r.customerLastName}
                      </TableCell>
                      <TableCell>{r.partySize}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-gray-700">
                          {r.bookingTypeName ?? "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass(r.status)}>
                          {capitalize(r.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-gray-700">
                          {platformLabel[r.aiPlatform] ?? r.aiPlatform}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedBooking(r)}
                          >
                            View
                          </Button>
                          {r.status === "pending" && (
                            <Button
                              size="sm"
                              className="bg-orange-500 hover:bg-orange-600 text-white"
                              disabled={actionLoading === r.id}
                              onClick={() => handleAction(r.id, "confirm")}
                            >
                              {actionLoading === r.id ? "..." : "Confirm"}
                            </Button>
                          )}
                          {r.status !== "cancelled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={actionLoading === r.id}
                              onClick={() => handleAction(r.id, "cancel")}
                            >
                              {actionLoading === r.id ? "..." : "Cancel"}
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

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Booking Details
              </h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Customer Name</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedBooking.customerFirstName} {selectedBooking.customerLastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <Badge className={statusBadgeClass(selectedBooking.status)}>
                    {capitalize(selectedBooking.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">
                    {selectedBooking.customerEmail || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">
                    {selectedBooking.customerPhone || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm text-gray-900">
                    {formatDate(selectedBooking.date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="text-sm text-gray-900">{selectedBooking.time}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Party Size</p>
                  <p className="text-sm text-gray-900">{selectedBooking.partySize}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Booking Type</p>
                  <p className="text-sm text-gray-900">
                    {selectedBooking.bookingTypeName || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">AI Platform</p>
                  <p className="text-sm text-gray-900">
                    {platformLabel[selectedBooking.aiPlatform] ?? selectedBooking.aiPlatform}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">External Booking ID</p>
                  <p className="text-sm text-gray-900">
                    {selectedBooking.externalBookingId || "-"}
                  </p>
                </div>
              </div>
              {selectedBooking.specialRequests && (
                <div>
                  <p className="text-xs text-gray-500">Special Requests</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedBooking.specialRequests}
                  </p>
                </div>
              )}
              <div className="border-t pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm text-gray-900">
                    {selectedBooking.createdAt
                      ? new Date(selectedBooking.createdAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Confirmed</p>
                  <p className="text-sm text-gray-900">
                    {selectedBooking.confirmedAt
                      ? new Date(selectedBooking.confirmedAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Cancelled</p>
                  <p className="text-sm text-gray-900">
                    {selectedBooking.cancelledAt
                      ? new Date(selectedBooking.cancelledAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
