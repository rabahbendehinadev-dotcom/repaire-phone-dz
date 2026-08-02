import { Link, useLocation } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { 
  useListProducts, 
  useListCategories, 
  useListBrands,
  type ListProductsSortBy
} from "@workspace/api-client-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart-store";
import { 
  Filter, 
  ChevronDown, 
  X, 
  ShoppingCart, 
  Star,
  Search,
  LayoutGrid,
  List as ListIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

export default function Products() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  // State for filters
  const [categoryId, setCategoryId] = useState<number | null>(searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : null);
  const [brandId, setBrandId] = useState<number | null>(searchParams.get('brandId') ? Number(searchParams.get('brandId')) : null);
  const [search, setSearch] = useState(searchParams.get('search') || "");
  const [searchInput, setSearchInput] = useState(search);
  const [sortBy, setSortBy] = useState<ListProductsSortBy>(searchParams.get('sortBy') as ListProductsSortBy || "popular");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Hardcode filters for specific params that might be set from home page
  const isNew = searchParams.get('isNew') === 'true' ? true : null;
  const hasDiscount = searchParams.get('hasDiscount') === 'true' ? true : null;
  const isFeatured = searchParams.get('isFeatured') === 'true' ? true : null;

  const { data: productsData, isLoading: loadingProducts } = useListProducts({
    categoryId: categoryId || undefined,
    brandId: brandId || undefined,
    search: search || undefined,
    sortBy: sortBy || undefined,
    isNew: isNew || undefined,
    hasDiscount: hasDiscount || undefined,
    isFeatured: isFeatured || undefined,
    page,
    limit: 12
  }, {
    query: {
      queryKey: ["products", page, categoryId, brandId, search, sortBy, isNew, hasDiscount, isFeatured],
    }
  });

  const { data: categories } = useListCategories();
  const { data: brands } = useListBrands();
  const { addToCart } = useCart();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearFilters = () => {
    setCategoryId(null);
    setBrandId(null);
    setSearch("");
    setSearchInput("");
    setPage(1);
    // Ideally update URL as well, omitting for brevity
  };

  const FilterSidebar = () => (
    <div className="flex flex-col gap-6 p-1">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-navy text-lg">Filtres</h3>
        {(categoryId || brandId || search) && (
          <button onClick={clearFilters} className="text-xs text-red-500 font-medium hover:underline">
            Effacer
          </button>
        )}
      </div>

      {/* Categories */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Catégories</h4>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="category" 
              checked={categoryId === null} 
              onChange={() => { setCategoryId(null); setPage(1); }}
              className="accent-primary"
            />
            <span className="text-sm">Toutes</span>
          </label>
          {categories?.map(cat => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="category" 
                checked={categoryId === cat.id} 
                onChange={() => { setCategoryId(cat.id); setPage(1); }}
                className="accent-primary"
              />
              <span className="text-sm">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Marques</h4>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="brand" 
              checked={brandId === null} 
              onChange={() => { setBrandId(null); setPage(1); }}
              className="accent-primary"
            />
            <span className="text-sm">Toutes</span>
          </label>
          {brands?.map(brand => (
            <label key={brand.id} className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="brand" 
                checked={brandId === brand.id} 
                onChange={() => { setBrandId(brand.id); setPage(1); }}
                className="accent-primary"
              />
              <span className="text-sm">{brand.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-navy">
            {isNew ? "Nouveautés" : hasDiscount ? "Promotions" : "Tous les produits"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {productsData?.total || 0} produits trouvés
          </p>
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative flex-1 md:w-64">
            <input 
              type="text" 
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Chercher..." 
              className="w-full h-10 pl-3 pr-10 rounded-md border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button type="submit" className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-primary">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Desktop View Toggles */}
          <div className="hidden md:flex border border-input rounded-md overflow-hidden bg-white">
            <button 
              onClick={() => setViewMode("grid")} 
              className={`p-2 ${viewMode === "grid" ? "bg-gray-100 text-primary" : "text-gray-400 hover:text-navy"}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode("list")} 
              className={`p-2 border-l border-input ${viewMode === "list" ? "bg-gray-100 text-primary" : "text-gray-400 hover:text-navy"}`}
            >
              <ListIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-white rounded-xl border border-border p-5 sticky top-24">
            <FilterSidebar />
          </div>
        </aside>

        {/* Mobile Filter & Sort */}
        <div className="lg:hidden flex items-center gap-3 sticky top-16 z-30 bg-gray-50 py-2 -mx-4 px-4 border-b border-border shadow-sm">
          <Drawer open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" className="flex-1 bg-white">
                <Filter className="w-4 h-4 mr-2" />
                Filtres {(categoryId || brandId) && <Badge className="ml-2 w-5 h-5 p-0 flex items-center justify-center">1</Badge>}
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader className="border-b">
                <DrawerTitle>Filtres</DrawerTitle>
              </DrawerHeader>
              <div className="p-4 overflow-y-auto">
                <FilterSidebar />
              </div>
              <div className="p-4 border-t mt-auto">
                <Button className="w-full" onClick={() => setIsMobileFilterOpen(false)}>Appliquer</Button>
              </div>
            </DrawerContent>
          </Drawer>

          <select 
            className="flex-1 h-11 rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={sortBy || ""}
            onChange={(e) => setSortBy(e.target.value as ListProductsSortBy)}
          >
            <option value="popular">Populaires</option>
            <option value="newest">Plus récents</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Desktop Sort */}
          <div className="hidden lg:flex justify-end mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Trier par:</span>
              <select 
                className="h-9 rounded-md border border-input bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={sortBy || ""}
                onChange={(e) => setSortBy(e.target.value as ListProductsSortBy)}
              >
                <option value="popular">Populaires</option>
                <option value="newest">Plus récents</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
              </select>
            </div>
          </div>

          {/* Product Grid/List */}
          {loadingProducts ? (
            <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
              {Array(8).fill(0).map((_, i) => (
                <Skeleton key={i} className={`rounded-xl ${viewMode === "grid" ? "h-[300px]" : "h-32"}`} />
              ))}
            </div>
          ) : productsData?.products.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-navy mb-2">Aucun produit trouvé</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-6">Nous n'avons trouvé aucun produit correspondant à vos critères de recherche.</p>
              <Button variant="outline" onClick={clearFilters}>Effacer les filtres</Button>
            </div>
          ) : (
            <div className={`grid gap-3 md:gap-4 ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
              {productsData?.products.map((product) => (
                <div key={product.id} className={`group relative bg-white border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${viewMode === "list" ? "flex flex-row" : "flex flex-col hover:-translate-y-1"}`}>
                  
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
                  <Link href={`/products/${product.id}`} className={`block relative bg-gray-50 overflow-hidden shrink-0 ${viewMode === "list" ? "w-32 md:w-48 h-full" : "aspect-square w-full"}`}>
                    <img 
                      src={product.images?.[0] || "https://placehold.co/400x400/1a56db/white?text=Produit"} 
                      alt={product.name}
                      className="w-full h-full object-cover p-4 transition-transform duration-300 group-hover:scale-105"
                    />
                  </Link>
                  
                  {/* Content */}
                  <div className={`p-4 flex flex-col justify-between flex-1 ${viewMode === "list" ? "" : "gap-2"}`}>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500 truncate">{product.categoryName || "Général"}</span>
                        <div className="flex items-center gap-1 text-warning">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-xs font-medium text-gray-600">{product.averageRating?.toFixed(1) || "5.0"}</span>
                        </div>
                      </div>
                      
                      <Link href={`/products/${product.id}`} className="block">
                        <h3 className={`text-sm font-bold text-navy line-clamp-2 leading-tight group-hover:text-primary transition-colors ${viewMode === "list" ? "md:text-base" : ""}`}>
                          {product.name}
                        </h3>
                      </Link>
                      
                      {viewMode === "list" && (
                        <p className="hidden md:block text-sm text-gray-500 mt-2 line-clamp-2">
                          Description complète non disponible. Veuillez cliquer sur le produit pour plus de détails.
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <div className="text-base md:text-lg font-black text-primary">{formatPrice(product.price)}</div>
                        {product.comparePrice && (
                          <div className="text-xs md:text-sm text-gray-400 line-through">{formatPrice(product.comparePrice)}</div>
                        )}
                      </div>
                      
                      <Button 
                        size={viewMode === "list" ? "default" : "icon"} 
                        className={`rounded-full shadow-sm shrink-0 transition-transform ${viewMode === "list" ? "px-4" : "w-9 h-9 hover:scale-105 active:scale-95"}`}
                        onClick={(e) => {
                          e.preventDefault();
                          addToCart(product.id, 1);
                        }}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {viewMode === "list" && <span className="ml-2 hidden md:inline">Ajouter</span>}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {productsData && productsData.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Précédent
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, productsData.totalPages) }).map((_, i) => {
                  // Logic to show pages around current page could be complex, keeping simple for demo
                  let pageNum = i + 1;
                  if (productsData.totalPages > 5 && page > 3) {
                    pageNum = page - 2 + i;
                  }
                  if (pageNum > productsData.totalPages) return null;
                  
                  return (
                    <Button 
                      key={pageNum}
                      variant={page === pageNum ? "default" : "ghost"}
                      size="sm"
                      className={`w-8 h-8 p-0 ${page === pageNum ? "bg-navy" : ""}`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === productsData.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Suivant
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
