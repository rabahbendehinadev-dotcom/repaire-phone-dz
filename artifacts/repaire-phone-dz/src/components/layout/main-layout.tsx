import { Link, useLocation } from "wouter"
import { Home, Grid, Search, Heart, ShoppingCart, User, Menu, ChevronRight } from "lucide-react"
import { useCart } from "@/hooks/use-cart-store"
import { cn } from "@/lib/utils"
import logoImg from "@assets/ChatGPT_Image_2_août_2026,_13_45_41_1785675043454.png"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const { itemCount } = useCart()

  const navItems = [
    { icon: Home, label: "Accueil", href: "/" },
    { icon: Grid, label: "Catégories", href: "/categories" },
    { icon: Search, label: "Recherche", href: "/products" },
    { icon: Heart, label: "Favoris", href: "/wishlist" },
    { 
      icon: ShoppingCart, 
      label: "Panier", 
      href: "/cart",
      badge: itemCount > 0 ? itemCount : undefined
    },
  ]

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 pb-16 md:pb-0">
      {/* Desktop Top Bar */}
      <div className="hidden md:block bg-navy text-white text-xs py-2 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>L'équipement professionnel de réparation de téléphone en Algérie</div>
          <div className="flex gap-4">
            <Link href="/profile" className="hover:text-primary transition-colors">Mon Compte</Link>
            <Link href="/orders" className="hover:text-primary transition-colors">Mes Commandes</Link>
            <span>Service Client: +213 555 00 00 00</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Mobile Menu & Logo */}
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 -ml-2 text-navy">
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <img src={logoImg} alt="Repaire Phone DZ" className="h-8 object-contain" />
            </Link>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8 relative">
            <input 
              type="text" 
              placeholder="Rechercher un outil, une pièce..." 
              className="w-full h-11 pl-4 pr-12 rounded-full border-2 border-primary/20 focus:border-primary outline-none bg-gray-50 transition-colors"
            />
            <button className="absolute right-0 top-0 h-11 w-12 flex items-center justify-center text-primary rounded-r-full hover:bg-primary/5 transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Actions & Mobile Search Icon */}
          <div className="flex items-center gap-1 md:gap-4">
            <Link href="/products" className="md:hidden p-2 text-navy">
              <Search className="w-6 h-6" />
            </Link>
            <Link href="/profile" className="hidden md:flex flex-col items-center justify-center w-12 h-12 text-navy hover:text-primary transition-colors">
              <User className="w-6 h-6" />
              <span className="text-[10px] font-medium mt-0.5">Profil</span>
            </Link>
            <Link href="/wishlist" className="hidden md:flex flex-col items-center justify-center w-12 h-12 text-navy hover:text-primary transition-colors relative">
              <Heart className="w-6 h-6" />
              <span className="text-[10px] font-medium mt-0.5">Favoris</span>
            </Link>
            <Link href="/cart" className="relative p-2 md:flex flex-col items-center justify-center md:w-12 md:h-12 text-navy hover:text-primary transition-colors group">
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-secondary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm group-hover:scale-110 transition-transform">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="hidden md:block text-[10px] font-medium mt-0.5">Panier</span>
            </Link>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:block border-t border-border">
          <div className="container mx-auto px-4 flex items-center">
            <div className="flex items-center bg-primary text-white px-4 py-3 font-semibold gap-2 min-w-[250px] cursor-pointer">
              <Menu className="w-5 h-5" />
              Toutes les catégories
            </div>
            <nav className="flex items-center gap-6 ml-6 font-medium text-sm text-navy">
              <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
              <Link href="/products?isNew=true" className="hover:text-primary transition-colors text-secondary">Nouveautés</Link>
              <Link href="/products?hasDiscount=true" className="hover:text-primary transition-colors">Promotions</Link>
              <Link href="/products?categoryId=1" className="hover:text-primary transition-colors">Outils de précision</Link>
              <Link href="/products?categoryId=2" className="hover:text-primary transition-colors">Machines</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-navy text-gray-300 py-12 pb-24 md:pb-12 mt-auto border-t-4 border-primary">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src={logoImg} alt="Repaire Phone DZ" className="h-10 object-contain mb-4 brightness-0 invert" />
            <p className="text-sm mb-4">L'équipement professionnel numéro 1 pour la réparation de téléphones en Algérie. Précision, qualité, rapidité.</p>
            <div className="text-sm">
              <p>📍 Alger, Algérie</p>
              <p>📞 +213 555 00 00 00</p>
              <p>✉️ contact@repairephonedz.com</p>
            </div>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Liens Rapides</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-white transition-colors">Tous les produits</Link></li>
              <li><Link href="/categories" className="hover:text-white transition-colors">Catégories</Link></li>
              <li><Link href="/orders" className="hover:text-white transition-colors">Suivi de commande</Link></li>
              <li><Link href="/profile" className="hover:text-white transition-colors">Mon Compte</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Information</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">À propos</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Livraison (58 Wilayas)</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Conditions Générales</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Politique de retour</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Newsletter</h3>
            <p className="text-sm mb-4">Recevez nos dernières offres et nouveautés pour les pros.</p>
            <div className="flex">
              <input type="email" placeholder="Votre email" className="px-3 py-2 w-full text-black rounded-l-md outline-none" />
              <button className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary/90 font-medium">Ok</button>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t border-white/10 text-center text-sm">
          &copy; {new Date().getFullYear()} Repaire Phone DZ. Tous droits réservés.
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 px-2 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href))
            const Icon = item.icon
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-full relative",
                  isActive ? "text-primary" : "text-gray-500 hover:text-navy"
                )}
              >
                <div className="relative">
                  <Icon className={cn("w-6 h-6 mb-1", isActive && "stroke-[2.5px]")} />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-1 bg-secondary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </div>
                <span className={cn("text-[10px] font-medium leading-none", isActive && "font-bold")}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
