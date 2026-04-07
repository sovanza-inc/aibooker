'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CUISINE_OPTIONS = [
  'Italian', 'Japanese', 'Mexican', 'Indian', 'Thai', 'Chinese', 'French',
  'Mediterranean', 'American', 'Middle Eastern', 'Turkish', 'Korean',
  'Vietnamese', 'Indonesian', 'Dutch', 'Fast Food', 'Seafood', 'Vegan',
  'Fusion', 'Other',
];

const TAG_OPTIONS = [
  'Romantic', 'Family-friendly', 'Terrace', 'Waterfront', 'Rooftop',
  'Late-night', 'Live music', 'Private dining', 'Group-friendly',
  'Dog-friendly', 'Wheelchair accessible', 'Takeaway', 'Delivery',
];

const ATMOSPHERE_OPTIONS = [
  'Fine dining', 'Casual', 'Cozy', 'Modern', 'Traditional',
  'Trendy', 'Rustic', 'Elegant', 'Lively', 'Quiet',
];

const BUSINESS_GOAL_OPTIONS = [
  'Increase weekday bookings', 'Attract tourists', 'Build AI presence',
  'Reduce no-shows', 'Grow repeat customers', 'Expand to new platforms',
  'Improve online visibility', 'Launch delivery/takeaway',
];

const EXPERIENCE_OPTIONS = [
  { value: 'new', label: 'New business', desc: 'Less than 1 year' },
  { value: 'established', label: 'Established', desc: '1-5 years' },
  { value: 'veteran', label: 'Veteran', desc: '5+ years' },
  { value: 'chain', label: 'Chain / Franchise', desc: 'Multiple locations' },
];

const CATEGORY_OPTIONS = ['Restaurant', 'Café', 'Bar', 'Salon', 'Activity', 'Other'];

const STEPS = [
  { number: 1, label: 'Basics' },
  { number: 2, label: 'Location' },
  { number: 3, label: 'Style' },
  { number: 4, label: 'Pricing' },
  { number: 5, label: 'You' },
  { number: 6, label: 'Go Live' },
];

/* ------------------------------------------------------------------ */
/*  Form State                                                         */
/* ------------------------------------------------------------------ */

interface FormData {
  // Step 1
  name: string;
  email: string;
  phone: string;
  website: string;
  description: string;
  category: string;
  // Step 2
  streetAddress: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: string;
  longitude: string;
  // Step 3
  cuisineType: string[];
  tags: string[];
  // Step 4
  atmosphere: string[];
  priceRange: number;
  priceRangeFrom: string;
  priceRangeTo: string;
  minGuestSize: string;
  maxGuestSize: string;
  // Step 5
  diningInterests: string[];
  businessGoals: string[];
  experienceLevel: string;
}

const initialFormData: FormData = {
  name: '', email: '', phone: '', website: '', description: '', category: 'Restaurant',
  streetAddress: '', city: '', postalCode: '', country: 'NL', latitude: '', longitude: '',
  cuisineType: [], tags: [],
  atmosphere: [], priceRange: 0, priceRangeFrom: '', priceRangeTo: '', minGuestSize: '1', maxGuestSize: '20',
  diningInterests: [], businessGoals: [], experienceLevel: '',
};

/* ------------------------------------------------------------------ */
/*  Chip Selector Component                                            */
/* ------------------------------------------------------------------ */

function ChipSelector({ options, selected, onChange, columns = 3 }: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  columns?: number;
}) {
  function toggle(opt: string) {
    onChange(
      selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt]
    );
  }

  return (
    <div className={`grid gap-2 ${columns === 4 ? 'grid-cols-2 sm:grid-cols-4' : columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
            selected.includes(opt)
              ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Price Range Selector                                               */
/* ------------------------------------------------------------------ */

function PriceRangeSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const levels = [
    { v: 1, label: '€', desc: 'Budget' },
    { v: 2, label: '€€', desc: 'Moderate' },
    { v: 3, label: '€€€', desc: 'Upscale' },
    { v: 4, label: '€€€€', desc: 'Fine dining' },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {levels.map((l) => (
        <button
          key={l.v}
          type="button"
          onClick={() => onChange(value === l.v ? 0 : l.v)}
          className={`flex flex-col items-center py-3 rounded-lg border text-sm font-medium transition-all ${
            value === l.v
              ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
          }`}
        >
          <span className="text-lg font-bold">{l.label}</span>
          <span className={`text-[10px] mt-0.5 ${value === l.v ? 'text-orange-100' : 'text-gray-400'}`}>{l.desc}</span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function update<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function canGoNext(): boolean {
    if (step === 1) return form.name.trim().length > 0;
    if (step === 2) return form.streetAddress.trim().length > 0 && form.city.trim().length > 0 && form.postalCode.trim().length > 0;
    return true; // Steps 3-5 are optional
  }

  async function handleActivate() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/providers/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Step 1
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          website: form.website.trim() || undefined,
          description: form.description.trim() || undefined,
          category: form.category,
          // Step 2
          streetAddress: form.streetAddress.trim(),
          city: form.city.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country.trim() || 'NL',
          latitude: form.latitude ? parseFloat(form.latitude) : undefined,
          longitude: form.longitude ? parseFloat(form.longitude) : undefined,
          // Step 3
          cuisineType: form.cuisineType,
          tags: form.tags,
          // Step 4
          atmosphere: form.atmosphere,
          priceRange: form.priceRange || undefined,
          priceRangeFrom: form.priceRangeFrom ? parseFloat(form.priceRangeFrom) : undefined,
          priceRangeTo: form.priceRangeTo ? parseFloat(form.priceRangeTo) : undefined,
          minGuestSize: parseInt(form.minGuestSize) || 1,
          maxGuestSize: parseInt(form.maxGuestSize) || 20,
          // Step 5
          diningInterests: form.diningInterests,
          businessGoals: form.businessGoals,
          experienceLevel: form.experienceLevel || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create provider');
      }
      setSuccess(true);
      setTimeout(() => { window.location.href = '/overview'; }, 2000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  /* Success Screen */
  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <svg className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">You are live!</h2>
            <p className="text-gray-600">Your provider profile has been created. Redirecting to your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, idx) => (
            <div key={s.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  step >= s.number ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s.number ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s.number}
                </div>
                <span className={`mt-1 text-[9px] sm:text-[11px] font-medium ${step >= s.number ? 'text-orange-600' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-0.5 w-full mx-1 mt-[-1rem] ${step > s.number ? 'bg-orange-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ---- STEP 1: Business Basics ---- */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Business Basics</CardTitle>
            <p className="text-sm text-gray-500">Tell us about your business</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Business name *</Label>
              <Input id="name" placeholder="e.g. Ristorante Da Marco" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
              >
                {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="info@example.com" value={form.email} onChange={(e) => update('email', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" placeholder="+31 6 12345678" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" placeholder="https://www.example.com" value={form.website} onChange={(e) => update('website', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Tell us about your business..." rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- STEP 2: Location ---- */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <p className="text-sm text-gray-500">Where is your business located?</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="streetAddress">Street address *</Label>
              <Input id="streetAddress" placeholder="Keizersgracht 123" value={form.streetAddress} onChange={(e) => update('streetAddress', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input id="city" placeholder="Amsterdam" value={form.city} onChange={(e) => update('city', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal code *</Label>
                <Input id="postalCode" placeholder="1015 CJ" value={form.postalCode} onChange={(e) => update('postalCode', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <select
                  id="country"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={form.country}
                  onChange={(e) => update('country', e.target.value)}
                >
                  <option value="NL">NL - Netherlands</option>
                  <option value="BE">BE - Belgium</option>
                  <option value="DE">DE - Germany</option>
                  <option value="FR">FR - France</option>
                  <option value="GB">GB - United Kingdom</option>
                  <option value="ES">ES - Spain</option>
                  <option value="IT">IT - Italy</option>
                  <option value="US">US - United States</option>
                  <option value="PK">PK - Pakistan</option>
                  <option value="AE">AE - UAE</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude (optional)</Label>
                <Input id="latitude" type="number" step="any" placeholder="52.3676" value={form.latitude} onChange={(e) => update('latitude', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude (optional)</Label>
                <Input id="longitude" type="number" step="any" placeholder="4.9041" value={form.longitude} onChange={(e) => update('longitude', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- STEP 3: Cuisine & Style ---- */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Cuisine & Style</CardTitle>
            <p className="text-sm text-gray-500">Help customers find you — select all that apply</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-semibold mb-3 block">Cuisine Type</Label>
              <ChipSelector options={CUISINE_OPTIONS} selected={form.cuisineType} onChange={(v) => update('cuisineType', v)} columns={4} />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-3 block">Features & Tags</Label>
              <ChipSelector options={TAG_OPTIONS} selected={form.tags} onChange={(v) => update('tags', v)} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- STEP 4: Atmosphere & Pricing ---- */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Atmosphere & Pricing</CardTitle>
            <p className="text-sm text-gray-500">Describe the vibe and pricing</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-semibold mb-3 block">Atmosphere</Label>
              <ChipSelector options={ATMOSPHERE_OPTIONS} selected={form.atmosphere} onChange={(v) => update('atmosphere', v)} columns={3} />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-3 block">Price Range</Label>
              <PriceRangeSelector value={form.priceRange} onChange={(v) => update('priceRange', v)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priceFrom">Avg. price per person (from)</Label>
                <Input id="priceFrom" type="number" placeholder="15" value={form.priceRangeFrom} onChange={(e) => update('priceRangeFrom', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="priceTo">Avg. price per person (to)</Label>
                <Input id="priceTo" type="number" placeholder="45" value={form.priceRangeTo} onChange={(e) => update('priceRangeTo', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minGuest">Min. party size</Label>
                <Input id="minGuest" type="number" min="1" value={form.minGuestSize} onChange={(e) => update('minGuestSize', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="maxGuest">Max. party size</Label>
                <Input id="maxGuest" type="number" min="1" value={form.maxGuestSize} onChange={(e) => update('maxGuestSize', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- STEP 5: Your Preferences ---- */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>About You</CardTitle>
            <p className="text-sm text-gray-500">Help us personalize your dashboard experience</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-semibold mb-1 block">What type of food do you personally enjoy?</Label>
              <p className="text-xs text-gray-400 mb-3">This helps us tailor recommendations and insights</p>
              <ChipSelector options={CUISINE_OPTIONS} selected={form.diningInterests} onChange={(v) => update('diningInterests', v)} columns={4} />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1 block">Business Goals</Label>
              <p className="text-xs text-gray-400 mb-3">What are you looking to achieve?</p>
              <ChipSelector options={BUSINESS_GOAL_OPTIONS} selected={form.businessGoals} onChange={(v) => update('businessGoals', v)} columns={2} />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-3 block">Experience Level</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update('experienceLevel', form.experienceLevel === opt.value ? '' : opt.value)}
                    className={`flex flex-col items-center py-3 px-2 rounded-lg border text-sm transition-all ${
                      form.experienceLevel === opt.value
                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <span className="font-semibold text-xs">{opt.label}</span>
                    <span className={`text-[10px] mt-0.5 ${form.experienceLevel === opt.value ? 'text-orange-100' : 'text-gray-400'}`}>{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- STEP 6: Review & Go Live ---- */}
      {step === 6 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Go Live</CardTitle>
            <p className="text-sm text-gray-500">Everything look good? Let's activate your profile.</p>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
              {/* Business */}
              <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Business</h3>
                <dl className="space-y-1.5 text-sm">
                  <ReviewRow label="Name" value={form.name} />
                  <ReviewRow label="Category" value={form.category} />
                  {form.email && <ReviewRow label="Email" value={form.email} />}
                  {form.phone && <ReviewRow label="Phone" value={form.phone} />}
                  {form.website && <ReviewRow label="Website" value={form.website} />}
                </dl>
              </div>
              {/* Location */}
              <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Location</h3>
                <dl className="space-y-1.5 text-sm">
                  <ReviewRow label="Address" value={`${form.streetAddress}, ${form.city} ${form.postalCode}`} />
                  <ReviewRow label="Country" value={form.country} />
                </dl>
              </div>
              {/* Style */}
              {(form.cuisineType.length > 0 || form.tags.length > 0) && (
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Style</h3>
                  {form.cuisineType.length > 0 && <ReviewChips label="Cuisine" items={form.cuisineType} />}
                  {form.tags.length > 0 && <ReviewChips label="Tags" items={form.tags} />}
                </div>
              )}
              {/* Pricing */}
              {(form.atmosphere.length > 0 || form.priceRange > 0) && (
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Atmosphere & Pricing</h3>
                  {form.atmosphere.length > 0 && <ReviewChips label="Atmosphere" items={form.atmosphere} />}
                  {form.priceRange > 0 && <ReviewRow label="Price range" value={'€'.repeat(form.priceRange)} />}
                  <ReviewRow label="Party size" value={`${form.minGuestSize} - ${form.maxGuestSize} guests`} />
                </div>
              )}
              {/* Personal */}
              {(form.diningInterests.length > 0 || form.businessGoals.length > 0 || form.experienceLevel) && (
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Your Preferences</h3>
                  {form.diningInterests.length > 0 && <ReviewChips label="Interests" items={form.diningInterests} />}
                  {form.businessGoals.length > 0 && <ReviewChips label="Goals" items={form.businessGoals} />}
                  {form.experienceLevel && <ReviewRow label="Experience" value={EXPERIENCE_OPTIONS.find((o) => o.value === form.experienceLevel)?.label || form.experienceLevel} />}
                </div>
              )}
            </div>
            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 mt-4">{error}</div>}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        {step > 1 ? (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={submitting}>Back</Button>
        ) : <div />}

        <div className="flex items-center gap-3">
          {step >= 3 && step <= 5 && (
            <button type="button" onClick={() => setStep((s) => s + 1)} className="text-sm text-gray-400 hover:text-gray-600 underline">
              Skip
            </button>
          )}
          {step < 6 ? (
            <Button className="bg-orange-500 hover:bg-orange-600 text-white" disabled={!canGoNext()} onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          ) : (
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8" disabled={submitting} onClick={handleActivate}>
              {submitting ? 'Activating...' : 'Activate & Go Live'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Review Helpers                                                     */
/* ------------------------------------------------------------------ */

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between">
      <dt className="text-gray-400 text-xs">{label}</dt>
      <dd className="font-medium text-gray-900 text-sm break-all">{value}</dd>
    </div>
  );
}

function ReviewChips({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mb-2">
      <dt className="text-gray-400 text-xs mb-1">{label}</dt>
      <dd className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange-100 text-orange-700">
            {item}
          </span>
        ))}
      </dd>
    </div>
  );
}
