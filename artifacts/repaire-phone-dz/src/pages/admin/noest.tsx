import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, Truck, RefreshCw, Printer, XCircle, Search,
  CheckCircle2, AlertTriangle, ExternalLink, MapPin, Phone, Calendar,
  RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// ── Delivery status config ────────────────────────────────────────────────────

const DELIVERY_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  sent_to_noest:   { label: 'Envoyé à NOEST',      color: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-400',     icon: <Truck className="h-3 w-3" /> },
  en_preparation:  { label: 'En préparation',       color: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-400', icon: <Package className="h-3 w-3" /> },
  expedie:         { label: 'Expédié',              color: 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-400', icon: <Truck className="h-3 w-3" /> },
  en_transit:      { label: 'En transit',           color: 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/40 dark:text-cyan-400',       icon: <Truck className="h-3 w-3" /> },
  en_livraison:    { label: 'En livraison',         color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-400',  icon: <Truck className="h-3 w-3" /> },
  livre:           { label: 'Livré',                color: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400', icon: <CheckCircle2 className="h-3 w-3" /> },
  echec_livraison: { label: 'Échec de livraison',   color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-400',           icon: <XCircle className="h-3 w-3" /> },
  retour:          { label: 'Retour',               color: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-400', icon: <RotateCcw className="h-3 w-3" /> },
  annule:          { label: 'Annulé',               color: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400',          icon: <XCircle className="h-3 w-3" /> },
};

function DeliveryBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline" className="text-xs text-muted-foreground">Non envoyé</Badge>;
  const cfg = DELIVERY_STATUS[status];
  if (!cfg) return <Badge variant="outline" className="text-xs">{status}</Badge>;
  return (
    <Badge variant="outline" className={cn('gap-1 text-xs font-semibold', cfg.color)}>
      {cfg.icon} {cfg.label}
    </Badge>
  );
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd/MM/yy HH:mm', { locale: fr }); } catch { return d; }
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiFetch(method: string, path: string, body?: unknown) {
  const res = await fetch(`/api/admin/noest${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
  return data;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminNoest() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['noest', 'shipments'],
    queryFn: () => apiFetch('GET', '/shipments'),
    refetchInterval: 5 * 60_000, // auto-refresh every 5 min
  });

  const syncAll = useMutation({
    mutationFn: () => apiFetch('POST', '/sync-all'),
    onSuccess: (data) => {
      toast.success(`Synchronisation terminée — ${data.updated} mises à jour`);
      queryClient.invalidateQueries({ queryKey: ['noest'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const syncOne = useMutation({
    mutationFn: (orderId: number) => apiFetch('POST', `/shipments/${orderId}/sync`),
    onSuccess: (data) => {
      toast.success(`Statut mis à jour → ${DELIVERY_STATUS[data.status]?.label ?? data.status}`);
      queryClient.invalidateQueries({ queryKey: ['noest'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const cancelShipment = useMutation({
    mutationFn: (orderId: number) => apiFetch('DELETE', `/shipments/${orderId}`),
    onSuccess: (data) => {
      toast.success(data.message ?? 'Expédition annulée');
      queryClient.invalidateQueries({ queryKey: ['noest'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const printLabel = (orderId: number) => {
    window.open(`/api/admin/noest/shipments/${orderId}/label`, '_blank');
  };

  const FINAL_STATUSES = ['livre', 'retour', 'annule'];

  const filtered = (shipments as any[]).filter((s: any) => {
    const addr = s.shippingAddress ?? {};
    const q = search.toLowerCase();
    const matchSearch = !q ||
      String(s.id).includes(q) ||
      (addr.fullName ?? '').toLowerCase().includes(q) ||
      (addr.phone ?? '').includes(q) ||
      (s.trackingNumber ?? '').toLowerCase().includes(q) ||
      (addr.wilaya ?? '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || s.deliveryStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const alerts = (shipments as any[]).filter(
    (s: any) => s.deliveryStatus === 'echec_livraison' || s.deliveryStatus === 'retour'
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" /> Livraisons NOEST Express
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {(shipments as any[]).length} expédition{(shipments as any[]).length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <Button
          onClick={() => syncAll.mutate()}
          disabled={syncAll.isPending}
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', syncAll.isPending && 'animate-spin')} />
          {syncAll.isPending ? 'Synchronisation…' : 'Tout synchroniser'}
        </Button>
      </div>

      {/* Alerts: failures & returns */}
      {alerts.length > 0 && (
        <div className="border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {alerts.length} expédition{alerts.length > 1 ? 's' : ''} nécessitent attention
          </p>
          <div className="flex flex-wrap gap-2">
            {alerts.map((s: any) => (
              <span key={s.id} className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-md">
                #{s.id} — {(s.shippingAddress as any)?.fullName ?? '—'} — <DeliveryBadge status={s.deliveryStatus} />
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="N° commande, client, tracking…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          <option value="all">Tous les statuts</option>
          {Object.entries(DELIVERY_STATUS).map(([value, cfg]) => (
            <option key={value} value={value}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card className="shadow-sm border-border overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Aucune expédition trouvée</p>
              <p className="text-sm mt-1">Envoyez des commandes à NOEST depuis le détail d'une commande</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/20 border-b border-border text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Commande</th>
                    <th className="px-4 py-3 text-left font-medium">Client</th>
                    <th className="px-4 py-3 text-left font-medium">Wilaya</th>
                    <th className="px-4 py-3 text-left font-medium">Tracking</th>
                    <th className="px-4 py-3 text-right font-medium">Montant</th>
                    <th className="px-4 py-3 text-left font-medium">Statut livraison</th>
                    <th className="px-4 py-3 text-left font-medium">Envoyé le</th>
                    <th className="px-4 py-3 text-left font-medium">Dernière sync</th>
                    <th className="px-4 py-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((s: any) => {
                    const addr = s.shippingAddress ?? {};
                    const isFinal = FINAL_STATUSES.includes(s.deliveryStatus ?? '');
                    return (
                      <tr
                        key={s.id}
                        className={cn(
                          'hover:bg-muted/30 transition-colors',
                          s.deliveryStatus === 'echec_livraison' && 'bg-red-50/40 dark:bg-red-950/10',
                          s.deliveryStatus === 'retour' && 'bg-orange-50/40 dark:bg-orange-950/10',
                          s.deliveryStatus === 'livre' && 'bg-emerald-50/40 dark:bg-emerald-950/10',
                        )}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-foreground">#{s.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{addr.fullName ?? (s.userName ?? 'Invité')}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {addr.phone ?? '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="flex items-center gap-1 text-xs">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {addr.wilaya ?? '—'}
                          </p>
                          {addr.commune && <p className="text-xs text-muted-foreground">{addr.commune}</p>}
                        </td>
                        <td className="px-4 py-3">
                          {s.trackingNumber ? (
                            <div className="flex items-center gap-1">
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{s.trackingNumber}</code>
                              {s.trackingUrl && (
                                <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-foreground">
                          {Number(s.total).toLocaleString('fr-DZ')} DA
                        </td>
                        <td className="px-4 py-3">
                          <DeliveryBadge status={s.deliveryStatus} />
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(s.sentToCarrierAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {formatDate(s.lastTrackingSyncAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-center">
                            {/* Sync */}
                            {!isFinal && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                title="Mettre à jour le statut"
                                onClick={() => syncOne.mutate(s.id)}
                                disabled={syncOne.isPending}
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            )}
                            {/* Print label */}
                            {s.noestShipmentId && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                title="Imprimer le bordereau"
                                onClick={() => printLabel(s.id)}
                              >
                                <Printer className="h-3 w-3" />
                              </Button>
                            )}
                            {/* Cancel */}
                            {!isFinal && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Annuler l'expédition"
                                onClick={() => {
                                  if (confirm(`Annuler l'expédition pour la commande #${s.id} ?`)) {
                                    cancelShipment.mutate(s.id);
                                  }
                                }}
                                disabled={cancelShipment.isPending}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {(shipments as any[]).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(DELIVERY_STATUS).map(([key, cfg]) => {
            const count = (shipments as any[]).filter((s: any) => s.deliveryStatus === key).length;
            if (!count) return null;
            return (
              <Card key={key} className="shadow-sm border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', cfg.color)}>{cfg.icon}</div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground">{cfg.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
