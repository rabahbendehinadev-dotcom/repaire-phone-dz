import { Link } from "wouter";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart-store";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ShoppingCart, Trash2, ArrowRight } from "lucide-react";

export default function Wishlist() {
  const { items, isLoading, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-navy mb-8">Mes Favoris</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center flex flex-col items-center">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <Heart className="w-12 h-12 text-red-300" />
        </div>
        <h1 className="text-3xl font-black text-navy mb-4">Aucun favori</h1>
        <p className="text-gray-500 mb-8 max-w-md">
          Vous n'avez pas encore ajouté de produits à vos favoris.
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-navy">Mes Favoris ({items.length})</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {items.map((product) => (
          <div key={product.id} className="group relative bg-white border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 flex flex-col">
            
            <button 
              className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
              onClick={() => toggleWishlist(product.id)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            
            <Link href={`/products/${product.id}`} className="block relative aspect-square bg-gray-50 overflow-hidden">
              <img 
                src={product.images?.[0] || "https://placehold.co/400x400/1a56db/white?text=Produit"} 
                alt={product.name}
                className="w-full h-full object-cover p-4 transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
            
            <div className="p-4 flex flex-col flex-1 justify-between gap-2">
              <div>
                <Link href={`/products/${product.id}`} className="block">
                  <h3 className="text-sm font-bold text-navy line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </Link>
              </div>
              
              <div className="mt-2 flex items-end justify-between">
                <div className="text-base font-black text-primary">{formatPrice(product.price)}</div>
                
                <Button 
                  size="icon" 
                  className="w-9 h-9 rounded-full shadow-sm shrink-0 hover:scale-105 active:scale-95 transition-transform"
                  onClick={(e) => {
                    e.preventDefault();
                    addToCart(product.id, 1);
                  }}
                >
                  <ShoppingCart className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
