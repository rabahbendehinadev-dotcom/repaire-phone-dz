import { Link, useLocation } from "wouter"
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  ShoppingCart, 
  Users, 
  Settings, 
  Image as ImageIcon,
  Ticket,
  LogOut,
  Menu,
  ChevronLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useState } from "react"
import logoImg from "@assets/ChatGPT_Image_2_août_2026,_13_45_41_1785675043454.png"

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const { logout, user } = useAuth()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const navItems = [
    { icon: LayoutDashboard, label: "Tableau de bord", href: "/admin" },
    { icon: ShoppingCart, label: "Commandes", href: "/admin/orders" },
    { icon: Package, label: "Produits", href: "/admin/products" },
    { icon: Tags, label: "Catégories", href: "/admin/categories" },
    { icon: Users, label: "Clients", href: "/admin/customers" },
    { icon: Ticket, label: "Coupons", href: "/admin/coupons" },
    { icon: ImageIcon, label: "Bannières", href: "/admin/banners" },
    { icon: Settings, label: "Paramètres", href: "/admin/settings" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-navy text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 bg-navy">
          <img src={logoImg} alt="Admin" className="h-8 object-contain brightness-0 invert" />
          <button className="lg:hidden p-1 text-white/70 hover:text-white" onClick={() => setIsMobileOpen(false)}>
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div>
              <p className="font-medium text-sm leading-none">{user?.name || "Admin"}</p>
              <p className="text-xs text-gray-400 mt-1">Administrateur</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href))
            const Icon = item.icon
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary text-white" 
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 -ml-2 text-navy" onClick={() => setIsMobileOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-semibold text-lg text-navy">Administration</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-primary hover:underline">
              Voir la boutique
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
