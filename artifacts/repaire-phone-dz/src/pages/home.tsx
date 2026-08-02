import { useListBanners, useListCategories, useListProducts, useListBrands } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { getImageSrc, getProductImageSrc } from '@/lib/image-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, ChevronRight, Star, ShoppingCart, Heart, ShieldCheck, Zap, Wrench } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { useEffect, useCallback } from 'react';
import { useCart } from '@/hooks/use-cart-store';
import { useWishlist } from '@/hooks/use-wishlist';
import { toast } from 'sonner';

export default function Home() {
  const { data: banners, isLoading: loadingBanners } = useListBanners();
  const { data: categories, isLoading: loadingCategories } = useListCategories();
  const { data: featuredData, isLoading: loadingFeatured } = useListProducts({ isFeatured: true, limit: 8 });
  const { data: newArrivalsData, isLoading: loadingNew } = useListProducts({ isNew: true, limit: 8 });
  const { data: brands, isLoading: loadingBrands } = useListBrands();

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (emblaApi) {
      const autoplay = setInterval(() => {
        emblaApi.scrollNext();
      }, 5000);
      return () => clearInterval(autoplay);
    }
  }, [emblaApi]);

  return (
    <div className="flex flex-col gap-10 md:gap-16 pb-10">
      {/* Hero Section */}
      <section className="relative bg-muted">
        <div className="overflow-hidden relative" ref={emblaRef}>
          <div className="flex">
            {loadingBanners ? (
              <div className="flex-[0_0_100%] min-w-0">
                <Skeleton className="w-full aspect-[21/9] md:aspect-[21/7] rounded-none" />
              </div>
            ) : banners?.filter(b => b.isActive).length ? (
              banners.filter(b => b.isActive).map((banner) => (
                <div key={banner.id} className="flex-[0_0_100%] min-w-0 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/60 to-transparent z-10" />
                  <img 
                    src={getImageSrc(banner.imageUrl) || `https://placehold.co/1200x400/1e3a5f/ffffff?text=${encodeURIComponent(banner.title)}`} 
                    alt={banner.title} 
                    className="w-full aspect-[4/3] md:aspect-[21/7] object-cover"
                  />
                  <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-16 container mx-auto">
                    <div className="max-w-xl">
                      <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight tracking-tight">
                        {banner.title}
                      </h2>
                      {banner.subtitle && (
                        <p className="text-lg md:text-xl text-white/90 mb-8 font-medium">
                          {banner.subtitle}
                        </p>
                      )}
                      <Button asChild size="lg" className="bg-secondary hover:bg-secondary/90 text-white font-bold px-8 h-12 md:h-14 text-base shadow-lg shadow-secondary/20">
                        <Link href={banner.linkUrl || '/products'}>
                          {banner.buttonText || 'Découvrir'} <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-[0_0_100%] min-w-0 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-navy/90 to-primary/80 z-10" />
                <div className="w-full aspect-[4/3] md:aspect-[21/7] bg-navy" />
                <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-16 container mx-auto">
                  <div className="max-w-xl">
                    <span className="inline-block py-1 px-3 rounded-full bg-secondary/20 text-secondary font-bold text-xs uppercase tracking-wider mb-4 border border-secondary/30">
                      Nouveauté
                    </span>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
                      L'équipement des pros
                    </h2>
                    <p className="text-lg text-white/90 mb-8 font-medium">
                      Découvrez notre nouvelle gamme de fers à souder et microscopes trinoculaires.
                    </p>
                    <Button asChild size="lg" className="bg-secondary hover:bg-secondary/90 text-white font-bold px-8 h-14">
                      <Link href="/products">
                        Voir le catalogue <ArrowRight className="ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-30">
            {banners?.filter(b => b.isActive).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-white/50" />
            ))}
          </div>
        </div>

        {/* Feature Highlights Strip */}
        <div className="hidden md:block relative z-30 container mx-auto px-4 -mt-8">
          <div className="bg-card rounded-xl shadow-xl border border-border p-6 grid grid-cols-3 gap-6 divide-x divide-border">
            <div className="flex items-center gap-4 px-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Qualité Pro</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Matériel testé et garanti</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-4">
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                <Zap className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Livraison Rapide</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Partout en Algérie</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-4">
              <div className="h-12 w-12 rounded-full bg-navy/10 flex items-center justify-center shrink-0">
                <Wrench className="h-6 w-6 text-navy" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Support Technique</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Par des techniciens pour des techniciens</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">Catégories Populaires</h3>
          <Link href="/categories" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center group">
            Tout voir <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {loadingCategories ? (
            Array(6).fill(0).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)
          ) : (
            categories?.slice(0, 6).map((cat) => (
              <Link key={cat.id} href={`/products?categoryId=${cat.id}`}>
                <Card className="aspect-square cursor-pointer group hover:border-primary/50 hover:shadow-md transition-all overflow-hidden bg-muted/30">
                  <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center relative">
                    <div className="w-16 h-16 md:w-20 md:h-20 mb-3 md:mb-4 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                      {cat.imageUrl ? (
                        <img src={getImageSrc(cat.imageUrl)} alt={cat.name} className="w-10 h-10 md:w-12 md:h-12 object-contain" />
                      ) : (
                        <Wrench className="h-8 w-8 text-muted-foreground/50" />
                      )}
                    </div>
                    <h4 className="font-bold text-xs md:text-sm text-foreground line-clamp-2">{cat.name}</h4>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">Sélection Pro</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {loadingFeatured ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))
          ) : (
            featuredData?.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </section>

      {/* Banner Strip */}
      <section className="container mx-auto px-4">
        <div className="bg-navy rounded-2xl overflow-hidden relative shadow-lg">
          <div className="absolute inset-0 bg-[url('https://placehold.co/1200x300/1e3a5f/1e3a5f')] opacity-50 mix-blend-overlay"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 md:p-12 gap-8">
            <div className="text-center md:text-left max-w-xl">
              <h3 className="text-2xl md:text-4xl font-extrabold text-white mb-3">Besoin d'équiper un nouvel atelier ?</h3>
              <p className="text-navy-foreground/80 font-medium">Demandez un devis personnalisé et bénéficiez de réductions exclusives pour les professionnels.</p>
            </div>
            <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white font-bold h-14 px-8 shrink-0">
              Demander un devis
            </Button>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">Nouveaux Arrivages</h3>
          <Link href="/products?isNew=true" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center group">
            Tout voir <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {loadingNew ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))
          ) : (
            newArrivalsData?.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </section>

      {/* Brands */}
      <section className="bg-muted py-12 border-y border-border">
        <div className="container mx-auto px-4">
          <h3 className="text-center text-sm font-bold text-muted-foreground uppercase tracking-widest mb-8">
            Les marques de confiance
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {loadingBrands ? (
              Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-24" />)
            ) : (
              brands?.slice(0, 6).map((brand) => (
                <div key={brand.id} className="h-8 md:h-12 flex items-center justify-center min-w-[100px]">
                  {brand.logoUrl ? (
                    <img src={getImageSrc(brand.logoUrl)} alt={brand.name} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="font-extrabold text-xl tracking-tight text-foreground">{brand.name}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductCard({ product }: { product: any }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id, 1);
    toast.success(`${product.name} ajouté au panier`);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group h-full flex flex-col cursor-pointer overflow-hidden border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 bg-card rounded-xl">
        <div className="relative aspect-square bg-muted/30 p-4 flex items-center justify-center overflow-hidden">
          {product.hasDiscount && product.discountPercent && (
            <div className="absolute top-3 left-3 bg-secondary text-white text-xs font-extrabold px-2 py-1 rounded z-10 shadow-sm">
              -{product.discountPercent}%
            </div>
          )}
          {product.isNew && !product.hasDiscount && (
            <div className="absolute top-3 left-3 bg-primary text-white text-xs font-extrabold px-2 py-1 rounded z-10 shadow-sm">
              Nouveau
            </div>
          )}
          <button 
            onClick={handleToggleWishlist}
            className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-colors ${inWishlist ? 'bg-secondary/10 text-secondary' : 'bg-white/80 text-muted-foreground hover:bg-white hover:text-foreground shadow-sm'}`}
          >
            <Heart className={`h-4 w-4 ${inWishlist ? 'fill-secondary' : ''}`} />
          </button>
          
          <img 
            src={product.images?.[0] || 'https://placehold.co/400x400/f8fafc/1e3a5f?text=Produit'} 
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <CardContent className="p-4 flex-1 flex flex-col gap-2">
          <div className="text-xs text-muted-foreground font-medium">{product.brandName || 'Générique'}</div>
          <h4 className="font-bold text-sm leading-tight text-foreground line-clamp-2 flex-1 group-hover:text-primary transition-colors">
            {product.name}
          </h4>
          
          <div className="flex items-center gap-1 my-1">
            <div className="flex text-yellow-400">
              {Array(5).fill(0).map((_, i) => (
                <Star key={i} className={`h-3 w-3 ${i < Math.floor(product.averageRating || 0) ? 'fill-current' : 'text-muted-foreground/30'}`} />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">({product.reviewCount || 0})</span>
          </div>

          <div className="flex items-end justify-between mt-1">
            <div>
              <div className="font-extrabold text-lg text-primary tracking-tight">
                {product.price.toLocaleString('fr-DZ')} <span className="text-xs font-normal">DA</span>
              </div>
              {product.comparePrice && (
                <div className="text-xs text-muted-foreground line-through font-medium">
                  {product.comparePrice.toLocaleString('fr-DZ')} DA
                </div>
              )}
            </div>
            <Button 
              size="icon" 
              className="h-9 w-9 rounded-full bg-secondary hover:bg-secondary/90 text-white shadow-md shadow-secondary/20 transition-transform active:scale-95"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}