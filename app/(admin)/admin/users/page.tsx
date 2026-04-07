'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) return { users: [], total: 0, page: 1, totalPages: 1 };
  return r.json();
};

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    partner: 'bg-purple-100 text-purple-700',
    provider: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full ${colors[role] || 'bg-gray-100 text-gray-600'}`}>
      {role}
    </span>
  );
}

function AuthBadge({ provider }: { provider: string | null }) {
  if (!provider) return <span className="text-gray-300 text-xs">—</span>;
  const colors: Record<string, string> = {
    google: 'bg-blue-50 text-blue-600',
    credentials: 'bg-gray-50 text-gray-600',
    github: 'bg-gray-800 text-white',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded ${colors[provider] || 'bg-gray-100 text-gray-600'}`}>
      {provider}
    </span>
  );
}

interface UserRow {
  id: number;
  name: string | null;
  email: string;
  role: string;
  authProvider: string | null;
  image: string | null;
  createdAt: string;
  deletedAt: string | null;
  teamName: string | null;
}

function Pagination({ page, totalPages, total, label, onPrev, onNext }: {
  page: number; totalPages: number; total: number; label: string;
  onPrev: () => void; onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
      <p className="text-xs text-gray-500">Page {page} of {totalPages} &middot; {total} {label}</p>
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={onPrev} className="h-7 w-7 p-0">
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={onNext} className="h-7 w-7 p-0">
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-orange-500 border-t-transparent" />
    </div>
  );
}

function EmptyState({ cols, message }: { cols: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} className="text-center text-gray-400 py-12 text-sm">
        {message}
      </TableCell>
    </TableRow>
  );
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editingRole, setEditingRole] = useState<{ id: number; role: string } | null>(null);

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (roleFilter) params.set('role', roleFilter);
  params.set('page', String(page));

  const { data, isLoading, mutate } = useSWR(`/api/admin/users?${params}`, fetcher);
  const users: UserRow[] = data?.users || [];
  const totalPages = data?.totalPages || 1;

  async function handleRoleChange(userId: number, newRole: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) { setEditingRole(null); mutate(); }
    } catch {}
  }

  async function handleSoftDelete(userId: number) {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (res.ok) mutate();
    } catch {}
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
        <p className="text-sm text-gray-500 mt-1">Manage all platform users and roles</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white h-9"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="partner">Partner</option>
          <option value="provider">Provider</option>
        </select>
        {(search || roleFilter) && (
          <Button variant="ghost" size="sm" className="h-9 text-xs text-gray-500" onClick={() => { setSearch(''); setRoleFilter(''); setPage(1); }}>
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? <LoadingSpinner /> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide">User</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Role</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide hidden sm:table-cell">Auth</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide hidden md:table-cell">Team</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide hidden sm:table-cell">Joined</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide hidden md:table-cell">Status</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? <EmptyState cols={7} message="No users found" /> : (
                    users.map((u) => (
                      <TableRow key={u.id} className={`hover:bg-gray-50/50 ${u.deletedAt ? 'opacity-50' : ''}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {u.image ? (
                              <img src={u.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold flex-shrink-0">
                                {(u.name || u.email)[0]?.toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{u.name || '—'}</p>
                              <p className="text-xs text-gray-500 truncate">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingRole?.id === u.id ? (
                            <select
                              value={editingRole.role}
                              onChange={(e) => setEditingRole({ id: u.id, role: e.target.value })}
                              onBlur={() => handleRoleChange(u.id, editingRole.role)}
                              autoFocus
                              className="border rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                            >
                              <option value="admin">admin</option>
                              <option value="partner">partner</option>
                              <option value="provider">provider</option>
                            </select>
                          ) : (
                            <button onClick={() => setEditingRole({ id: u.id, role: u.role })} className="cursor-pointer hover:opacity-80">
                              <RoleBadge role={u.role} />
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell"><AuthBadge provider={u.authProvider} /></TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-gray-600">{u.teamName || '—'}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {u.deletedAt ? (
                            <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full bg-red-100 text-red-600">Deactivated</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full bg-green-100 text-green-600">Active</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!u.deletedAt && (
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs h-7 px-2" onClick={() => handleSoftDelete(u.id)}>
                              Deactivate
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} total={data?.total || 0} label="users" onPrev={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />
        </CardContent>
      </Card>
    </div>
  );
}
