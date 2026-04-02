'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface FormData {
  // Step 1: Business Info
  name: string;
  email: string;
  phone: string;
  website: string;
  description: string;
  // Step 2: Location
  streetAddress: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: string;
  longitude: string;
}

const initialFormData: FormData = {
  name: '',
  email: '',
  phone: '',
  website: '',
  description: '',
  streetAddress: '',
  city: '',
  postalCode: '',
  country: 'NL',
  latitude: '',
  longitude: '',
};

const steps = [
  { number: 1, label: 'Business Info' },
  { number: 2, label: 'Location' },
  { number: 3, label: 'Confirm & Go Live' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function update(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function canGoNext(): boolean {
    if (currentStep === 1) {
      return formData.name.trim().length > 0;
    }
    if (currentStep === 2) {
      return (
        formData.streetAddress.trim().length > 0 &&
        formData.city.trim().length > 0 &&
        formData.postalCode.trim().length > 0
      );
    }
    return true;
  }

  async function handleActivate() {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/providers/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          website: formData.website.trim() || undefined,
          description: formData.description.trim() || undefined,
          streetAddress: formData.streetAddress.trim(),
          city: formData.city.trim(),
          postalCode: formData.postalCode.trim(),
          country: formData.country.trim() || 'NL',
          latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
          longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create provider');
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/overview';
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

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
    <div className="max-w-2xl mx-auto py-4">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-xs sm:text-sm font-bold ${
                    currentStep >= step.number
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.number}
                </div>
                <span
                  className={`mt-1 sm:mt-2 text-[10px] sm:text-xs font-medium ${
                    currentStep >= step.number ? 'text-orange-600' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`h-0.5 w-full mx-2 mt-[-1.25rem] ${
                    currentStep > step.number ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Business Info */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Business name *</Label>
              <Input
                id="name"
                placeholder="e.g. Ristorante Da Marco"
                value={formData.name}
                onChange={(e) => update('name', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@example.com"
                  value={formData.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+31 6 12345678"
                  value={formData.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                placeholder="https://www.example.com"
                value={formData.website}
                onChange={(e) => update('website', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell us about your business..."
                rows={3}
                value={formData.description}
                onChange={(e) => update('description', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Location */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="streetAddress">Street address *</Label>
              <Input
                id="streetAddress"
                placeholder="Keizersgracht 123"
                value={formData.streetAddress}
                onChange={(e) => update('streetAddress', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Amsterdam"
                  value={formData.city}
                  onChange={(e) => update('city', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal code *</Label>
                <Input
                  id="postalCode"
                  placeholder="1015 CJ"
                  value={formData.postalCode}
                  onChange={(e) => update('postalCode', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="country">Country Code</Label>
                <select
                  id="country"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.country}
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
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="52.3676"
                  value={formData.latitude}
                  onChange={(e) => update('latitude', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude (optional)</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="4.9041"
                  value={formData.longitude}
                  onChange={(e) => update('longitude', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm & Go Live</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-gray-600">
              Review your details below. Once you activate, your provider profile will be live.
            </p>

            <div className="rounded-lg border border-gray-200 divide-y divide-gray-200">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Business Info</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <dt className="text-gray-500">Name</dt>
                    <dd className="font-medium text-gray-900">{formData.name}</dd>
                  </div>
                  {formData.email && (
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <dt className="text-gray-500">Email</dt>
                      <dd className="font-medium text-gray-900 break-all">{formData.email}</dd>
                    </div>
                  )}
                  {formData.phone && (
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <dt className="text-gray-500">Phone</dt>
                      <dd className="font-medium text-gray-900">{formData.phone}</dd>
                    </div>
                  )}
                  {formData.website && (
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <dt className="text-gray-500">Website</dt>
                      <dd className="font-medium text-gray-900 break-all">{formData.website}</dd>
                    </div>
                  )}
                  {formData.description && (
                    <div>
                      <dt className="text-gray-500 mb-1">Description</dt>
                      <dd className="font-medium text-gray-900">{formData.description}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Location</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <dt className="text-gray-500">Address</dt>
                    <dd className="font-medium text-gray-900">{formData.streetAddress}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <dt className="text-gray-500">City</dt>
                    <dd className="font-medium text-gray-900">{formData.city}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <dt className="text-gray-500">Postal code</dt>
                    <dd className="font-medium text-gray-900">{formData.postalCode}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <dt className="text-gray-500">Country</dt>
                    <dd className="font-medium text-gray-900">{formData.country}</dd>
                  </div>
                  {(formData.latitude || formData.longitude) && (
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <dt className="text-gray-500">Coordinates</dt>
                      <dd className="font-medium text-gray-900">
                        {formData.latitude}, {formData.longitude}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        {currentStep > 1 ? (
          <Button
            variant="outline"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={submitting}
          >
            Back
          </Button>
        ) : (
          <div />
        )}

        {currentStep < 3 ? (
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={!canGoNext()}
            onClick={() => setCurrentStep((s) => s + 1)}
          >
            Next
          </Button>
        ) : (
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={submitting}
            onClick={handleActivate}
          >
            {submitting ? 'Activating...' : 'Activate'}
          </Button>
        )}
      </div>
    </div>
  );
}
