"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProviderLocation {
  streetAddress: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

interface Provider {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cuisineType: string | null;
  tags: string[] | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  priceRange: string | null;
  rating: number | null;
  status: string | null;
  aboutCompany: string | null;
  whatIsThisBusiness: string | null;
  whatCanIBookHere: string | null;
  whenShouldRecommend: string | null;
  whatCanCustomersBook: string[] | null;
  bestFor: string[] | null;
  atmosphere: string[] | null;
  whatMakesUnique: string | null;
  whenShouldChoose: string | null;
  whenShouldNotChoose: string | null;
  popularDishes: string | null;
  minGuestSize: number | null;
  maxGuestSize: number | null;
  priceRangeFrom: number | null;
  priceRangeTo: number | null;
  targetAudience: string[] | null;
  location: ProviderLocation | null;
}

interface OpeningHourEntry {
  id?: string;
  date: string;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

/* ------------------------------------------------------------------ */
/*  SWR fetcher                                                        */
/* ------------------------------------------------------------------ */

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) return null;
  return r.json();
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function generateDaysForMonth(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: { date: string; dayName: string; dateObj: Date }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ date: iso, dayName: DAY_NAMES[dt.getDay()], dateObj: dt });
  }
  return days;
}

function parseArrayField(val: string[] | string | null | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* not JSON */
    }
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/* ------------------------------------------------------------------ */
/*  Badge input (for comma-separated arrays)                           */
/* ------------------------------------------------------------------ */

function BadgeArrayField({
  label,
  values,
  onChange,
  editing,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  editing: boolean;
}) {
  const [inputVal, setInputVal] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = inputVal.trim().replace(/,$/g, "");
      if (trimmed && !values.includes(trimmed)) {
        onChange([...values, trimmed]);
      }
      setInputVal("");
    }
  };

  const removeBadge = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <Label className="text-sm text-gray-600">{label}</Label>
      <div className="mt-1 flex flex-wrap gap-2">
        {values.map((tag, i) => (
          <Badge
            key={`${tag}-${i}`}
            variant="secondary"
            className="bg-orange-50 text-orange-700 border border-orange-200"
          >
            {tag}
            {editing && (
              <button
                type="button"
                className="ml-1.5 text-orange-400 hover:text-orange-600"
                onClick={() => removeBadge(i)}
              >
                x
              </button>
            )}
          </Badge>
        ))}
      </div>
      {editing && (
        <Input
          placeholder="Type and press Enter to add"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          className="mt-2"
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Jimani connection banner (static UI)                               */
/* ------------------------------------------------------------------ */

function JimaniBanner() {
  return (
    <Card className="border-green-300 bg-green-50/40 mb-6">
      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xl font-bold text-orange-500">Jimani</span>
          <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100">
            Connected
          </Badge>
          <span className="text-sm text-gray-500">
            Business ID: <span className="font-medium">JIM-00007457</span>
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          Disconnect
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab 1 -- Standard Information                                      */
/* ------------------------------------------------------------------ */

function StandardInformationTab({
  provider,
  mutate,
}: {
  provider: Provider;
  mutate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState(provider.name || "");
  const [streetAddress, setStreetAddress] = useState(
    provider.location?.streetAddress || ""
  );
  const [postalCode, setPostalCode] = useState(
    provider.location?.postalCode || ""
  );
  const [city, setCity] = useState(provider.location?.city || "");
  const [country, setCountry] = useState(provider.location?.country || "");
  const [latitude, setLatitude] = useState(
    provider.location?.latitude?.toString() || ""
  );
  const [longitude, setLongitude] = useState(
    provider.location?.longitude?.toString() || ""
  );
  const [email, setEmail] = useState(provider.email || "");
  const [website, setWebsite] = useState(provider.website || "");
  const [phone, setPhone] = useState(provider.phone || "");
  const [priceRangeFrom, setPriceRangeFrom] = useState(
    provider.priceRangeFrom?.toString() || ""
  );
  const [priceRangeTo, setPriceRangeTo] = useState(
    provider.priceRangeTo?.toString() || ""
  );
  const [minGuestSize, setMinGuestSize] = useState(
    provider.minGuestSize?.toString() || ""
  );
  const [maxGuestSize, setMaxGuestSize] = useState(
    provider.maxGuestSize?.toString() || ""
  );
  const [targetAudience, setTargetAudience] = useState<string[]>(
    parseArrayField(provider.targetAudience)
  );

  // Sync when provider changes
  useEffect(() => {
    setName(provider.name || "");
    setStreetAddress(provider.location?.streetAddress || "");
    setPostalCode(provider.location?.postalCode || "");
    setCity(provider.location?.city || "");
    setCountry(provider.location?.country || "");
    setLatitude(provider.location?.latitude?.toString() || "");
    setLongitude(provider.location?.longitude?.toString() || "");
    setEmail(provider.email || "");
    setWebsite(provider.website || "");
    setPhone(provider.phone || "");
    setPriceRangeFrom(provider.priceRangeFrom?.toString() || "");
    setPriceRangeTo(provider.priceRangeTo?.toString() || "");
    setMinGuestSize(provider.minGuestSize?.toString() || "");
    setMaxGuestSize(provider.maxGuestSize?.toString() || "");
    setTargetAudience(parseArrayField(provider.targetAudience));
  }, [provider]);

  const handleCancel = () => {
    setEditing(false);
    setName(provider.name || "");
    setStreetAddress(provider.location?.streetAddress || "");
    setPostalCode(provider.location?.postalCode || "");
    setCity(provider.location?.city || "");
    setCountry(provider.location?.country || "");
    setLatitude(provider.location?.latitude?.toString() || "");
    setLongitude(provider.location?.longitude?.toString() || "");
    setEmail(provider.email || "");
    setWebsite(provider.website || "");
    setPhone(provider.phone || "");
    setPriceRangeFrom(provider.priceRangeFrom?.toString() || "");
    setPriceRangeTo(provider.priceRangeTo?.toString() || "");
    setMinGuestSize(provider.minGuestSize?.toString() || "");
    setMaxGuestSize(provider.maxGuestSize?.toString() || "");
    setTargetAudience(parseArrayField(provider.targetAudience));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/providers/me/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          website,
          phone,
          priceRangeFrom: priceRangeFrom ? parseFloat(priceRangeFrom) : null,
          priceRangeTo: priceRangeTo ? parseFloat(priceRangeTo) : null,
          minGuestSize: minGuestSize ? parseInt(minGuestSize) : null,
          maxGuestSize: maxGuestSize ? parseInt(maxGuestSize) : null,
          targetAudience,
          location: {
            streetAddress,
            postalCode,
            city,
            country,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Settings saved successfully");
      setEditing(false);
      mutate();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Standard information
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (editing ? handleCancel() : setEditing(true))}
            className="gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" />
            {editing ? "Cancel" : "Edit"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {/* Company name */}
          <div className="md:col-span-2">
            <Label className="text-sm text-gray-600">Company name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!editing}
              className="mt-1"
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <Label className="text-sm text-gray-600">Address</Label>
            <Input
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              disabled={!editing}
              className="mt-1"
            />
          </div>

          {/* Zipcode & City */}
          <div>
            <Label className="text-sm text-gray-600">Zipcode</Label>
            <Input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              disabled={!editing}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-gray-600">City</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!editing}
              className="mt-1"
            />
          </div>

          {/* Country */}
          <div>
            <Label className="text-sm text-gray-600">Country</Label>
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={!editing}
              className="mt-1"
            />
          </div>

          {/* Latitude */}
          <div>
            <Label className="text-sm text-gray-600">Latitude</Label>
            <Input
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              disabled={!editing}
              className="mt-1"
              placeholder="e.g. 51.4953"
            />
          </div>

          {/* Longitude */}
          <div>
            <Label className="text-sm text-gray-600">Longitude</Label>
            <Input
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              disabled={!editing}
              className="mt-1"
              placeholder="e.g. 3.8737"
            />
          </div>

          {/* Email */}
          <div>
            <Label className="text-sm text-gray-600">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!editing}
              className="mt-1"
            />
          </div>

          {/* Website */}
          <div>
            <Label className="text-sm text-gray-600">Website</Label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              disabled={!editing}
              className="mt-1"
            />
          </div>

          {/* Phone */}
          <div>
            <Label className="text-sm text-gray-600">Phone</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!editing}
              className="mt-1"
            />
          </div>

          {/* Price range */}
          <div className="md:col-span-2">
            <Label className="text-sm text-gray-600">Price range</Label>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <span className="text-sm text-gray-500">From</span>
              <Input
                type="number"
                step="0.01"
                value={priceRangeFrom}
                onChange={(e) => setPriceRangeFrom(e.target.value)}
                disabled={!editing}
                className="w-full sm:w-28"
                placeholder="0.00"
              />
              <span className="text-sm text-gray-500">To</span>
              <Input
                type="number"
                step="0.01"
                value={priceRangeTo}
                onChange={(e) => setPriceRangeTo(e.target.value)}
                disabled={!editing}
                className="w-full sm:w-28"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Guest sizes */}
          <div className="md:col-span-2">
            <Label className="text-sm text-gray-600">Guest sizes</Label>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <span className="text-sm text-gray-500">From</span>
              <Input
                type="number"
                value={minGuestSize}
                onChange={(e) => setMinGuestSize(e.target.value)}
                disabled={!editing}
                className="w-full sm:w-24"
              />
              <span className="text-sm text-gray-500">To</span>
              <Input
                type="number"
                value={maxGuestSize}
                onChange={(e) => setMaxGuestSize(e.target.value)}
                disabled={!editing}
                className="w-full sm:w-24"
              />
            </div>
          </div>

          {/* Target audience */}
          <div className="md:col-span-2">
            <BadgeArrayField
              label="Target audience"
              values={targetAudience}
              onChange={setTargetAudience}
              editing={editing}
            />
          </div>
        </div>

        {editing && (
          <div className="flex justify-end mt-8 gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab 2 -- Business Information                                      */
/* ------------------------------------------------------------------ */

function BusinessInformationTab({
  provider,
  mutate,
}: {
  provider: Provider;
  mutate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [aboutCompany, setAboutCompany] = useState(
    provider.aboutCompany || ""
  );
  const [whatIsThisBusiness, setWhatIsThisBusiness] = useState(
    provider.whatIsThisBusiness || ""
  );
  const [whatCanIBookHere, setWhatCanIBookHere] = useState(
    provider.whatCanIBookHere || ""
  );
  const [whenShouldRecommend, setWhenShouldRecommend] = useState(
    provider.whenShouldRecommend || ""
  );
  const [whatCanCustomersBook, setWhatCanCustomersBook] = useState<string[]>(
    parseArrayField(provider.whatCanCustomersBook)
  );
  const [bestFor, setBestFor] = useState<string[]>(
    parseArrayField(provider.bestFor)
  );
  const [atmosphere, setAtmosphere] = useState<string[]>(
    parseArrayField(provider.atmosphere)
  );
  const [whatMakesUnique, setWhatMakesUnique] = useState(
    provider.whatMakesUnique || ""
  );
  const [whenShouldChoose, setWhenShouldChoose] = useState(
    provider.whenShouldChoose || ""
  );
  const [whenShouldNotChoose, setWhenShouldNotChoose] = useState(
    provider.whenShouldNotChoose || ""
  );
  const [popularDishes, setPopularDishes] = useState(
    provider.popularDishes || ""
  );

  // Sync when provider changes
  useEffect(() => {
    setAboutCompany(provider.aboutCompany || "");
    setWhatIsThisBusiness(provider.whatIsThisBusiness || "");
    setWhatCanIBookHere(provider.whatCanIBookHere || "");
    setWhenShouldRecommend(provider.whenShouldRecommend || "");
    setWhatCanCustomersBook(parseArrayField(provider.whatCanCustomersBook));
    setBestFor(parseArrayField(provider.bestFor));
    setAtmosphere(parseArrayField(provider.atmosphere));
    setWhatMakesUnique(provider.whatMakesUnique || "");
    setWhenShouldChoose(provider.whenShouldChoose || "");
    setWhenShouldNotChoose(provider.whenShouldNotChoose || "");
    setPopularDishes(provider.popularDishes || "");
  }, [provider]);

  const handleCancel = () => {
    setEditing(false);
    setAboutCompany(provider.aboutCompany || "");
    setWhatIsThisBusiness(provider.whatIsThisBusiness || "");
    setWhatCanIBookHere(provider.whatCanIBookHere || "");
    setWhenShouldRecommend(provider.whenShouldRecommend || "");
    setWhatCanCustomersBook(parseArrayField(provider.whatCanCustomersBook));
    setBestFor(parseArrayField(provider.bestFor));
    setAtmosphere(parseArrayField(provider.atmosphere));
    setWhatMakesUnique(provider.whatMakesUnique || "");
    setWhenShouldChoose(provider.whenShouldChoose || "");
    setWhenShouldNotChoose(provider.whenShouldNotChoose || "");
    setPopularDishes(provider.popularDishes || "");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/providers/me/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aboutCompany,
          whatIsThisBusiness,
          whatCanIBookHere,
          whenShouldRecommend,
          whatCanCustomersBook,
          bestFor,
          atmosphere,
          whatMakesUnique,
          whenShouldChoose,
          whenShouldNotChoose,
          popularDishes,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Business information saved successfully");
      setEditing(false);
      mutate();
    } catch {
      toast.error("Failed to save business information");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Business information
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (editing ? handleCancel() : setEditing(true))}
            className="gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" />
            {editing ? "Cancel" : "Edit"}
          </Button>
        </div>

        <div className="space-y-5">
          {/* About your company */}
          <div>
            <Label className="text-sm text-gray-600">About your company</Label>
            <Textarea
              value={aboutCompany}
              onChange={(e) => setAboutCompany(e.target.value)}
              disabled={!editing}
              className="mt-1 min-h-[80px]"
            />
          </div>

          {/* What is this business? */}
          <div>
            <Label className="text-sm text-gray-600">
              What is this business?
            </Label>
            <Textarea
              value={whatIsThisBusiness}
              onChange={(e) => setWhatIsThisBusiness(e.target.value)}
              disabled={!editing}
              className="mt-1 min-h-[80px]"
            />
          </div>

          {/* What can I book here? */}
          <div>
            <Label className="text-sm text-gray-600">
              What can I book here?
            </Label>
            <Textarea
              value={whatCanIBookHere}
              onChange={(e) => setWhatCanIBookHere(e.target.value)}
              disabled={!editing}
              className="mt-1 min-h-[80px]"
            />
          </div>

          {/* When should I recommend this? */}
          <div>
            <Label className="text-sm text-gray-600">
              When should I recommend this?
            </Label>
            <Textarea
              value={whenShouldRecommend}
              onChange={(e) => setWhenShouldRecommend(e.target.value)}
              disabled={!editing}
              className="mt-1 min-h-[80px]"
            />
          </div>

          {/* What can customers book here? (badges) */}
          <BadgeArrayField
            label="What can customers book here?"
            values={whatCanCustomersBook}
            onChange={setWhatCanCustomersBook}
            editing={editing}
          />

          {/* What is this place best for? (badges) */}
          <BadgeArrayField
            label="What is this place best for?"
            values={bestFor}
            onChange={setBestFor}
            editing={editing}
          />

          {/* Atmosphere / vibe (badges) */}
          <BadgeArrayField
            label="Atmosphere / vibe"
            values={atmosphere}
            onChange={setAtmosphere}
            editing={editing}
          />

          {/* What makes this place unique? */}
          <div>
            <Label className="text-sm text-gray-600">
              What makes this place unique?
            </Label>
            <Input
              value={whatMakesUnique}
              onChange={(e) => setWhatMakesUnique(e.target.value)}
              disabled={!editing}
              className="mt-1"
            />
          </div>

          {/* When should customers choose you? */}
          <div>
            <Label className="text-sm text-gray-600">
              When should customers choose you?
            </Label>
            <Input
              value={whenShouldChoose}
              onChange={(e) => setWhenShouldChoose(e.target.value)}
              disabled={!editing}
              className="mt-1"
            />
          </div>

          {/* When should customers NOT choose you? */}
          <div>
            <Label className="text-sm text-gray-600">
              When should customers NOT choose you?
            </Label>
            <Input
              value={whenShouldNotChoose}
              onChange={(e) => setWhenShouldNotChoose(e.target.value)}
              disabled={!editing}
              className="mt-1"
            />
          </div>

          {/* Most popular dishes */}
          <div>
            <Label className="text-sm text-gray-600">
              What are your most popular dishes?
            </Label>
            <Textarea
              value={popularDishes}
              onChange={(e) => setPopularDishes(e.target.value)}
              disabled={!editing}
              className="mt-1 min-h-[80px]"
            />
          </div>
        </div>

        {editing && (
          <div className="flex justify-end mt-8 gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab 3 -- Opening Hours                                             */
/* ------------------------------------------------------------------ */

function OpeningHoursTab() {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [saving, setSaving] = useState(false);

  // Fetch opening hours for selected year/month
  const {
    data: apiHours,
    isLoading: hoursLoading,
    mutate: mutateHours,
  } = useSWR<OpeningHourEntry[]>(
    `/api/providers/me/opening-hours?year=${selectedYear}&month=${selectedMonth}`,
    fetcher
  );

  // Generate all days for the month and merge with API data
  const allDays = generateDaysForMonth(selectedYear, selectedMonth);

  // Local editable state for opening hours
  const [localHours, setLocalHours] = useState<
    Map<string, { openTime: string; closeTime: string; isClosed: boolean }>
  >(new Map());

  // Rebuild local state when API data or month/year changes
  useEffect(() => {
    const apiMap = new Map<
      string,
      { openTime: string; closeTime: string; isClosed: boolean }
    >();
    if (apiHours && Array.isArray(apiHours)) {
      for (const h of apiHours) {
        // Normalize date to YYYY-MM-DD
        const dateKey = h.date.substring(0, 10);
        apiMap.set(dateKey, {
          openTime: h.openTime || "",
          closeTime: h.closeTime || "",
          isClosed: h.isClosed,
        });
      }
    }

    const newMap = new Map<
      string,
      { openTime: string; closeTime: string; isClosed: boolean }
    >();
    for (const day of allDays) {
      const existing = apiMap.get(day.date);
      if (existing) {
        newMap.set(day.date, existing);
      } else {
        newMap.set(day.date, { openTime: "08:00", closeTime: "21:30", isClosed: false });
      }
    }
    setLocalHours(newMap);
  }, [apiHours, selectedYear, selectedMonth]);

  const updateDay = useCallback(
    (
      date: string,
      field: "openTime" | "closeTime" | "isClosed",
      value: string | boolean
    ) => {
      setLocalHours((prev) => {
        const next = new Map(prev);
        const current = next.get(date) || {
          openTime: "08:00",
          closeTime: "21:30",
          isClosed: false,
        };
        next.set(date, { ...current, [field]: value });
        return next;
      });
    },
    []
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const hours = allDays.map((day) => {
        const entry = localHours.get(day.date) || {
          openTime: "08:00",
          closeTime: "21:30",
          isClosed: false,
        };
        return {
          date: day.date,
          openTime: entry.isClosed ? null : entry.openTime,
          closeTime: entry.isClosed ? null : entry.closeTime,
          isClosed: entry.isClosed,
        };
      });

      const res = await fetch("/api/providers/me/opening-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Opening hours saved successfully");
      mutateHours();
    } catch {
      toast.error("Failed to save opening hours");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardContent className="pt-6">

        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Opening hours
        </h2>

        {/* Year selector */}
        <div className="mb-4">
          <Label className="text-sm text-gray-600 mb-2 block">Year</Label>
          <div className="flex gap-2">
            {[2026, 2027, 2028].map((year) => (
              <Button
                key={year}
                variant={selectedYear === year ? "default" : "outline"}
                size="sm"
                className={
                  selectedYear === year
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : ""
                }
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </Button>
            ))}
          </div>
        </div>

        {/* Month selector */}
        <div className="mb-6">
          <Label className="text-sm text-gray-600 mb-2 block">Month</Label>
          <div className="flex flex-wrap gap-2">
            {MONTHS.map((month, idx) => (
              <Button
                key={month}
                variant={selectedMonth === idx ? "default" : "outline"}
                size="sm"
                className={
                  selectedMonth === idx
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : ""
                }
                onClick={() => setSelectedMonth(idx)}
              >
                {month}
              </Button>
            ))}
          </div>
        </div>

        {/* Daily list */}
        {hoursLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading opening hours...
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
            {/* Header */}
            <div className="grid grid-cols-[minmax(120px,1.5fr)_minmax(90px,1fr)_minmax(90px,1fr)_minmax(60px,0.5fr)] gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600 min-w-[400px]">
              <span>Date</span>
              <span>Open from</span>
              <span>Open until</span>
              <span>Closed</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
              {allDays.map((day) => {
                const entry = localHours.get(day.date) || {
                  openTime: "08:00",
                  closeTime: "21:30",
                  isClosed: false,
                };
                return (
                  <div
                    key={day.date}
                    className={`grid grid-cols-[minmax(120px,1.5fr)_minmax(90px,1fr)_minmax(90px,1fr)_minmax(60px,0.5fr)] gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 items-center text-sm min-w-[400px] ${
                      entry.isClosed ? "bg-gray-50/60 text-gray-400" : ""
                    }`}
                  >
                    <span className={!entry.isClosed ? "text-gray-900" : ""}>
                      <span className="font-medium">{day.dayName.slice(0, 3)}</span>{" "}
                      <span className="text-gray-500 text-xs sm:text-sm">{day.date}</span>
                    </span>

                    {!entry.isClosed ? (
                      <>
                        <Input
                          type="time"
                          value={entry.openTime}
                          onChange={(e) =>
                            updateDay(day.date, "openTime", e.target.value)
                          }
                          className="h-8 w-full max-w-[7rem] text-sm"
                        />
                        <Input
                          type="time"
                          value={entry.closeTime}
                          onChange={(e) =>
                            updateDay(day.date, "closeTime", e.target.value)
                          }
                          className="h-8 w-full max-w-[7rem] text-sm"
                        />
                      </>
                    ) : (
                      <>
                        <span className="text-gray-400 italic">closed</span>
                        <span />
                      </>
                    )}

                    <Switch
                      checked={entry.isClosed}
                      onCheckedChange={(checked) =>
                        updateDay(day.date, "isClosed", checked)
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleSave}
            disabled={saving}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save opening hours
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Settings Page                                                 */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const {
    data: provider,
    error,
    isLoading,
    mutate,
  } = useSWR<Provider>("/api/providers/me", fetcher);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin mr-3" />
        Loading settings...
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="flex items-center justify-center py-24 text-red-500">
        Failed to load provider data. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your business profile and preferences
        </p>
      </div>

      {/* Jimani banner */}
      <JimaniBanner />

      {/* Tabs */}
      <Tabs defaultValue="standard" className="w-full">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="mb-4 w-max sm:w-auto">
            <TabsTrigger value="standard">Standard information</TabsTrigger>
            <TabsTrigger value="business">Business information</TabsTrigger>
            <TabsTrigger value="hours">Opening hours</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="standard">
          <StandardInformationTab provider={provider} mutate={mutate} />
        </TabsContent>

        <TabsContent value="business">
          <BusinessInformationTab provider={provider} mutate={mutate} />
        </TabsContent>

        <TabsContent value="hours">
          <OpeningHoursTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
