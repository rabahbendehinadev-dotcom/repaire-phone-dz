import { useGetAdminDashboard, useGetSalesChart } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { DollarSign, ShoppingCart, Package, Users, AlertTriangle, TrendingUp } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { data: stats, isLoading: loadingStats } = useGetAdminDashboard();
  const { data: chartData, isLoading: loadingChart } = useGetSalesChart({ period: "30d" });

  if (loadingStats || loadingChart) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  const statCards = [
    { title: "Chiffre d'affaires", value: formatPrice(stats?.totalSales || 0), icon: DollarSign, color: "text-green-500", bg: "bg-green-100" },
    { title: "Commandes", value: stats?.totalOrders || 0, icon: ShoppingCart, color: "text-blue-500", bg: "bg-blue-100" },
    { title: "Produits", value: stats?.totalProducts || 0, icon: Package, color: "text-purple-500", bg: "bg-purple-100" },
    { title: "Clients", value: stats?.totalCustomers || 0, icon: Users, color: "text-orange-500", bg: "bg-orange-100" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-navy">Vue d'ensemble</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                <h3 className="text-2xl font-black text-navy">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Évolution des ventes (30 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a56db" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1a56db" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} DA`} />
                    <Tooltip />
                    <Area type="monotone" dataKey="sales" stroke="#1a56db" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground flex-col">
                  <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
                  <p>Pas assez de données</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Alertes Stock</CardTitle>
            <AlertTriangle className="w-5 h-5 text-warning" />
          </CardHeader>
          <CardContent>
            {(stats?.lowStockCount ?? 0) > 0 ? (
              <div className="space-y-4 mt-4">
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm font-medium">
                  {stats?.lowStockCount} produits en rupture ou stock bas
                </div>
                {/* Normally we'd fetch and list the specific products here */}
                <p className="text-sm text-muted-foreground">Consultez la liste des produits pour réapprovisionner.</p>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-center text-muted-foreground flex-col">
                <Package className="w-8 h-8 mb-2 text-green-500 opacity-50" />
                <p>Tous les stocks sont normaux</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Commandes récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-4 py-3 rounded-l-md">ID</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right rounded-r-md">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentOrders?.slice(0, 5).map(order => (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium">#{order.id}</td>
                    <td className="px-4 py-3">{order.userName || order.userEmail || "Anonyme"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={order.status === 'delivered' ? 'success' : order.status === 'pending' ? 'warning' : 'default'}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-navy">{formatPrice(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
