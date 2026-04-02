'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { UtensilsCrossed, Pencil, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  createdAt: string;
  updatedAt: string;
}

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) return [];
  const data = await r.json();
  return Array.isArray(data) ? data : [];
};

export default function BookingTypesPage() {
  const { data, error, isLoading, mutate } = useSWR<BookingType[]>(
    '/api/providers/me/booking-types',
    fetcher
  );

  async function handleToggle(bt: BookingType) {
    // Optimistic update
    const updated = data?.map((item) =>
      item.id === bt.id ? { ...item, isActive: !item.isActive } : item
    );
    mutate(updated, false);

    try {
      const res = await fetch(`/api/providers/me/booking-types/${bt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !bt.isActive }),
      });
      if (!res.ok) throw new Error('Failed to update');
      mutate();
    } catch {
      // Revert on error
      mutate();
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
        Failed to load booking types. Please try again later.
      </div>
    );
  }

  const bookingTypes = data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Booking Types</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage the different types of bookings your business offers.
        </p>
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

      {/* Booking type cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bookingTypes.map((bt) => (
          <Card
            key={bt.id}
            className={`border-l-4 ${
              bt.isActive ? 'border-l-green-500' : 'border-l-red-500'
            } overflow-hidden`}
          >
            <CardContent className="p-5 space-y-4">
              {/* Top row: icon + name + toggle */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                    <UtensilsCrossed className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {bt.name}
                      </h3>
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          bt.isActive ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                    </div>
                    {bt.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {bt.description}
                      </p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={bt.isActive}
                  onCheckedChange={() => handleToggle(bt)}
                />
              </div>

              {/* Category badge */}
              <div>
                <Badge variant="secondary" className="text-xs capitalize">
                  {bt.category}
                </Badge>
              </div>

              {/* Edit button */}
              <Link href={`/booking-types/${bt.id}`}>
                <Button variant="outline" size="sm" className="w-full mt-1">
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
