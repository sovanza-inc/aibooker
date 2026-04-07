"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
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
  logo: string | null;
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

function JimaniBanner({ provider }: { provider: Provider }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-gray-900 flex items-center justify-center">
              <span className="text-white font-bold text-sm">J</span>
            </div>
            <span className="text-lg font-bold text-gray-900">Jimani</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100 gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
            Connected
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
          >
            Disconnect
          </Button>
          <span className="text-xs text-gray-400">
            Business ID: {provider.id}
          </span>
        </div>
      </div>
    </div>
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
          priceRange,
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

  const [priceRange, setPriceRange] = useState(provider.priceRange || "mid-range");

  useEffect(() => {
    setPriceRange(provider.priceRange || "mid-range");
  }, [provider]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          Standard information
        </h2>
        <button
          onClick={() => (editing ? handleCancel() : setEditing(true))}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Company name */}
        <div className="grid grid-cols-[160px_1fr] items-center border-b border-gray-100 px-5 py-3">
          <span className="text-sm text-gray-500">Company name</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!editing}
            className="max-w-sm border-gray-200"
          />
        </div>

        {/* Address */}
        <div className="grid grid-cols-[160px_1fr] items-center border-b border-gray-100 px-5 py-3">
          <span className="text-sm text-gray-500">Address</span>
          <Input
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            disabled={!editing}
            className="max-w-sm border-gray-200"
          />
        </div>

        {/* Zipcode & Place */}
        <div className="grid grid-cols-[160px_1fr] items-center border-b border-gray-100 px-5 py-3">
          <span className="text-sm text-gray-500">Zipcode &amp; Place</span>
          <div className="flex items-center gap-3 max-w-sm">
            <Input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              disabled={!editing}
              className="w-28 border-gray-200"
            />
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!editing}
              className="flex-1 border-gray-200"
            />
          </div>
        </div>

        {/* Country */}
        <div className="grid grid-cols-[160px_1fr] items-center border-b border-gray-100 px-5 py-3">
          <span className="text-sm text-gray-500">Country</span>
          {editing ? (
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="max-w-sm border-gray-200">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="netherlands">Netherlands</SelectItem>
                <SelectItem value="belgium">Belgium</SelectItem>
                <SelectItem value="germany">Germany</SelectItem>
                <SelectItem value="france">France</SelectItem>
                <SelectItem value="united kingdom">United Kingdom</SelectItem>
                <SelectItem value="spain">Spain</SelectItem>
                <SelectItem value="italy">Italy</SelectItem>
                <SelectItem value="portugal">Portugal</SelectItem>
                <SelectItem value="austria">Austria</SelectItem>
                <SelectItem value="switzerland">Switzerland</SelectItem>
                <SelectItem value="pakistan">Pakistan</SelectItem>
                <SelectItem value="united states">United States</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <span className="text-sm text-gray-900 capitalize">
              {country || "—"}
            </span>
          )}
        </div>

        {/* Lat + Long */}
        <div className="grid grid-cols-[160px_1fr] items-center border-b border-gray-100 px-5 py-3">
          <span className="text-sm text-gray-500">Lat + Long</span>
          <div className="flex items-center gap-2 max-w-sm">
            <Input
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              disabled={!editing}
              className="w-36 border-gray-200"
              placeholder="51.4953"
            />
            <span className="text-gray-300">,</span>
            <Input
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              disabled={!editing}
              className="w-36 border-gray-200"
              placeholder="3.8737"
            />
          </div>
        </div>

        {/* Email */}
        <div className="grid grid-cols-[160px_1fr] items-center border-b border-gray-100 px-5 py-3">
          <span className="text-sm text-gray-500">Email</span>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!editing}
            className="max-w-sm border-gray-200"
          />
        </div>

        {/* Website */}
        <div className="grid grid-cols-[160px_1fr] items-center border-b border-gray-100 px-5 py-3">
          <span className="text-sm text-gray-500">Website</span>
          <Input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            disabled={!editing}
            className="max-w-sm border-gray-200"
          />
        </div>

        {/* Phone */}
        <div className="grid grid-cols-[160px_1fr] items-center border-b border-gray-100 px-5 py-3">
          <span className="text-sm text-gray-500">Phone</span>
          <div className="flex items-center gap-2 max-w-sm">
            <span className="text-sm text-gray-400">📞</span>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!editing}
              className="flex-1 border-gray-200"
            />
          </div>
        </div>

        {/* Price range */}
        <div className="grid grid-cols-[160px_1fr] items-center border-b border-gray-100 px-5 py-3">
          <span className="text-sm text-gray-500">Price range</span>
          <div className="flex flex-wrap items-center gap-3 max-w-md">
            {editing ? (
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-32 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="mid-range">Mid-range</SelectItem>
                  <SelectItem value="high-end">High-end</SelectItem>
                  <SelectItem value="fine-dining">Fine dining</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm text-gray-900 capitalize">
                {priceRange}
              </span>
            )}
            <span className="text-sm text-gray-500">From</span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-400">&euro;</span>
              <Input
                type="number"
                step="0.01"
                value={priceRangeFrom}
                onChange={(e) => setPriceRangeFrom(e.target.value)}
                disabled={!editing}
                className="w-24 border-gray-200"
                placeholder="0.00"
              />
            </div>
            <span className="text-sm text-gray-500">To</span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-400">&euro;</span>
              <Input
                type="number"
                step="0.01"
                value={priceRangeTo}
                onChange={(e) => setPriceRangeTo(e.target.value)}
                disabled={!editing}
                className="w-24 border-gray-200"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Guest sizes */}
        <div className="grid grid-cols-[160px_1fr] items-center border-b border-gray-100 px-5 py-3">
          <span className="text-sm text-gray-500">Guest sizes</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">From</span>
            <Input
              type="number"
              value={minGuestSize}
              onChange={(e) => setMinGuestSize(e.target.value)}
              disabled={!editing}
              className="w-20 border-gray-200"
            />
            <span className="text-sm text-gray-500">To</span>
            <Input
              type="number"
              value={maxGuestSize}
              onChange={(e) => setMaxGuestSize(e.target.value)}
              disabled={!editing}
              className="w-20 border-gray-200"
            />
          </div>
        </div>

        {/* Target audience */}
        <div className="grid grid-cols-[160px_1fr] items-start px-5 py-3">
          <span className="text-sm text-gray-500 pt-2">Target audience</span>
          <div className="max-w-md">
            <BadgeArrayField
              label=""
              values={targetAudience}
              onChange={setTargetAudience}
              editing={editing}
            />
          </div>
        </div>
      </div>

      {editing && (
        <div className="flex justify-end gap-3">
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
    </div>
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
    <div className="space-y-5">
      {/* Header with edit */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          Business Information
        </h2>
        <button
          onClick={() => (editing ? handleCancel() : setEditing(true))}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      {/* Logo */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">Logo</span>
        <div className="h-12 w-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
          {provider.logo ? (
            <img
              src={provider.logo as string}
              alt="Logo"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-gray-400 text-xs">Logo</span>
          )}
        </div>
        {editing && (
          <button className="text-xs text-orange-600 hover:text-orange-700 font-medium">
            Change logo
          </button>
        )}
      </div>

      {/* Form fields */}
      <div className="space-y-5">
        {/* About your company */}
        <div>
          <Label className="text-sm text-gray-500 mb-1.5 block">
            About your company
          </Label>
          <Textarea
            value={aboutCompany}
            onChange={(e) => setAboutCompany(e.target.value)}
            disabled={!editing}
            placeholder="Describe your company..."
            className="min-h-[80px] border-gray-200"
          />
        </div>

        {/* What is this business? */}
        <div>
          <Label className="text-sm text-gray-500 mb-1.5 block">
            What is the business?
          </Label>
          <Textarea
            value={whatIsThisBusiness}
            onChange={(e) => setWhatIsThisBusiness(e.target.value)}
            disabled={!editing}
            placeholder="what is this place?"
            className="min-h-[70px] border-gray-200"
          />
        </div>

        {/* What can I book here? */}
        <div>
          <Label className="text-sm text-gray-500 mb-1.5 block">
            What can I book here?
          </Label>
          <Textarea
            value={whatCanIBookHere}
            onChange={(e) => setWhatCanIBookHere(e.target.value)}
            disabled={!editing}
            placeholder="what can be booked?"
            className="min-h-[70px] border-gray-200"
          />
        </div>

        {/* When should I recommend this? */}
        <div>
          <Label className="text-sm text-gray-500 mb-1.5 block">
            When should I recommend this?
          </Label>
          <Textarea
            value={whenShouldRecommend}
            onChange={(e) => setWhenShouldRecommend(e.target.value)}
            disabled={!editing}
            placeholder="when/why should AI recommend it?"
            className="min-h-[70px] border-gray-200"
          />
        </div>

        {/* What can customers book here? */}
        <div>
          <Label className="text-sm text-gray-500 mb-1.5 block">
            What can customers book here?
          </Label>
          <BadgeArrayField
            label=""
            values={whatCanCustomersBook}
            onChange={setWhatCanCustomersBook}
            editing={editing}
          />
        </div>

        {/* What is this place best for? */}
        <div>
          <Label className="text-sm text-gray-500 mb-1.5 block">
            What is this place best for?
          </Label>
          <BadgeArrayField
            label=""
            values={bestFor}
            onChange={setBestFor}
            editing={editing}
          />
        </div>

        {/* Atmosphere / vibe */}
        <div>
          <Label className="text-sm text-gray-500 mb-1.5 block">
            What is this place best for?
          </Label>
          <div className="text-xs text-gray-400 mb-1">
            Atmosphere / vibe: Casual, Modern, Romantic, Trendy, Luxury, Traditional
          </div>
          <BadgeArrayField
            label=""
            values={atmosphere}
            onChange={setAtmosphere}
            editing={editing}
          />
        </div>

        {/* What makes this place unique? */}
        <div>
          <Label className="text-sm text-gray-500 mb-1.5 block">
            What makes this place unique?
          </Label>
          <Input
            value={whatMakesUnique}
            onChange={(e) => setWhatMakesUnique(e.target.value)}
            disabled={!editing}
            className="border-gray-200"
          />
        </div>

        {/* When should customers choose you? */}
        <div>
          <Label className="text-sm text-gray-500 mb-1.5 block">
            When should customers choose you?
          </Label>
          <Input
            value={whenShouldChoose}
            onChange={(e) => setWhenShouldChoose(e.target.value)}
            disabled={!editing}
            className="border-gray-200"
          />
        </div>

        {/* When should customers NOT choose you? */}
        <div>
          <Label className="text-sm text-gray-500 mb-1.5 block">
            When should customers NOT choose you?
          </Label>
          <Input
            value={whenShouldNotChoose}
            onChange={(e) => setWhenShouldNotChoose(e.target.value)}
            disabled={!editing}
            className="border-gray-200"
          />
        </div>

        {/* Most popular dishes */}
        <div>
          <Label className="text-sm text-gray-500 mb-1.5 block">
            What are your most popular dishes?
          </Label>
          <Textarea
            value={popularDishes}
            onChange={(e) => setPopularDishes(e.target.value)}
            disabled={!editing}
            className="min-h-[80px] border-gray-200"
          />
        </div>
      </div>

      {editing && (
        <div className="flex justify-end gap-3 pt-2">
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab 3 -- Opening Hours (read-only, data from Jimani)               */
/* ------------------------------------------------------------------ */

function OpeningHoursTab() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // Fetch opening hours for selected year/month
  const { data: apiHours, isLoading: hoursLoading } = useSWR<OpeningHourEntry[]>(
    `/api/providers/me/opening-hours?year=${selectedYear}&month=${selectedMonth}`,
    fetcher
  );

  // Generate all days for the month and merge with API data
  const allDays = generateDaysForMonth(selectedYear, selectedMonth);

  // Build lookup map from API data
  const hoursMap = new Map<
    string,
    { openTime: string; closeTime: string; isClosed: boolean }
  >();
  if (apiHours && Array.isArray(apiHours)) {
    for (const h of apiHours) {
      const dateKey = h.date.substring(0, 10);
      hoursMap.set(dateKey, {
        openTime: h.openTime || "",
        closeTime: h.closeTime || "",
        isClosed: h.isClosed,
      });
    }
  }

  const SHORT_MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-gray-900">Opening Hours</h2>

      {/* Year selector */}
      <div className="flex flex-wrap items-center gap-2">
        {[2025, 2026, 2027].map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedYear === year
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Month selector */}
      <div className="flex flex-wrap gap-2">
        {SHORT_MONTHS.map((month, idx) => (
          <button
            key={month}
            onClick={() => setSelectedMonth(idx)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedMonth === idx
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {month}
          </button>
        ))}
      </div>

      {/* Table */}
      {hoursLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading opening hours...
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_120px_120px] px-5 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
            <span>Datum</span>
            <span>Open van</span>
            <span>Open tot</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {allDays.map((day) => {
              const entry = hoursMap.get(day.date);
              const isClosed = !entry || entry.isClosed;

              return (
                <div
                  key={day.date}
                  className={`grid grid-cols-[1fr_120px_120px] px-5 py-2.5 items-center text-sm ${
                    isClosed ? "text-gray-400" : "text-gray-900"
                  }`}
                >
                  <span>
                    <span className="font-medium lowercase">
                      {day.dayName.toLowerCase()}
                    </span>{" "}
                    <span className="text-gray-500">
                      {parseInt(day.date.split("-")[2])}{" "}
                      {MONTHS[parseInt(day.date.split("-")[1]) - 1]?.toLowerCase()}
                    </span>
                  </span>

                  {isClosed ? (
                    <>
                      <span className="italic text-gray-400">closed</span>
                      <span />
                    </>
                  ) : (
                    <>
                      <span>{entry!.openTime}</span>
                      <span>{entry!.closeTime}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Read-only notice */}
      <p className="text-xs text-gray-400 text-center">
        Opening hours are synced from Jimani and cannot be edited here.
      </p>
    </div>
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

  const [activeTab, setActiveTab] = useState<"standard" | "business" | "hours">(
    "standard"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Underline tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {[
            { key: "standard" as const, label: "Standard information" },
            { key: "business" as const, label: "Business information" },
            { key: "hours" as const, label: "Opening hours" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Jimani banner */}
      <JimaniBanner provider={provider} />

      {/* Tab content */}
      {activeTab === "standard" && (
        <StandardInformationTab provider={provider} mutate={mutate} />
      )}
      {activeTab === "business" && (
        <BusinessInformationTab provider={provider} mutate={mutate} />
      )}
      {activeTab === "hours" && <OpeningHoursTab />}
    </div>
  );
}
