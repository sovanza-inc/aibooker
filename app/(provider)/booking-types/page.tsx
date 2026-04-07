'use client';

import Link from 'next/link';
import useSWR from 'swr';
import {
  UtensilsCrossed,
  Pencil,
  Loader2,
  AlertTriangle,
  XCircle,
  Coffee,
  Soup,
  Wine,
  Salad,
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface BookingType {
  id: number;
  providerId: number;
  externalId: string;
  name: string;
  description: string | null;
  category: string;
  minPartySize: number;
  maxPartySize: number;
  duration: number;
  averagePricePerPerson: string | null;
  isActive: boolean;
  settings: unknown;
  todayAvailability: string | null;
  createdAt: string;
  updatedAt: string;
}

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) return [];
  const data = await r.json();
  return Array.isArray(data) ? data : [];
};

/** Pick an icon based on booking type name */
function getBookingIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('lunch')) return Soup;
  if (lower.includes('dinner')) return UtensilsCrossed;
  if (lower.includes('tea')) return Coffee;
  if (lower.includes('drink') || lower.includes('wine') || lower.includes('bar'))
    return Wine;
  if (lower.includes('brunch') || lower.includes('salad')) return Salad;
  return UtensilsCrossed;
}

/** Determine card state: active, warning (inactive but has availability), or error (inactive, no availability) */
function getCardState(bt: BookingType): 'active' | 'warning' | 'error' {
  if (bt.isActive) return 'active';
  if (bt.todayAvailability) return 'warning';
  return 'error';
}

export default function BookingTypesPage() {
  const { data, error, isLoading, mutate } = useSWR<BookingType[]>(
    '/api/providers/me/booking-types',
    fetcher
  );

  async function handleToggle(bt: BookingType) {
    const newActive = !bt.isActive;
    const updated = data?.map((item) =>
      item.id === bt.id ? { ...item, isActive: newActive } : item
    );
    mutate(updated, false);

    try {
      const res = await fetch(`/api/providers/me/booking-types/${bt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newActive }),
      });
      if (!res.ok) throw new Error('Failed to update');
      mutate();
      toast.success(`${bt.name} ${newActive ? 'activated' : 'deactivated'}`);
    } catch {
      mutate();
      toast.error('Failed to update booking type');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
        Failed to load booking types. Please try again later.
      </div>
    );
  }

  const bookingTypes = data ?? [];
  const needsAttentionCount = bookingTypes.filter((bt) => !bt.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Types</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the different types of bookings your business offers.
          </p>
        </div>
        {needsAttentionCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-2.5">
            <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-gray-700">
              {needsAttentionCount} or more booking type{needsAttentionCount > 1 ? 's' : ''}{' '}
              <br className="hidden sm:block" />
              need{needsAttentionCount === 1 ? 's' : ''} your attention
            </p>
          </div>
        )}
      </div>

      {/* Empty state */}
      {bookingTypes.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-12 text-center">
          <UtensilsCrossed className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">
            No booking types found. Booking types are synced from your external system.
          </p>
        </div>
      )}

      {/* Booking type cards — stacked list */}
      <div className="space-y-4">
        {bookingTypes.map((bt) => {
          const state = getCardState(bt);
          const Icon = getBookingIcon(bt.name);

          const borderColor =
            state === 'active'
              ? 'border-blue-300'
              : state === 'warning'
              ? 'border-yellow-400'
              : 'border-red-400';

          return (
            <div
              key={bt.id}
              className={`rounded-xl border-2 ${borderColor} bg-white px-5 py-4 shadow-sm`}
            >
              {/* Top row */}
              <div className="flex items-center justify-between">
                {/* Left: icon + name + description */}
                <div className="flex items-center gap-3">
                  {state === 'active' ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                  ) : state === 'warning' ? (
                    <AlertTriangle className="h-8 w-8 text-yellow-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {bt.name}
                    </h3>
                    {bt.description && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                        {bt.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: toggle + category badge */}
                <div className="flex items-center gap-3">
                  <Switch
                    checked={bt.isActive}
                    onCheckedChange={() => handleToggle(bt)}
                  />
                  <Badge
                    variant="outline"
                    className="capitalize text-blue-600 border-blue-300 bg-blue-50 font-normal"
                  >
                    {bt.category}
                  </Badge>
                </div>
              </div>

              {/* Bottom row */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Availability today:{' '}
                  <span className="font-medium text-gray-700">
                    {bt.todayAvailability || 'Not set'}
                  </span>
                </p>
                <Link
                  href={`/booking-types/${bt.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
