import { useEffect } from "react";
import { Link } from "wouter";
import { useListBanners, useGetFeaturedProducts, useGetNewArrivals, useListCategories, useListBrands } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { ShoppingCart, Star, ArrowRight, ShieldCheck, Truck, Clock } from "lucide-react";
import { useCart } from "@/hooks/use-cart-store";
import useEmblaCarousel from "embla-carousel-react";

export default function Home() {
  const { data: banners, isLoading: loadingBanners } = useListBanners();
  const { data: featuredProducts, isLoading: loadingFeatured } = useGetFeaturedProducts();
  const { data: newArrivals, isLoading: loadingNew } = useGetNewArrivals();
  const { data: categories, isLoading: loadingCategories } = useListCategories();
  const { data: brands, isLoading: loadingBrands } = useListBrands();
  
  const { addToCart } = useCart();
  const [emblaRef] = useEmblaCarousel({ loop: true });

  const renderProductCard = (product: any) => (
    <div key={product.id} className="group relative bg-white border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {product.hasDiscount && product.discountPercent && (
          <Badge className="bg-secondary text-white border-none text-[10px] uppercase font-bold py-0.5">
            -{product.discountPercent}%
          </Badge>
        )}
        {product.isNew && (
          <Badge className="bg-navy text-white border-none text-[10px] uppercase font-bold py-0.5">
            Nouveau
          </Badge>
        )}
      </div>
      
      {/* Image */}
      <Link href={`/products/${product.id}`} className="block relative aspect-square bg-gray-50 overflow-hidden">
        <img 
          src={product.images?.[0] || "https://placehold.co/400x400/1a56db/white?text=Produit"} 
          alt={product.name}
          className="w-full h-full object-cover p-4 transition-transform duration-300 group-hover:scale-105"
        />
      </Link>
      
      {/* Content */}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 truncate">{product.categoryName || "Général"}</span>
          <div className="flex items-center gap-1 text-warning">
            <Star className="w-3 h-3 fill-current" />
            <span className="text-xs font-medium text-gray-600">{product.averageRating?.toFixed(1) || "5.0"}</span>
          </div>
        </div>
        
        <Link href={`/products/${product.id}`} className="block h-10">
          <h3 className="text-sm font-bold text-navy line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <div className="mt-2 flex items-end justify-between">
          <div>
            <div className="text-base font-black text-primary">{formatPrice(product.price)}</div>
            {product.comparePrice && (
              <div className="text-xs text-gray-400 line-through">{formatPrice(product.comparePrice)}</div>
            )}
          </div>
          
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
  );

  return (
    <div className="w-full flex flex-col gap-8 md:gap-12 pb-12">
      {/* Hero Section */}
      <section className="bg-white">
        <div className="container mx-auto px-4 md:py-6">
          <div className="flex flex-col md:flex-row gap-4 h-auto md:h-[400px]">
            {/* Main Slider */}
            <div className="w-full md:w-[70%] h-[200px] md:h-full rounded-2xl overflow-hidden relative" ref={emblaRef}>
              <div className="flex h-full">
                {loadingBanners ? (
                  <Skeleton className="w-full h-full min-w-full" />
                ) : banners?.length ? (
                  banners.filter(b => b.isActive).map((banner) => (
                    <div key={banner.id} className="min-w-full h-full relative">
                      <img 
                        src={banner.imageUrl || "https://placehold.co/1200x600/1a56db/white?text=Banner"} 
                        alt={banner.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-navy/80 to-transparent flex flex-col justify-center px-8 md:px-16 text-white">
                        <h2 className="text-2xl md:text-5xl font-black mb-2 max-w-lg leading-tight">{banner.title}</h2>
                        {banner.subtitle && <p className="text-sm md:text-lg mb-6 max-w-md opacity-90">{banner.subtitle}</p>}
                        {banner.linkUrl && (
                          <Button asChild size="lg" className="w-fit bg-secondary text-white hover:bg-secondary/90 font-bold rounded-full">
                            <Link href={banner.linkUrl}>{banner.buttonText || "Découvrir"}</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="min-w-full h-full relative bg-primary text-white flex flex-col justify-center px-8 md:px-16">
                    <h2 className="text-3xl md:text-5xl font-black mb-4">Équipement Pro.</h2>
                    <p className="text-lg mb-6">Tout ce dont un réparateur a besoin.</p>
                    <Button size="lg" className="w-fit bg-secondary hover:bg-secondary/90 text-white rounded-full">Découvrir les offres</Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Banners */}
            <div className="hidden md:flex w-[30%] flex-col gap-4">
              <Link href="/products?isNew=true" className="flex-1 rounded-2xl bg-navy p-6 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <h3 className="text-xl font-bold text-white mb-2 relative z-10">Nouveautés<br/>Micro-soudure</h3>
                <span className="text-secondary text-sm font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform relative z-10">Voir tout <ArrowRight className="w-4 h-4"/></span>
              </Link>
              <Link href="/products?hasDiscount=true" className="flex-1 rounded-2xl bg-gray-100 p-6 flex flex-col justify-center relative overflow-hidden group border border-border">
                <h3 className="text-xl font-bold text-navy mb-2 relative z-10">Destockage<br/>Pièces détachées</h3>
                <span className="text-primary text-sm font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform relative z-10">Jusqu'à -50% <ArrowRight className="w-4 h-4"/></span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-navy text-sm">Qualité Originale</h4>
              <p className="text-xs text-gray-500">Garantie sur toutes les pièces</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-border">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-navy text-sm">Livraison Rapide</h4>
              <p className="text-xs text-gray-500">Expédition vers 58 Wilayas</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-navy text-sm">Support Technique</h4>
              <p className="text-xs text-gray-500">Équipe experte à votre écoute</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-navy">Catégories Principales</h2>
          <Link href="/categories" className="text-primary font-semibold text-sm hover:underline flex items-center gap-1">Voir tout <ArrowRight className="w-4 h-4"/></Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4">
          {loadingCategories ? (
            Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          ) : (
            categories?.slice(0, 6).map((cat) => (
              <Link key={cat.id} href={`/products?categoryId=${cat.id}`} className="flex flex-col items-center gap-3 p-4 bg-white border border-border rounded-xl hover:border-primary hover:shadow-md transition-all group">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center p-3">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                  ) : (
                    <div className="w-8 h-8 bg-primary/20 rounded-full" />
                  )}
                </div>
                <span className="text-xs font-bold text-center text-navy">{cat.name}</span>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-navy">Populaires chez les pros</h2>
          <Link href="/products?isFeatured=true" className="text-primary font-semibold text-sm hover:underline flex items-center gap-1">Voir tout <ArrowRight className="w-4 h-4"/></Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {loadingFeatured ? (
            Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)
          ) : (
            featuredProducts?.slice(0, 5).map(renderProductCard)
          )}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="container mx-auto px-4">
        <div className="bg-navy rounded-2xl p-6 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/30 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none"></div>
          <div className="relative z-10 md:max-w-xl">
            <Badge className="bg-secondary mb-4">Offre Spéciale</Badge>
            <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">Pack Complet Démarrage Micro-soudure</h2>
            <p className="text-gray-300 mb-6">Station à air chaud, microscope trinoculaire, fer à souder JBC et consommables inclus. Économisez 15% sur l'achat en pack.</p>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-8">Voir le pack</Button>
          </div>
          <div className="relative z-10 w-full max-w-sm">
            <img src="https://placehold.co/600x400/transparent/white?text=Pack+Soudure" alt="Promo" className="w-full h-auto drop-shadow-2xl" />
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-navy">Nouvel Arrivage</h2>
          <Link href="/products?isNew=true" className="text-primary font-semibold text-sm hover:underline flex items-center gap-1">Voir tout <ArrowRight className="w-4 h-4"/></Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {loadingNew ? (
            Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)
          ) : (
            newArrivals?.slice(0, 5).map(renderProductCard)
          )}
        </div>
      </section>

      {/* Brands */}
      <section className="container mx-auto px-4">
        <h2 className="text-xl font-bold text-center text-navy mb-8">Les Marques Officielles</h2>
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 opacity-60">
          {loadingBrands ? (
             Array(6).fill(0).map((_, i) => <Skeleton key={i} className="w-24 h-12" />)
          ) : (
            brands?.slice(0, 8).map(brand => (
              <div key={brand.id} className="w-24 md:w-32 h-12 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer">
                <span className="font-bold text-lg">{brand.name}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
