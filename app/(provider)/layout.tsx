'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronDown, Menu, X, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import useSWR from 'swr';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) return null;
  return r.json();
};

const navItems = [
  { href: '/overview', label: 'Dashboard' },
  { href: '/reservations', label: 'Reservations' },
  { href: '/booking-types', label: 'Booking types' },
  { href: '/settings', label: 'Settings' },
];

function ProviderNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const { data: provider } = useSWR('/api/providers/me', fetcher);

  const providerName = provider?.name || session?.user?.name || 'My Restaurant';
  const userImage = session?.user?.image;

  async function handleSignOut() {
    await nextAuthSignOut({ callbackUrl: '/sign-in' });
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/overview" className="flex items-center gap-2">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-orange-500 text-white font-bold text-sm">
              ai
            </div>
            <span className="text-xl font-bold text-gray-900">AiBooker</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-orange-600 border-b-2 border-orange-500'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userImage || undefined} alt={providerName} />
                    <AvatarFallback className="text-xs bg-orange-100 text-orange-700">
                      {providerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium max-w-[150px] truncate">{providerName}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/pricing">Billing</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="md:hidden pb-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="border-t border-gray-200 mt-2 pt-2">
              <Link
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Billing
              </Link>
              <button
                onClick={() => { setMobileOpen(false); handleSignOut(); }}
                className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: provider, isLoading } = useSWR('/api/providers/me', fetcher);

  const isOnboarding = pathname === '/onboarding';

  useEffect(() => {
    if (!isLoading && !provider && !isOnboarding) {
      router.replace('/onboarding');
    }
  }, [isLoading, provider, isOnboarding, router]);

  // While loading, show nothing to prevent flash
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  // If no provider and not on onboarding, don't render (redirect is happening)
  if (!provider && !isOnboarding) {
    return null;
  }

  // On the onboarding page, show a minimal layout (no nav)
  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-orange-500 text-white font-bold text-sm">
                  ai
                </div>
                <span className="text-xl font-bold text-gray-900">AiBooker</span>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProviderNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
