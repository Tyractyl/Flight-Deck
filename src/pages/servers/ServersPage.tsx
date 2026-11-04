import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listServers, startServer, stopServer, restartServer } from '../../api/servers';
import { queryKeys } from '../../api/queryKeys';
import { Skeleton } from '@/components/ui/Skeleton';
import { sileo } from 'sileo';
import { Play, Square, RotateCw } from 'lucide-react';
import Button from '../../components/Button';
import { formatMemory } from '../../utils/formatMemory';
import { DataTable } from '../../components/DataTable';
import { listAuditLogs } from '../../api/audit';
import type { AuditLog } from '../../api/audit';
import { PlaceholderPattern } from '../../components/ui/PlaceholderPattern';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon } from '@hugeicons/core-free-icons';
import { useCreateServerDialog } from '../../store/createServerStore';

function StatusIndicator({ status }: { status: string }) {
  return (
    <span className="text-xs text-[var(--fg-muted)]">
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </span>
  );
}

function formatTimestamp(value: string | null): { absolute: string; relative: string } {
  if (!value) return { absolute: 'Unknown', relative: 'Unknown' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { absolute: value, relative: value };
  const absolute = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  const diffMin = Math.round((date.getTime() - Date.now()) / 60000);
  const absDiffMin = Math.abs(diffMin);
  if (absDiffMin < 60) return { absolute, relative: `${Math.abs(diffMin)}m${diffMin <= 0 ? ' ago' : ''}` };
  const diffHr = Math.round(diffMin / 60);
  if (absDiffMin < 1440) return { absolute, relative: `${Math.abs(diffHr)}h${diffHr <= 0 ? ' ago' : ''}` };
  const diffDay = Math.round(diffHr / 24);
  return { absolute, relative: `${Math.abs(diffDay)}d${diffDay <= 0 ? ' ago' : ''}` };
}

function deviceLabel(userAgent: string | null): string {
  const agent = userAgent?.toLowerCase() ?? '';
  if (agent.includes('iphone') || agent.includes('android') || agent.includes('mobile')) return 'Mobile device';
  if (agent.includes('ipad') || agent.includes('tablet')) return 'Tablet';
  return 'Desktop browser';
}

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    'auth.login': 'Logged in', 'auth.register': 'Registered', 'auth.logout': 'Logged out',
    'server.create': 'Created a server', 'server.delete': 'Deleted a server',
    'server.start': 'Started a server', 'server.stop': 'Stopped a server', 'server.restart': 'Restarted a server',
    'coins.transfer': 'Transferred coins', 'coins.admin_grant': 'Coins granted',
  };
  return labels[action] || action.replace(/\\./g, ' ').replace(/\\b\\w/g, (c) => c.toUpperCase());
}

function RecentActivity() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.audit.all,
    queryFn: () => listAuditLogs(1, 10),
  });

  const logs = data?.items || [];
  const displayed = logs.slice(0, 5);

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-[var(--fg)]">Recent activity</h3>
        {logs.length > 5 && (
          <button type="button" onClick={() => navigate('/admin/activity')}
            className="text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">View all</button>
        )}
      </div>
      <div className="overflow-hidden rounded-2xl border-[1.5px] border-border bg-muted/80 shadow-sm">
        <div className="relative flex items-center gap-3 px-4 py-2.5">
          <span className="w-[42%] shrink-0 text-xs font-medium text-muted-foreground">Activity</span>
          <span className="w-[20%] shrink-0 text-xs font-medium text-muted-foreground">Device</span>
          <span className="flex-1 text-xs font-medium text-muted-foreground">Time</span>
        </div>
        <div className="overflow-hidden rounded-xl bg-background">
          <div className="flex flex-col gap-1 p-1">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)
            ) : displayed.length > 0 ? (
              displayed.map((log: AuditLog) => {
                const timestamp = formatTimestamp(log.created_at);
                return (
                  <button key={log.id} type="button"
                    className="group relative overflow-hidden rounded-md text-left transition-colors duration-150 ease-out hover:bg-muted/40">
                    <PlaceholderPattern patternSize={6}
                      className="absolute inset-0 size-full stroke-neutral-900/10 opacity-0 transition-opacity group-hover:opacity-100 dark:stroke-neutral-100/10" />
                    <div className="relative flex items-center gap-3 px-3 py-3 transition-transform duration-150 ease-out active:scale-[0.99] active:duration-0">
                      <div className="w-[42%] shrink-0 pr-4">
                        <p className="truncate text-sm font-medium text-[var(--fg)]">{actionLabel(log.action)}</p>
                      </div>
                      <div className="w-[20%] shrink-0 pr-4">
                        <p className="truncate text-xs text-muted-foreground">{deviceLabel(log.user_agent)}</p>
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-sm text-[var(--fg)]">{timestamp.relative}</p>
                        <p className="truncate text-xs text-muted-foreground">{timestamp.absolute}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-12 text-center">
                <p className="text-sm font-medium text-[var(--fg)]">No activity yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Sign-ins and account changes appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const openDialog = useCreateServerDialog((s) => s.openDialog);


  const { data: servers, isLoading } = useQuery({
    queryKey: queryKeys.servers.all,
    queryFn: listServers,
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => startServer(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.servers.all }); sileo.success({ description: 'Server starting...', icon: false }); },
    onError: () => sileo.error({ description: 'Failed to start server', icon: false }),
  });

  const stopMutation = useMutation({
    mutationFn: (id: string) => stopServer(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.servers.all }); sileo.success({ description: 'Server stopping...', icon: false }); },
    onError: () => sileo.error({ description: 'Failed to stop server', icon: false }),
  });

  const restartMutation = useMutation({
    mutationFn: (id: string) => restartServer(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.servers.all }); sileo.success({ description: 'Server restarting...', icon: false }); },
    onError: () => sileo.error({ description: 'Failed to restart server', icon: false }),
  });

  const serverList = Array.isArray(servers) ? servers : [];
  const filteredServers = serverList.filter((server) =>
    server.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--fg)]">Servers</h1>
          <p className="text-sm text-[var(--fg-muted)] mt-1">
            A list of all servers that you own or have access to.
          </p>
        </div>
        <Button onClick={openDialog}>
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          New server
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 rounded-lg" />
      ) : (
        <>
          <DataTable
            data={filteredServers}
            columns={[
              {
                label: 'Name',
                width: 'flex-1 min-w-[180px]',
                render: (server) => (
                  <div className="flex min-w-0 flex-col justify-center">
                    <p className="text-sm font-medium text-[var(--fg)] truncate">{server.name}</p>
                    <StatusIndicator status={server.status} />
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        const ip = server.port_bindings?.[0] ? `0.0.0.0:${server.port_bindings[0].host_port}` : null;
                        if (ip) {
                          navigator.clipboard.writeText(ip);
                          sileo.success({ description: 'IP copied to clipboard', icon: false });
                        }
                      }}
                      className="group mt-px inline-flex w-fit cursor-pointer items-center gap-1 text-xs text-[var(--fg-muted)] font-mono hover:text-[var(--fg)] transition-colors"
                      title="Click to copy"
                    >
                      {server.port_bindings?.[0] ? `0.0.0.0:${server.port_bindings[0].host_port}` : 'No allocation'}
                      {server.port_bindings?.[0] && (
                        <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                          </svg>
                        </span>
                      )}
                    </span>
                  </div>
                ),
              },
              {
                label: 'Memory',
                width: 'w-28',
                render: (server) => <p className="text-sm text-[var(--fg)]">{formatMemory(server.memory_mb)}</p>,
              },
              {
                label: 'CPU',
                width: 'w-20',
                render: (server) => <p className="text-sm text-[var(--fg)]">{server.cpu_percent}%</p>,
              },
              {
                label: 'Node',
                width: 'w-28',
                render: (server) => <p className="text-sm text-[var(--fg)] truncate">{server.node_name || '—'}</p>,
              },
              {
                label: 'Actions',
                width: 'w-24',
                render: (server) => {
                  const isRunning = server.status === 'RUNNING' || server.status === 'STARTING';
                  return (
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      {isRunning ? (
                        <>
                          <button type="button" onClick={() => stopMutation.mutate(server.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--fg-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--fg)] transition-colors" title="Stop">
                            <Square size={14} fill="currentColor" />
                          </button>
                          <button type="button" onClick={() => restartMutation.mutate(server.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--fg-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--fg)] transition-colors" title="Restart">
                            <RotateCw size={14} />
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={() => startMutation.mutate(server.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--fg-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--fg)] transition-colors" title="Start">
                          <Play size={14} fill="currentColor" />
                        </button>
                      )}
                    </div>
                  );
                },
              },
            ]}
            searchValue={search}
            onSearch={setSearch}
            onRowClick={(server) => navigate(`/servers/${server.id}`)}
            emptyMessage="No servers found"
            emptySearchMessage="Try a different server name."
            entityName="server"
            selectable={false}
          />

          {/* Recent activity */}
          <RecentActivity />
        </>
      )}

    </div>
  );
}
