import { useState, useMemo } from 'react';
import { useListAllOrders, useUpdateOrderStatus } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Filter, ArrowUpDown, ChevronDown, CheckSquare, Square, Printer, Download, MapPin, User, Package, Calendar, Link } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { getListAllOrdersQueryKey } from '@workspace/api-client-react';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente', color: 'bg-warning/10 text-warning-foreground border-warning/20' },
  { value: 'confirmed', label: 'Confirmée', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  { value: 'processing', label: 'En préparation', color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  { value: 'shipped', label: 'Expédiée', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200' },
  { value: 'delivered', label: 'Livrée', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
  { value: 'cancelled', label: 'Annulée', color: 'bg-destructive/10 text-destructive border-destructive/20' },
];

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
  
  const queryClient = useQueryClient();
  
  const queryParams = {
    page,
    limit,
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  };
  
  const { data: ordersData, isLoading } = useListAllOrders(queryParams, { query: { queryKey: getListAllOrdersQueryKey(queryParams) } });

  const updateStatus = useUpdateOrderStatus();

  const handleUpdateStatus = async (orderId: number, newStatus: any) => {
    try {
      await updateStatus.mutateAsync({ id: orderId, data: { status: newStatus } });
      toast.success('Statut mis à jour');
      // Invalidate the cache to refresh data, or optimistically update it
      queryClient.invalidateQueries({ queryKey: getListAllOrdersQueryKey() });
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err: any) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_OPTIONS.find(s => s.value === status);
    if (!config) return <Badge variant="outline" className="uppercase text-[10px]">{status}</Badge>;
    return <Badge variant="outline" className={`uppercase text-[10px] px-2 py-0.5 font-bold tracking-wider ${config.color}`}>{config.label}</Badge>;
  };

  const toggleRowSelection = (id: number) => {
    const newSet = new Set(selectedRowIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRowIds(newSet);
  };

  const toggleAllSelection = () => {
    if (selectedRowIds.size === ordersData?.orders?.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(ordersData?.orders?.map(o => o.id) || []));
    }
  };

  const exportCSV = () => {
    if (!ordersData?.orders?.length) return;
    
    // Create CSV content
    const headers = ['ID', 'Date', 'Client', 'Email', 'Téléphone', 'Statut', 'Total (DA)'];
    const rows = ordersData.orders.map(o => [
      o.id,
      format(new Date(o.createdAt), 'dd/MM/yyyy HH:mm'),
      `"${o.userName || 'Client invité'}"`,
      `"${o.userEmail || ''}"`,
      `"${o.shippingAddress?.phone || ''}"`,
      o.status,
      o.total
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `commandes_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printOrder = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Commandes</h2>
          <p className="text-muted-foreground text-sm">Gérez les commandes, expéditions et statuts de paiement.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="shadow-sm" onClick={exportCSV} disabled={!ordersData?.orders?.length}>
            <Download className="mr-2 h-4 w-4" /> Exporter (CSV)
          </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher par ID commande, nom ou email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background shadow-sm border-border h-9"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">Statut:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px] h-9 bg-background shadow-sm">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {STATUS_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {selectedRowIds.size > 0 && (
          <div className="bg-primary/5 border-b border-border px-4 py-2 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-medium text-primary">{selectedRowIds.size} sélectionné(s)</span>
            <div className="flex gap-2">
              <Select onValueChange={(val) => {
                Promise.all(Array.from(selectedRowIds).map(id => handleUpdateStatus(id, val)))
                  .then(() => { setSelectedRowIds(new Set()); });
              }}>
                <SelectTrigger className="h-8 w-[160px] text-xs">
                  <SelectValue placeholder="Changer statut" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-8 text-xs text-destructive hover:bg-destructive/10" onClick={() => setSelectedRowIds(new Set())}>
                Annuler
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border sticky top-0">
              <tr>
                <th className="px-4 py-3 w-[40px]">
                  <button onClick={toggleAllSelection} className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none">
                    {selectedRowIds.size === ordersData?.orders?.length && ordersData?.orders?.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : selectedRowIds.size > 0 ? (
                      <div className="relative h-4 w-4 border rounded bg-primary border-primary flex items-center justify-center">
                        <div className="h-0.5 w-2 bg-primary-foreground rounded-full"></div>
                      </div>
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold w-[100px]">ID</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Date & Heure</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array(10).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-4" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-40 mt-1" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="px-4 py-4 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : ordersData?.orders?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Package className="h-12 w-12 mb-4 text-muted-foreground/30" />
                      <p className="text-lg font-medium text-foreground">Aucune commande trouvée</p>
                      <p className="text-sm">Essayez de modifier vos filtres ou termes de recherche.</p>
                    </div>
                  </td>
                </tr>
              ) : ordersData?.orders.map((order) => (
                <tr key={order.id} className={`hover:bg-muted/30 transition-colors ${selectedRowIds.has(order.id) ? 'bg-primary/5' : ''}`}>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleRowSelection(order.id)} className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none">
                      {selectedRowIds.has(order.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-bold text-foreground">
                    <button onClick={() => setSelectedOrder(order)} className="hover:text-primary hover:underline">
                      #{order.id}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{order.userName || 'Client invité'}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      {order.userEmail}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">
                    {format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm', { locale: fr })}
                  </td>
                  <td className="px-4 py-3 font-bold text-foreground">
                    {order.total.toLocaleString('fr-DZ')} DA
                  </td>
                  <td className="px-4 py-3">
                    <Select value={order.status} onValueChange={(val) => handleUpdateStatus(order.id, val)}>
                      <SelectTrigger className="h-7 w-[140px] text-xs px-2 shadow-none border-transparent hover:border-border bg-transparent focus:ring-0 focus:ring-offset-0">
                        {getStatusBadge(order.status)}
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => setSelectedOrder(order)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {ordersData && ordersData.totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between bg-muted/10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Afficher</span>
              <Select value={limit.toString()} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-8 w-[70px] bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>par page</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                Page {page} sur {ordersData.totalPages} ({ordersData.total} au total)
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8">
                  Précédent
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(ordersData.totalPages, p + 1))} disabled={page === ordersData.totalPages} className="h-8">
                  Suivant
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Order Detail Drawer/Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-background print:max-h-none print:h-auto print:block">
          {selectedOrder && (
            <>
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/10 print:hidden shrink-0">
                <div>
                  <DialogTitle className="text-xl flex items-center gap-3">
                    Commande #{selectedOrder.id}
                    {getStatusBadge(selectedOrder.status)}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    Passée le {format(new Date(selectedOrder.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={printOrder} className="h-9">
                    <Printer className="h-4 w-4 mr-2" /> Imprimer
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-muted/5 print:p-0 print:bg-white print:overflow-visible">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Items */}
                  <div className="md:col-span-2 space-y-6">
                    <Card className="shadow-sm border-border print:border-none print:shadow-none">
                      <CardHeader className="py-4 border-b border-border bg-muted/20 print:bg-transparent print:border-b-2 print:border-black">
                        <CardTitle className="text-base font-semibold">Articles commandés ({selectedOrder.items?.length || 0})</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/10 border-b border-border text-muted-foreground print:bg-transparent">
                            <tr>
                              <th className="px-4 py-3 text-left font-medium">Produit</th>
                              <th className="px-4 py-3 text-center font-medium">Prix unit.</th>
                              <th className="px-4 py-3 text-center font-medium">Qte</th>
                              <th className="px-4 py-3 text-right font-medium">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {selectedOrder.items?.map((item: any, i: number) => (
                              <tr key={i} className="group">
                                <td className="px-4 py-3 flex items-center gap-3">
                                  <div className="h-12 w-12 rounded bg-muted p-1 flex items-center justify-center shrink-0 border border-border print:hidden">
                                    <img src={item.images?.[0] || 'https://placehold.co/40'} alt="" className="max-h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                                  </div>
                                  <div>
                                    <span className="font-semibold text-foreground line-clamp-2">{item.name}</span>
                                    <span className="text-xs text-muted-foreground mt-1 block">ID: {item.productId}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center text-muted-foreground">{item.price.toLocaleString('fr-DZ')} DA</td>
                                <td className="px-4 py-3 text-center font-medium">x{item.quantity}</td>
                                <td className="px-4 py-3 text-right font-bold text-foreground">{(item.price * item.quantity).toLocaleString('fr-DZ')} DA</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm border-border print:border-none print:shadow-none">
                      <CardContent className="p-0">
                        <div className="bg-card p-6 space-y-3 text-sm">
                          <div className="flex justify-between text-muted-foreground items-center">
                            <span>Sous-total ({selectedOrder.items?.reduce((acc: number, item: any) => acc + item.quantity, 0)} articles)</span>
                            <span className="font-medium text-foreground">{selectedOrder.subtotal.toLocaleString('fr-DZ')} DA</span>
                          </div>
                          {selectedOrder.discount > 0 && (
                            <div className="flex justify-between text-secondary items-center bg-secondary/5 -mx-6 px-6 py-2 border-y border-secondary/10">
                              <span className="flex items-center gap-1 font-medium">
                                Remise {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ''}
                              </span>
                              <span className="font-bold">-{selectedOrder.discount.toLocaleString('fr-DZ')} DA</span>
                            </div>
                          )}
                          <div className="flex justify-between text-muted-foreground items-center">
                            <span>Frais de livraison</span>
                            <span className="font-medium text-foreground">{selectedOrder.shipping === 0 ? 'Gratuite' : `${selectedOrder.shipping?.toLocaleString('fr-DZ')} DA`}</span>
                          </div>
                          <div className="flex justify-between font-extrabold text-lg pt-4 border-t border-border mt-4 text-primary">
                            <span>Total de la commande</span>
                            <span>{selectedOrder.total.toLocaleString('fr-DZ')} DA</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column: Customer Info */}
                  <div className="space-y-6">
                    <Card className="shadow-sm border-border print:border-none print:shadow-none">
                      <CardHeader className="py-4 border-b border-border bg-muted/20 print:bg-transparent print:border-b-2 print:border-black">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <User className="h-4 w-4" /> Client
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        <div>
                          <p className="font-bold text-foreground text-base">{selectedOrder.userName || 'Client Invité'}</p>
                          <p className="text-sm text-primary hover:underline cursor-pointer">{selectedOrder.userEmail}</p>
                          <p className="text-sm text-muted-foreground mt-1">{selectedOrder.shippingAddress?.phone}</p>
                        </div>
                        
                        {selectedOrder.userId && (
                          <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                            <Link href={`/admin/customers?id=${selectedOrder.userId}`}>Voir le profil client</Link>
                          </Button>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm border-border print:border-none print:shadow-none">
                      <CardHeader className="py-4 border-b border-border bg-muted/20 print:bg-transparent print:border-b-2 print:border-black">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <MapPin className="h-4 w-4" /> Livraison
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Destinataire</p>
                          <p className="font-semibold">{selectedOrder.shippingAddress?.fullName}</p>
                          <p className="text-muted-foreground">{selectedOrder.shippingAddress?.phone}</p>
                        </div>
                        <div className="pt-3 border-t border-border/50">
                          <p className="font-medium text-muted-foreground mb-1">Adresse</p>
                          <p className="leading-relaxed">
                            {selectedOrder.shippingAddress?.address}<br/>
                            {selectedOrder.shippingAddress?.commune && <>{selectedOrder.shippingAddress.commune}<br/></>}
                            <span className="font-semibold text-foreground uppercase">{selectedOrder.shippingAddress?.wilaya}</span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {selectedOrder.notes && (
                      <Card className="shadow-sm border-border bg-warning/5 print:border-none print:shadow-none">
                        <CardHeader className="py-3 border-b border-warning/20">
                          <CardTitle className="text-sm font-semibold text-warning-foreground">Notes du client</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <p className="text-sm italic text-foreground/80 whitespace-pre-wrap">{selectedOrder.notes}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border bg-background flex items-center justify-between shrink-0 print:hidden">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">Mettre à jour:</span>
                  <Select value={selectedOrder.status} onValueChange={(val) => handleUpdateStatus(selectedOrder.id, val)}>
                    <SelectTrigger className="w-[180px] h-9 font-medium">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>Fermer</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
