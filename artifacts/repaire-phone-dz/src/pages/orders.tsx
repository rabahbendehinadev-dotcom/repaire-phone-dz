import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useListMyOrders } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Package, Clock, ShieldCheck, CreditCard, ChevronRight } from "lucide-react";

export default function Orders() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: ordersData, isLoading } = useListMyOrders({
    query: { enabled: isAuthenticated, queryKey: ["/api/orders"] }
  });

  if (!isAuthenticated) {
    setLocation('/auth/login');
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="warning">En attente</Badge>;
      case 'confirmed': return <Badge className="bg-blue-500 hover:bg-blue-600 border-none">Confirmée</Badge>;
      case 'processing': return <Badge className="bg-purple-500 hover:bg-purple-600 border-none">En préparation</Badge>;
      case 'shipped': return <Badge className="bg-indigo-500 hover:bg-indigo-600 border-none">Expédiée</Badge>;
      case 'delivered': return <Badge variant="success">Livrée</Badge>;
      case 'cancelled': return <Badge variant="destructive">Annulée</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-navy">Mes Commandes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Suivez l'état de vos commandes
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : !ordersData || ordersData.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-navy mb-2">Aucune commande</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">Vous n'avez pas encore passé de commande sur notre boutique.</p>
          <Button asChild>
            <Link href="/products">Découvrir nos produits</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {ordersData.map((order: any) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="block bg-white rounded-xl border border-border p-4 md:p-6 hover:shadow-md transition-shadow group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-border shrink-0">
                    <span className="font-bold text-navy">#{order.id}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm font-medium text-navy line-clamp-1">
                      {order.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:flex-col md:items-end gap-2 border-t md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0">
                  <div className="text-lg font-black text-primary">{formatPrice(order.total)}</div>
                  <div className="flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                    Détails <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
                
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
