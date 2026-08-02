import { useGetAdminDashboard } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminDashboard() {
  const { data, isLoading } = useGetAdminDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  const stats = data || {
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    lowStockCount: 0,
    salesThisMonth: 0,
    ordersThisMonth: 0,
    recentOrders: [],
    topProducts: [],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Tableau de bord</h2>
        <div className="flex gap-2">
          {stats.pendingOrders > 0 && (
            <Badge variant="outline" className="bg-warning/10 text-warning-foreground border-warning/20">
              {stats.pendingOrders} Commande(s) en attente
            </Badge>
          )}
          {stats.lowStockCount > 0 && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
              {stats.lowStockCount} Produit(s) stock bas
            </Badge>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chiffre d'affaires</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">
              {stats.totalSales.toLocaleString('fr-DZ')} <span className="text-sm font-normal text-muted-foreground">DA</span>
            </div>
            {stats.salesThisMonth !== undefined && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500 font-medium">+{stats.salesThisMonth.toLocaleString('fr-DZ')} DA</span> ce mois
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commandes</CardTitle>
            <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{stats.totalOrders}</div>
            {stats.ordersThisMonth !== undefined && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500 font-medium">+{stats.ordersThisMonth}</span> ce mois
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clients Inscrits</CardTitle>
            <div className="h-8 w-8 rounded-full bg-navy/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-navy" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{stats.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Produits Actifs</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{stats.totalProducts}</div>
            {stats.lowStockCount > 0 && (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1 font-medium">
                <AlertTriangle className="h-3 w-3" /> {stats.lowStockCount} en rupture imminente
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b border-border">
            <CardTitle className="text-lg">Commandes Récentes</CardTitle>
            <Link href="/admin/orders" className="text-sm font-medium text-primary hover:underline">
              Tout voir
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {stats.recentOrders?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Aucune commande récente.</div>
            ) : (
              <div className="divide-y divide-border">
                {stats.recentOrders?.map((order) => (
                  <div key={order.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                    <div className="flex flex-col">
                      <Link href={`/admin/orders?id=${order.id}`} className="font-bold text-sm hover:text-primary transition-colors">
                        Commande #{order.id}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {order.userName || order.userEmail || 'Client invité'} • {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-sm text-foreground">{order.total.toLocaleString('fr-DZ')} DA</span>
                      <Badge variant="outline" className={`
                        ${order.status === 'pending' ? 'bg-warning/10 text-warning-foreground border-warning/20' : ''}
                        ${order.status === 'confirmed' ? 'bg-blue-500/10 text-blue-600 border-blue-200' : ''}
                        ${order.status === 'delivered' ? 'bg-green-500/10 text-green-600 border-green-200' : ''}
                        ${order.status === 'cancelled' ? 'bg-destructive/10 text-destructive border-destructive/20' : ''}
                      `}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="shadow-sm border-border flex flex-col">
          <CardHeader className="bg-muted/20 border-b border-border">
            <CardTitle className="text-lg">Top Produits</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {stats.topProducts?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Aucune donnée disponible.</div>
            ) : (
              <div className="divide-y divide-border">
                {stats.topProducts?.map((product, idx) => (
                  <div key={product.id} className="p-4 flex items-center gap-4 hover:bg-muted/10 transition-colors">
                    <div className="font-bold text-muted-foreground/50 w-4 text-center">{idx + 1}</div>
                    <div className="w-10 h-10 rounded bg-muted/50 p-1 flex items-center justify-center shrink-0">
                      <img src={product.images?.[0] || 'https://placehold.co/40'} alt="" className="max-h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.price.toLocaleString('fr-DZ')} DA</div>
                    </div>
                    <div className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                      {product.stock} en stock
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}