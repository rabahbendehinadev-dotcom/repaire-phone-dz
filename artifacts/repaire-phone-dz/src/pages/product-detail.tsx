import { useParams } from "wouter";
import { useState } from "react";
import { useGetProduct, useGetRelatedProducts, useListProductReviews } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart-store";
import { useWishlist } from "@/hooks/use-wishlist";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Truck, 
  Shield, 
  Check,
  Minus,
  Plus,
  Share2
} from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  
  const { data: product, isLoading } = useGetProduct(productId);
  const { data: relatedProducts, isLoading: loadingRelated } = useGetRelatedProducts(productId);
  const { data: reviews } = useListProductReviews(productId);
  
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="container mx-auto px-4 py-16 text-center">Produit introuvable</div>;
  }

  const isFavorite = isInWishlist(productId);
  const images = product.images?.length ? product.images : ["https://placehold.co/800x800/1a56db/white?text=Produit"];

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      {/* Breadcrumb could go here */}

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8">
          
          {/* Image Gallery */}
          <div className="p-4 md:p-8 flex flex-col gap-4 bg-gray-50/50">
            <div className="aspect-square rounded-xl bg-white border border-border overflow-hidden relative">
              {product.hasDiscount && product.discountPercent && (
                <Badge className="absolute top-4 left-4 z-10 bg-secondary text-white text-sm px-3 py-1">
                  -{product.discountPercent}%
                </Badge>
              )}
              <img 
                src={images[activeImage]} 
                alt={product.name} 
                className="w-full h-full object-contain p-8"
              />
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
                {images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`w-20 h-20 rounded-md border-2 overflow-hidden shrink-0 bg-white ${activeImage === idx ? 'border-primary' : 'border-transparent'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover p-2" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-6 md:p-8 flex flex-col justify-center">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">{product.brandName || "Général"}</span>
              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded text-warning">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-bold text-gray-700">{product.averageRating?.toFixed(1) || "5.0"}</span>
                <span className="text-xs text-gray-400">({product.reviewCount || 0} avis)</span>
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-navy mb-4 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-end gap-3 mb-6">
              <div className="text-4xl font-black text-primary">{formatPrice(product.price)}</div>
              {product.comparePrice && (
                <div className="text-lg text-gray-400 line-through mb-1">{formatPrice(product.comparePrice)}</div>
              )}
            </div>

            <p className="text-gray-600 mb-6 line-clamp-3">
              {product.description || "Outil professionnel de haute précision, conçu pour les réparateurs de téléphones exigeants."}
            </p>

            {/* Stock status */}
            <div className="mb-6 flex items-center gap-2 text-sm font-medium">
              {product.stock > 0 ? (
                <><div className="w-2 h-2 rounded-full bg-green-500"></div> <span className="text-green-600">En stock ({product.stock} disponibles)</span></>
              ) : (
                <><div className="w-2 h-2 rounded-full bg-red-500"></div> <span className="text-red-500">Rupture de stock</span></>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4 pt-6 border-t border-border">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-input rounded-md h-12 bg-white">
                  <button 
                    className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-navy hover:bg-gray-50"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="w-12 text-center font-bold text-navy">{quantity}</div>
                  <button 
                    className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-navy hover:bg-gray-50"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <Button 
                  className="flex-1 h-12 text-base font-bold shadow-md rounded-md"
                  onClick={() => addToCart(product.id, quantity)}
                  disabled={product.stock <= 0}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {product.stock > 0 ? "Ajouter au panier" : "Indisponible"}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={`h-12 w-12 shrink-0 ${isFavorite ? "text-red-500 border-red-200 bg-red-50" : "text-gray-400"}`}
                  onClick={() => toggleWishlist(product.id)}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Delivery & Warranty info */}
            <div className="mt-8 grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-md">
                <Truck className="w-5 h-5 text-navy shrink-0" />
                <span>Livraison disponible sur les 58 Wilayas (24h - 72h)</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-md">
                <Shield className="w-5 h-5 text-navy shrink-0" />
                <span>Garantie: {product.warrantyInfo || "3 mois sur les pièces d'origine"}</span>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Tabs for Details / Specs / Reviews */}
      <div className="bg-white rounded-2xl border border-border p-2 md:p-6 mb-8">
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 mb-6 overflow-x-auto">
            <TabsTrigger value="description" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none py-3 px-4 text-base font-semibold">Description</TabsTrigger>
            <TabsTrigger value="specs" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none py-3 px-4 text-base font-semibold">Caractéristiques</TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none py-3 px-4 text-base font-semibold">Avis ({product.reviewCount || 0})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="p-4 prose max-w-none text-gray-600">
            {product.description ? (
              <div dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br/>') }} />
            ) : (
              <p>Aucune description détaillée disponible pour ce produit.</p>
            )}
          </TabsContent>
          
          <TabsContent value="specs" className="p-4">
            {product.specifications ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {Object.entries(product.specifications as Record<string, string>).map(([key, value]) => (
                  <div key={key} className="flex border-b border-border pb-2">
                    <span className="w-1/2 font-medium text-gray-500">{key}</span>
                    <span className="w-1/2 text-navy">{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Spécifications non renseignées.</p>
            )}
            {product.sku && (
               <div className="flex border-b border-border pb-2 mt-4 max-w-md">
                 <span className="w-1/2 font-medium text-gray-500">SKU</span>
                 <span className="w-1/2 text-navy">{product.sku}</span>
               </div>
            )}
            {product.barcode && (
               <div className="flex border-b border-border pb-2 mt-4 max-w-md">
                 <span className="w-1/2 font-medium text-gray-500">Code barre</span>
                 <span className="w-1/2 text-navy">{product.barcode}</span>
               </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="p-4">
            {reviews?.length ? (
              <div className="space-y-6">
                {reviews.map(review => (
                  <div key={review.id} className="border-b border-border pb-6 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                        {review.userName?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-navy">{review.userName || "Utilisateur"}</div>
                        <div className="flex text-warning">
                          {Array.from({length: 5}).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <span className="ml-auto text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-gray-600 text-sm mt-2 ml-10">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p>Aucun avis pour le moment.</p>
                <Button variant="outline" className="mt-4">Soyez le premier à donner votre avis</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}
