import { useState } from 'react';
import { useListAllOrders, useUpdateOrderStatus } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmée' },
  { value: 'processing', label: 'En préparation' },
  { value: 'shipped', label: 'Expédiée' },
  { value: 'delivered', label: 'Livrée' },
  { value: 'cancelled', label: 'Annulée' },
];

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const queryClient = useQueryClient();
  
  const { data: ordersData, isLoading } = useListAllOrders({
    page,
    limit: 20,
    search: search || null,
    status: statusFilter !== 'all' ? statusFilter : null,
  });

  const updateStatus = useUpdateOrderStatus();

  const handleUpdateStatus = async (orderId: number, newStatus: any) => {
    try {
      await updateStatus.mutateAsync({ id: orderId, data: { status: newStatus } });
      toast.success('Statut mis à jour');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err: any) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-warning/10 text-warning-foreground border-warning/20">En attente</Badge>;
      case 'confirmed': return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">Confirmée</Badge>;
      case 'processing': return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-200">En préparation</Badge>;
      case 'shipped': return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-200">Expédiée</Badge>;
      case 'delivered': return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">Livrée</Badge>;
      case 'cancelled': return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Annulée</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Gestion des Commandes</h2>
      </div>

      <Card className="border-border shadow-sm">
        <div className="p-4 border-b border-border flex flex-col md:flex-row items-center gap-4 bg-muted/20">
          <div className="relative flex-1 w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Chercher par ID, client..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {STATUS_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground font-medium md:ml-auto">
            {ordersData?.total || 0} commandes
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4"><div className="h-6 bg-muted rounded animate-pulse w-full"></div></td>
                  </tr>
                ))
              ) : ordersData?.orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <td className="px-4 py-3 font-bold text-foreground">#{order.id}</td>
                  <td className="px-4 py-3 text-muted-foreground">{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{order.userName || 'Client invité'}</div>
                    <div className="text-xs text-muted-foreground">{order.userEmail}</div>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Select value={order.status} onValueChange={(val) => handleUpdateStatus(order.id, val)}>
                      <SelectTrigger className="h-8 border-transparent hover:border-input w-[150px] shadow-none bg-transparent p-0">
                        {getStatusBadge(order.status)}
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 font-bold text-primary">{order.total.toLocaleString('fr-DZ')} DA</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Basic Pagination */}
        {ordersData && ordersData.totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between bg-muted/10">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Précédent
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              Page {page} sur {ordersData.totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.min(ordersData.totalPages, p + 1))}
              disabled={page === ordersData.totalPages}
            >
              Suivant
            </Button>
          </div>
        )}
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-4">
              Commande #{selectedOrder?.id}
              {selectedOrder && getStatusBadge(selectedOrder.status)}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">Informations Client</h4>
                  <div className="bg-muted/30 p-4 rounded-lg border border-border text-sm space-y-1">
                    <p><span className="font-semibold text-foreground">Nom:</span> {selectedOrder.userName}</p>
                    <p><span className="font-semibold text-foreground">Email:</span> {selectedOrder.userEmail}</p>
                    <p><span className="font-semibold text-foreground">Tél:</span> {selectedOrder.shippingAddress?.phone}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">Adresse de livraison</h4>
                  <div className="bg-muted/30 p-4 rounded-lg border border-border text-sm space-y-1">
                    <p>{selectedOrder.shippingAddress?.fullName}</p>
                    <p>{selectedOrder.shippingAddress?.address}</p>
                    <p>{selectedOrder.shippingAddress?.commune}</p>
                    <p className="font-semibold text-foreground">{selectedOrder.shippingAddress?.wilaya}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">Articles</h4>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Produit</th>
                        <th className="px-4 py-2 text-center font-medium">Qte</th>
                        <th className="px-4 py-2 text-right font-medium">Prix</th>
                        <th className="px-4 py-2 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedOrder.items?.map((item: any, i: number) => (
                        <tr key={i} className="bg-card">
                          <td className="px-4 py-3 flex items-center gap-3">
                            <img src={item.images?.[0] || 'https://placehold.co/40'} alt="" className="w-10 h-10 object-contain bg-muted p-1 rounded" />
                            <span className="font-medium line-clamp-1">{item.name}</span>
                          </td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">{item.price.toLocaleString('fr-DZ')} DA</td>
                          <td className="px-4 py-3 text-right font-bold">{(item.price * item.quantity).toLocaleString('fr-DZ')} DA</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="bg-muted/10 p-4 space-y-2 border-t border-border text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Sous-total</span>
                      <span>{selectedOrder.subtotal.toLocaleString('fr-DZ')} DA</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-secondary">
                        <span>Remise</span>
                        <span>-{selectedOrder.discount.toLocaleString('fr-DZ')} DA</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>Livraison</span>
                      <span>{selectedOrder.shipping === 0 ? 'Gratuite' : `${selectedOrder.shipping?.toLocaleString('fr-DZ')} DA`}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-lg pt-2 border-t border-border mt-2 text-primary">
                      <span>Total</span>
                      <span>{selectedOrder.total.toLocaleString('fr-DZ')} DA</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Changer le statut:</span>
                  <Select value={selectedOrder.status} onValueChange={(val) => handleUpdateStatus(selectedOrder.id, val)}>
                    <SelectTrigger className="w-[180px]">
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}