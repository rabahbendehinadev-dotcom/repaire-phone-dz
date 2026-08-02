import { ReactNode, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useLocation, Link } from 'wouter';
import { 
  LayoutDashboard, Box, Tags, ShoppingCart, Users, Ticket, 
  Image as ImageIcon, Settings, Activity, LogOut, ChevronDown, UserCircle 
} from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { adminUser, isLoading, logout } = useAdminAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !adminUser) {
      setLocation('/admin/login');
    }
  }, [isLoading, adminUser, setLocation]);

  useEffect(() => {
    if (!isLoading && adminUser?.mustChangePassword && location !== '/admin/settings') {
      toast.error('Vous devez changer votre mot de passe');
      setLocation('/admin/settings');
    }
  }, [isLoading, adminUser, location, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/30">Chargement...</div>;
  }

  if (!adminUser) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
  };

  const navGroups = [
    {
      title: 'Tableau de bord',
      items: [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Catalogue',
      items: [
        { label: 'Produits', href: '/admin/products', icon: Box },
        { label: 'Catégories', href: '/admin/categories', icon: Tags },
        { label: 'Marques', href: '/admin/brands', icon: Box },
      ]
    },
    {
      title: 'Commerce',
      items: [
        { label: 'Commandes', href: '/admin/orders', icon: ShoppingCart },
        { label: 'Clients', href: '/admin/customers', icon: Users },
        { label: 'Coupons', href: '/admin/coupons', icon: Ticket },
      ]
    },
    {
      title: 'Contenu',
      items: [
        { label: 'Bannières', href: '/admin/banners', icon: ImageIcon },
        { label: 'Paramètres', href: '/admin/settings', icon: Settings },
      ]
    },
    {
      title: 'Administration',
      items: [
        { label: 'Utilisateurs', href: '/admin/users', icon: Users },
        { label: 'Activité', href: '/admin/activity', icon: Activity },
      ]
    }
  ];

  return (
    <div className="flex min-h-screen bg-muted/20 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border bg-sidebar-primary/5">
          <Link href="/admin">
            <span className="font-bold text-xl text-sidebar-primary cursor-pointer tracking-tight">Repaire<span className="text-secondary">DZ</span> Admin</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-hide">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <h4 className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-3">{group.title}</h4>
              <div className="space-y-1">
                {group.items.map((item, iIdx) => {
                  const isActive = location === item.href || (item.href !== '/admin' && location.startsWith(item.href));
                  return (
                    <Link key={iIdx} href={item.href}>
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}>
                        <item.icon className={`h-4 w-4 ${isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/60'}`} />
                        <span className="text-sm">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-sidebar-border">
          <Button variant="outline" className="w-full justify-start text-sidebar-foreground/80" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              {navGroups.flatMap(g => g.items).find(i => location === i.href || (i.href !== '/admin' && location.startsWith(i.href)))?.label || 'Administration'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 rounded-full pl-2 pr-4 flex items-center gap-2 border-border/50">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCircle className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{adminUser.fullName || adminUser.username}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{adminUser.fullName}</p>
                    <p className="text-xs text-muted-foreground">{adminUser.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="cursor-pointer w-full">Paramètres</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-muted/20 p-6">
          <div className="mx-auto max-w-6xl w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}