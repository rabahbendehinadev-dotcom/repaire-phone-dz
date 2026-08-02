import { Link } from "wouter";
import { useListCategories } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Wrench } from "lucide-react";

export default function Categories() {
  const { data: categories, isLoading } = useListCategories();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Wrench className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-navy">Catégories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Trouvez l'équipement qu'il vous faut par catégorie
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {isLoading ? (
          Array(12).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
        ) : (
          categories?.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/products?categoryId=${cat.id}`} 
              className="flex flex-col items-center p-6 bg-white border border-border rounded-xl hover:border-primary hover:shadow-md transition-all group"
            >
              <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center p-4 mb-4">
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                ) : (
                  <div className="w-10 h-10 bg-primary/20 rounded-full" />
                )}
              </div>
              <h3 className="text-sm font-bold text-center text-navy mb-1 group-hover:text-primary transition-colors">{cat.name}</h3>
              <span className="text-xs text-gray-400 group-hover:text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Explorer <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
