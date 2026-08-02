import { useParams } from "wouter";
import { useGetOrder } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, MapPin, Truck, AlertCircle, FileText } from "lucide-react";

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { data: order, isLoading } = useGetOrder(orderId);

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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="md:col-span-2 h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!order) return <div className="text-center py-20">Commande introuvable</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <button 
        onClick={() => window.history.back()} 
        className="flex items-center text-sm font-medium text-gray-500 hover:text-navy mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Retour aux commandes
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-navy flex items-center gap-3">
            Commande #{order.id}
            {getStatusBadge(order.status)}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Passée le {new Date(order.createdAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}
          </p>
        </div>
        <Button variant="outline" className="shrink-0 bg-white">
          <FileText className="w-4 h-4 mr-2" /> Facture
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="text-lg font-bold text-navy mb-4">Articles</h2>
            
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.productId} className="flex gap-4 items-center pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className="w-16 h-16 bg-gray-50 rounded-lg shrink-0 overflow-hidden border border-border">
                    <img src={item.images?.[0]} alt={item.name} className="w-full h-full object-contain p-1" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-navy line-clamp-2">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatPrice(item.price)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-700">x{item.quantity}</p>
                    <p className="font-black text-primary mt-1">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-border p-6 flex flex-col sm:flex-row gap-6">
            <div className="flex-1">
              <h3 className="font-bold text-navy flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-primary" /> Adresse de livraison
              </h3>
              <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 mb-1">{order.shippingAddress?.fullName}</p>
                <p>{order.shippingAddress?.address}</p>
                <p>{order.shippingAddress?.commune}, {order.shippingAddress?.wilaya}</p>
                <p className="mt-2 text-primary font-medium">{order.shippingAddress?.phone}</p>
              </div>
            </div>
            {order.notes && (
              <div className="flex-1">
                <h3 className="font-bold text-navy flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-warning" /> Notes
                </h3>
                <div className="text-sm text-gray-600 bg-yellow-50/50 border border-yellow-100 p-4 rounded-lg">
                  {order.notes}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl border border-border p-6">
            <h2 className="text-lg font-bold text-navy mb-4">Total de la commande</h2>
            
            <div className="space-y-3 text-sm mb-4 pb-4 border-b border-gray-200">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span>
                <span className="font-medium text-navy">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount !== undefined && order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Remise</span>
                  <span className="font-medium">-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Livraison</span>
                <span className="font-medium text-navy">{order.shipping ? formatPrice(order.shipping) : "Calculée à l'envoi"}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-navy">Total payé</span>
              <span className="font-black text-2xl text-primary">{formatPrice(order.total)}</span>
            </div>
            
            <div className="bg-white border border-border rounded-lg p-3 text-xs text-center text-gray-500 font-medium flex items-center justify-center gap-2">
              <Truck className="w-4 h-4 text-primary" /> Paiement à la livraison
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-border p-6">
             <h3 className="font-bold text-navy text-sm mb-2">Besoin d'aide ?</h3>
             <p className="text-xs text-gray-500 mb-4">Contactez notre service client pour toute question concernant cette commande.</p>
             <Button variant="outline" className="w-full text-xs">Contacter le support</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
