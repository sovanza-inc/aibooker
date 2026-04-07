'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Key,
  Users,
  CalendarCheck,
  UsersRound,
  Activity,
  Webhook,
  LogOut,
} from 'lucide-react';

const navSections = [
  {
    label: 'Main',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/providers', label: 'Providers', icon: Building2 },
      { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
    ],
  },
  {
    label: 'Management',
    items: [
      { href: '/admin/teams', label: 'Teams', icon: UsersRound },
      { href: '/admin/integrations', label: 'Integrations', icon: Key },
      { href: '/admin/webhooks', label: 'Webhook Logs', icon: Webhook },
      { href: '/admin/activity', label: 'Activity Logs', icon: Activity },
    ],
  },
];

const allItems = navSections.flatMap((s) => s.items);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  const currentPage = allItems.find((i) => isActive(i.href))?.label || 'Admin Panel';

  const sidebar = (
    <>
      <div className="h-16 flex items-center gap-2 px-6 border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-orange-500 text-white font-bold text-sm">
          ai
        </div>
        <span className="text-lg font-bold text-gray-900">Admin</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-orange-50 text-orange-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 shrink-0">
        <Link
          href="/sign-in"
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Link>
        <p className="text-[10px] text-gray-400 mt-2 px-3">Sovanza Internal</p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col fixed inset-y-0 left-0 z-30">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-50">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-8 gap-3 sticky top-0 z-20">
          <button
            className="md:hidden p-1.5 rounded-md text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileOpen(true)}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{currentPage}</h1>
        </header>
        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
