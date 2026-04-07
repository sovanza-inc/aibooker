'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import {
  Loader2,
  Save,
  CheckCircle2,
  XCircle,
  Upload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface BookingType {
  id: string;
  providerId: string;
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
  sort: string;
  minPartySize: number;
  maxPartySize: number;
  duration: number;
  averagePricePerPerson: string;
  description: string;
}

interface AvailabilityData {
  availableFrom: string;
  availableTo: string;
  year: number;
  slots: { date: string; startTime: string; endTime: string }[];
}

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) return [];
  const data = await r.json();
  return Array.isArray(data) ? data : [];
};

const availabilityFetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) return null;
  return r.json();
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
];

const DAY_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function getMonthGrid(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1);
  // Monday = 0, Sunday = 6
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = new Array(startDay).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }
  return weeks;
}

function MiniMonth({
  year,
  month,
  availableDates,
}: {
  year: number;
  month: number;
  availableDates: Set<string>;
}) {
  const weeks = useMemo(() => getMonthGrid(year, month), [year, month]);

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-2 text-center">
        {MONTH_NAMES[month]}
      </h3>
      <table className="w-full text-center text-xs">
        <thead>
          <tr>
            {DAY_HEADERS.map((d) => (
              <th
                key={d}
                className="pb-1 font-medium text-gray-400 w-[14.28%]"
              >
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((day, di) => {
                if (day === null) {
                  return <td key={di} className="py-0.5" />;
                }
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isAvailable = availableDates.has(dateStr);

                return (
                  <td key={di} className="py-0.5">
                    <div
                      className={`mx-auto h-6 w-6 flex items-center justify-center rounded-sm text-xs ${
                        isAvailable
                          ? 'bg-orange-400 text-white'
                          : 'text-gray-400'
                      }`}
                      style={
                        isAvailable
                          ? {
                              backgroundImage:
                                'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                              backgroundSize: '4px 4px',
                            }
                          : undefined
                      }
                    >
                      {day}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SORT_OPTIONS = [
  'Lunch',
  'Dinner',
  'High Tea',
  'Brunch',
  'Drinks',
  'Other',
];

export default function BookingTypeEditPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, error } = useSWR<BookingType[]>(
    '/api/providers/me/booking-types',
    fetcher
  );
  const imageInputRef = useRef<HTMLInputElement>(null);
  const menuInputRef = useRef<HTMLInputElement>(null);

  const bookingType = Array.isArray(data)
    ? data.find((bt) => bt.id === params.id)
    : undefined;

  const [form, setForm] = useState<FormState>({
    name: '',
    externalId: '',
    category: '',
    sort: '',
    minPartySize: 1,
    maxPartySize: 1,
    duration: 0,
    averagePricePerPerson: '',
    description: '',
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'reservation' | 'hours'>(
    'reservation'
  );
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [menuFile, setMenuFile] = useState<File | null>(null);

  useEffect(() => {
    if (bookingType) {
      setForm({
        name: bookingType.name,
        externalId: bookingType.externalId,
        category: bookingType.category,
        sort: bookingType.name,
        minPartySize: bookingType.minPartySize,
        maxPartySize: bookingType.maxPartySize,
        duration: bookingType.duration,
        averagePricePerPerson: bookingType.averagePricePerPerson ?? '',
        description: bookingType.description ?? '',
      });
    }
  }, [bookingType]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save');
      }

      toast.success('Changes saved successfully');
      setFeedback({ type: 'success', message: 'Changes saved successfully.' });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Something went wrong.'
      );
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong.',
      });
    } finally {
      setSaving(false);
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
      <div className="space-y-4">
        <Link
          href="/booking-types"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to Booking Types
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
          Failed to load booking types.
        </div>
      </div>
    );
  }

  if (!bookingType) {
    return (
      <div className="space-y-4">
        <Link
          href="/booking-types"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to Booking Types
        </Link>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          Booking type not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Booking Types</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage the different types of bookings your business offers.
        </p>
      </div>

      {/* Tabs — underline style */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('reservation')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'reservation'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Reservation type
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'hours'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Opening hours
          </button>
        </nav>
      </div>

      {/* Reservation type tab */}
      {activeTab === 'reservation' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Reservation type: {form.name}
          </h2>

          {/* Form fields — table-style layout */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            {/* Reservation type name */}
            <div className="grid grid-cols-[200px_1fr] items-center border-b border-gray-100 px-5 py-3">
              <span className="text-sm text-gray-600">Reservation type name</span>
              <Input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="max-w-sm border-gray-200"
              />
            </div>

            {/* Reservation type ID (read-only) */}
            <div className="grid grid-cols-[200px_1fr] items-center border-b border-gray-100 px-5 py-3">
              <span className="text-sm text-gray-600">Reservation type ID</span>
              <Input
                value={form.externalId}
                readOnly
                className="max-w-sm bg-blue-50 text-gray-500 border-blue-200 cursor-not-allowed"
              />
            </div>

            {/* Category */}
            <div className="grid grid-cols-[200px_1fr] items-center border-b border-gray-100 px-5 py-3">
              <span className="text-sm text-gray-600">Category</span>
              <span className="text-sm font-medium text-gray-900 capitalize">
                {form.category}
              </span>
            </div>

            {/* Sort */}
            <div className="grid grid-cols-[200px_1fr] items-center border-b border-gray-100 px-5 py-3">
              <span className="text-sm text-gray-600">Sort</span>
              <Select
                value={form.sort}
                onValueChange={(v) => update('sort', v)}
              >
                <SelectTrigger className="max-w-md border-gray-200">
                  <SelectValue placeholder="Lunch, dinner, High tea etc. (add different and then add fill in box)" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Guest quantity */}
            <div className="grid grid-cols-[200px_1fr] items-center border-b border-gray-100 px-5 py-3">
              <span className="text-sm text-gray-600">Guest quantity</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">From</span>
                <Input
                  type="number"
                  min={1}
                  value={form.minPartySize}
                  onChange={(e) =>
                    update('minPartySize', Number(e.target.value))
                  }
                  className="w-20 border-gray-200"
                />
                <span className="text-sm text-gray-500">To</span>
                <Input
                  type="number"
                  min={1}
                  value={form.maxPartySize}
                  onChange={(e) =>
                    update('maxPartySize', Number(e.target.value))
                  }
                  className="w-20 border-gray-200"
                />
              </div>
            </div>

            {/* Average duration */}
            <div className="grid grid-cols-[200px_1fr] items-center border-b border-gray-100 px-5 py-3">
              <span className="text-sm text-gray-600">Average duration</span>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  value={form.duration}
                  onChange={(e) => update('duration', Number(e.target.value))}
                  className="w-24 border-gray-200"
                />
                <span className="text-sm text-gray-500">minutes</span>
              </div>
            </div>

            {/* Average price per person */}
            <div className="grid grid-cols-[200px_1fr] items-center px-5 py-3">
              <span className="text-sm text-gray-600">
                Average price per person
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">&euro;</span>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.averagePricePerPerson}
                  onChange={(e) =>
                    update('averagePricePerPerson', e.target.value)
                  }
                  className="w-32 border-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <fieldset className="rounded-xl border border-gray-200 bg-white px-5 py-4">
              <legend className="px-2 text-sm text-gray-500">Description</legend>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Describe this reservation type..."
                className="border-0 p-0 shadow-none focus-visible:ring-0 resize-none"
              />
            </fieldset>
          </div>

          {/* Upload images */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                Upload images
              </span>
              <span className="text-sm text-gray-400">
                (3-8 images works best. Maximum 10 images)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-400">Select files</span>
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length + imageFiles.length > 10) {
                    toast.error('Maximum 10 images allowed');
                    return;
                  }
                  setImageFiles((prev) => [...prev, ...files]);
                }}
              />
              <Upload className="h-5 w-5 text-green-600" />
            </div>
            {imageFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {imageFiles.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                  >
                    {f.name}
                    <button
                      onClick={() =>
                        setImageFiles((prev) =>
                          prev.filter((_, idx) => idx !== i)
                        )
                      }
                      className="text-gray-400 hover:text-red-500"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Upload menu */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                Upload your menu
              </span>
              <span className="text-sm text-gray-400">(PDF menu)</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => menuInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-400">
                  {menuFile ? menuFile.name : 'Select file'}
                </span>
              </button>
              <input
                ref={menuInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setMenuFile(file);
                }}
              />
              <Upload className="h-5 w-5 text-green-600" />
            </div>
          </div>

          {/* Feedback */}
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

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50"
              title="Save changes"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Opening hours tab */}
      {activeTab === 'hours' && (
        <OpeningHoursTab bookingTypeId={params.id} name={form.name} />
      )}
    </div>
  );
}

function OpeningHoursTab({
  bookingTypeId,
  name,
}: {
  bookingTypeId: string;
  name: string;
}) {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: availability, isLoading } = useSWR<AvailabilityData>(
    `/api/providers/me/booking-types/${bookingTypeId}/availability?year=${year}`,
    availabilityFetcher
  );

  const availableDates = useMemo(() => {
    if (!availability?.slots) return new Set<string>();
    return new Set(availability.slots.map((s) => s.date));
  }, [availability]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Reservation type: {name} &mdash; Opening hours
      </h2>

      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Available from</span>
          <Input
            value={availability?.availableFrom || ''}
            readOnly
            className="w-20 bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Available to</span>
          <Input
            value={availability?.availableTo || ''}
            readOnly
            className="w-20 bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="p-1 rounded hover:bg-gray-100 text-gray-500"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-gray-900 min-w-[50px] text-center">
            {year}
          </span>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="p-1 rounded hover:bg-gray-100 text-gray-500"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
            {Array.from({ length: 12 }, (_, i) => (
              <MiniMonth
                key={i}
                year={year}
                month={i}
                availableDates={availableDates}
              />
            ))}
          </div>
        </div>
      )}

      {/* Read-only notice */}
      <p className="text-xs text-gray-400 text-center">
        Availability data is synced from your external system and cannot be edited here.
      </p>
    </div>
  );
}
