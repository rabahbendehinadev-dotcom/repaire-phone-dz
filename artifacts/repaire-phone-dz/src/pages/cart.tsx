import { Link, useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart-store";
import { useApplyCoupon } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, ShoppingCart, ArrowRight, Minus, Plus, Tag } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Cart() {
  const { cart, isLoading, updateQuantity, removeItem, clearCart, itemCount } = useCart();
  const [, setLocation] = useLocation();
  const [couponCode, setCouponCode] = useState("");
  const applyCoupon = useApplyCoupon();
  const { toast } = useToast();

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;
    
    applyCoupon.mutate({ data: { code: couponCode } }, {
      onSuccess: () => {
        toast({ title: "Code promo appliqué" });
        setCouponCode("");
      },
      onError: () => {
        toast({ title: "Code invalide", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-navy mb-8">Mon Panier</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
          <div>
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center flex flex-col items-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart className="w-12 h-12 text-gray-400" />
        </div>
        <h1 className="text-3xl font-black text-navy mb-4">Votre panier est vide</h1>
        <p className="text-gray-500 mb-8 max-w-md">
          Découvrez nos équipements et outils professionnels pour la réparation de téléphones.
        </p>
        <Button asChild size="lg" className="rounded-full px-8">
          <Link href="/products">Parcourir la boutique</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-navy">Mon Panier ({itemCount})</h1>
        <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={clearCart}>
          <Trash2 className="w-4 h-4 mr-2" /> Vider le panier
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Cart Items */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {cart.items.map((item: any) => (
            <div key={item.productId} className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-border relative group">
              <Link href={`/products/${item.productId}`} className="w-24 h-24 bg-gray-50 rounded-lg shrink-0 overflow-hidden block">
                <img 
                  src={item.images?.[0] || "https://placehold.co/400x400/1a56db/white?text=Produit"} 
                  alt={item.name} 
                  className="w-full h-full object-cover p-2"
                />
              </Link>
              
              <div className="flex-1 flex flex-col justify-between">
                <div className="pr-8">
                  <Link href={`/products/${item.productId}`} className="font-bold text-navy hover:text-primary transition-colors text-sm sm:text-base line-clamp-2">
                    {item.name}
                  </Link>
                  <div className="text-primary font-black mt-1">{formatPrice(item.price)}</div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center border border-input rounded-md h-9 bg-white">
                    <button 
                      className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-navy hover:bg-gray-50"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <div className="w-10 text-center font-bold text-navy text-sm">{item.quantity}</div>
                    <button 
                      className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-navy hover:bg-gray-50"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="font-bold text-navy">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              </div>

              <button 
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors p-1"
                onClick={() => removeItem(item.productId)}
                title="Retirer"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white p-6 rounded-xl border border-border sticky top-24">
          <h2 className="text-xl font-bold text-navy mb-6">Résumé de la commande</h2>
          
          <div className="space-y-4 text-sm mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Sous-total ({itemCount} articles)</span>
              <span className="font-medium text-navy">{formatPrice(cart.subtotal)}</span>
            </div>
            
            {cart.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Remise</span>
                <span className="font-medium">-{formatPrice(cart.discount)}</span>
              </div>
            )}
            
            {cart.couponCode && (
              <div className="flex justify-between text-green-600 items-center">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Code: {cart.couponCode}
                </span>
                <span className="font-medium">-{formatPrice(cart.couponDiscount || 0)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-gray-600">
              <span>Frais de livraison</span>
              <span className="font-medium text-navy">{cart.shipping > 0 ? formatPrice(cart.shipping) : "Calculé à l'étape suivante"}</span>
            </div>
            
            <div className="pt-4 border-t border-border flex justify-between font-black text-lg text-navy">
              <span>Total à payer</span>
              <span className="text-primary">{formatPrice(cart.total)}</span>
            </div>
          </div>

          <form onSubmit={handleApplyCoupon} className="flex gap-2 mb-6">
            <Input 
              placeholder="Code promo" 
              value={couponCode}
              onChange={e => setCouponCode(e.target.value)}
              className="h-10 text-sm"
            />
            <Button type="submit" variant="secondary" className="h-10">Appliquer</Button>
          </form>

          <Button 
            className="w-full h-12 text-base font-bold rounded-md"
            onClick={() => setLocation('/checkout')}
          >
            Passer à la caisse <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <div className="mt-4 text-xs text-center text-gray-500 flex items-center justify-center gap-1">
             Paiement sécurisé à la livraison disponible
          </div>
        </div>
      </div>
    </div>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}