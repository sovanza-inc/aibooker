'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { ArrowLeft, Loader2, Save, CheckCircle2, XCircle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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

interface FormState {
  name: string;
  externalId: string;
  category: string;
  minPartySize: number;
  maxPartySize: number;
  duration: number;
  averagePricePerPerson: string;
  description: string;
  isActive: boolean;
}

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) return [];
  const data = await r.json();
  return Array.isArray(data) ? data : [];
};

export default function BookingTypeEditPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, error } = useSWR<BookingType[]>(
    '/api/providers/me/booking-types',
    fetcher
  );

  const bookingType = Array.isArray(data) ? data.find((bt) => bt.id === parseInt(params.id)) : undefined;

  const [form, setForm] = useState<FormState>({
    name: '',
    externalId: '',
    category: '',
    minPartySize: 1,
    maxPartySize: 1,
    duration: 0,
    averagePricePerPerson: '',
    description: '',
    isActive: true,
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Populate form when data loads
  useEffect(() => {
    if (bookingType) {
      setForm({
        name: bookingType.name,
        externalId: bookingType.externalId,
        category: bookingType.category,
        minPartySize: bookingType.minPartySize,
        maxPartySize: bookingType.maxPartySize,
        duration: bookingType.duration,
        averagePricePerPerson: bookingType.averagePricePerPerson ?? '',
        description: bookingType.description ?? '',
        isActive: bookingType.isActive,
      });
    }
  }, [bookingType]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear feedback when user edits
    if (feedback) setFeedback(null);
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/providers/me/booking-types/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          minPartySize: form.minPartySize,
          maxPartySize: form.maxPartySize,
          duration: form.duration,
          averagePricePerPerson: form.averagePricePerPerson || null,
          description: form.description || null,
          isActive: form.isActive,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save');
      }

      setFeedback({ type: 'success', message: 'Changes saved successfully.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong.',
      });
    } finally {
      setSaving(false);
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
      <div className="space-y-4">
        <Link
          href="/booking-types"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Booking Types
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
          Failed to load booking types. Please try again later.
        </div>
      </div>
    );
  }

  // Not found state
  if (!bookingType) {
    return (
      <div className="space-y-4">
        <Link
          href="/booking-types"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Booking Types
        </Link>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          Booking type not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/booking-types"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Booking Types
      </Link>

      <Tabs defaultValue="reservation" className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="w-max sm:w-auto">
            <TabsTrigger value="reservation">Reservation type</TabsTrigger>
            <TabsTrigger value="hours">Opening hours</TabsTrigger>
          </TabsList>
        </div>

        {/* Reservation type tab */}
        <TabsContent value="reservation">
          <Card>
            <CardContent className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Reservation type: {form.name}
              </h2>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name">Reservation type name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                  />
                </div>

                {/* External ID (read-only) */}
                <div className="space-y-1.5">
                  <Label htmlFor="externalId">External ID</Label>
                  <Input
                    id="externalId"
                    value={form.externalId}
                    readOnly
                    className="bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => update('category', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="salon">Salon</SelectItem>
                      <SelectItem value="activity">Activity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Guest quantity From */}
                <div className="space-y-1.5">
                  <Label>Guest quantity From</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.minPartySize}
                    onChange={(e) =>
                      update('minPartySize', Number(e.target.value))
                    }
                  />
                </div>

                {/* Guest quantity To */}
                <div className="space-y-1.5">
                  <Label>Guest quantity To</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.maxPartySize}
                    onChange={(e) =>
                      update('maxPartySize', Number(e.target.value))
                    }
                  />
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <Label htmlFor="duration">Average duration</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="duration"
                      type="number"
                      min={1}
                      value={form.duration}
                      onChange={(e) =>
                        update('duration', Number(e.target.value))
                      }
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      minutes
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="space-y-1.5">
                  <Label htmlFor="price">Average price per person</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">EUR</span>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min={0}
                      value={form.averagePricePerPerson}
                      onChange={(e) =>
                        update('averagePricePerPerson', e.target.value)
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Active toggle */}
                <div className="space-y-1.5">
                  <Label>Active</Label>
                  <div className="flex items-center gap-2 pt-1">
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(v) => update('isActive', v)}
                    />
                    <span className="text-sm text-gray-500">
                      {form.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                />
              </div>

              {/* Feedback message */}
              {feedback && (
                <div
                  className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
                    feedback.type === 'success'
                      ? 'border border-green-200 bg-green-50 text-green-700'
                      : 'border border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0" />
                  )}
                  {feedback.message}
                </div>
              )}

              {/* Save */}
              <div className="flex justify-end gap-3 pt-2">
                <Link href="/booking-types">
                  <Button variant="outline">Cancel</Button>
                </Link>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1.5" />
                  )}
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Opening hours tab (placeholder) */}
        <TabsContent value="hours">
          <Card>
            <CardContent className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Reservation type: {form.name} &mdash; Opening hours
              </h2>

              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-12 text-center">
                <p className="text-sm text-gray-500">
                  Opening hours configuration coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
