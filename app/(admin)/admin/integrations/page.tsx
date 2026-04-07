'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Copy, Check } from 'lucide-react';

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) return [];
  return r.json();
};

interface ApiKeyRow {
  id: number;
  providerName: string;
  source: string;
  apiKey: string;
  status: string;
  createdAt: string;
}

function maskKey(key: string) {
  if (!key || key.length <= 8) return '****';
  return key.slice(0, 4) + '****' + key.slice(-4);
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    suspended: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 w-7 p-0">
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
    </Button>
  );
}

export default function AdminIntegrationsPage() {
  const { data, isLoading } = useSWR<ApiKeyRow[]>('/api/admin/api-keys', fetcher);
  const keys = data || [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Integrations</h2>
        <p className="text-sm text-gray-500 mt-1">API keys and partner integrations</p>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-orange-500 border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Provider</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Source</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide">API Key</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Status</TableHead>
                    <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wide hidden sm:table-cell">Created</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-400 py-12 text-sm">No integrations found</TableCell>
                    </TableRow>
                  ) : (
                    keys.map((k) => (
                      <TableRow key={k.id} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium text-sm text-gray-900">{k.providerName}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded bg-orange-100 text-orange-700">
                            {k.source}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-gray-500 max-w-[120px] truncate">{maskKey(k.apiKey)}</TableCell>
                        <TableCell><StatusBadge status={k.status} /></TableCell>
                        <TableCell className="text-sm text-gray-500 hidden sm:table-cell">{new Date(k.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell><CopyButton value={k.apiKey} /></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
