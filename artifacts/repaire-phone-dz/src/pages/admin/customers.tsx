import { useState } from 'react';
import { useListCustomers, useUpdateCustomer, useGetSalesChart } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Ban, CheckCircle, Mail, Phone, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminCustomers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const queryClient = useQueryClient();
  
  const { data: customersData, isLoading } = useListCustomers({
    page,
    search: search || null,
  });

  const updateCustomer = useUpdateCustomer();

  const handleToggleBlock = async (userId: number, currentBlocked: boolean) => {
    try {
      await updateCustomer.mutateAsync({ id: userId, data: { isBlocked: !currentBlocked } });
      toast.success(currentBlocked ? 'Client débloqué' : 'Client bloqué');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (err: any) {
      toast.error('Erreur lors de la modification du statut');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Gestion des Clients</h2>
      </div>

      <Card className="border-border shadow-sm">
        <div className="p-4 border-b border-border flex items-center gap-4 bg-muted/20">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher un client..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>
          <div className="text-sm text-muted-foreground font-medium md:ml-auto">
            {customersData?.total || 0} clients
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Inscription</th>
                <th className="px-4 py-3 font-semibold text-center">Commandes</th>
                <th className="px-4 py-3 font-semibold text-right">Dépenses</th>
                <th className="px-4 py-3 font-semibold text-center">Statut</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-6 bg-muted rounded animate-pulse w-full"></div></td></tr>
                ))
              ) : customersData?.customers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 border border-border">
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="font-bold text-foreground">{user.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3 w-3" /> {user.email}</div>
                      {user.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3 w-3" /> {user.phone}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="flex items-center gap-2"><Calendar className="h-3 w-3" /> {format(new Date(user.createdAt), 'dd/MM/yyyy')}</div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold">{user.totalOrders || 0}</td>
                  <td className="px-4 py-3 text-right font-extrabold text-primary">{(user.totalSpent || 0).toLocaleString('fr-DZ')} DA</td>
                  <td className="px-4 py-3 text-center">
                    {user.isBlocked ? (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Bloqué</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">Actif</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={user.isBlocked ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-destructive hover:text-destructive hover:bg-destructive/10"}
                      onClick={() => handleToggleBlock(user.id, user.isBlocked || false)}
                      disabled={updateCustomer.isPending}
                    >
                      {user.isBlocked ? <CheckCircle className="h-4 w-4 mr-2" /> : <Ban className="h-4 w-4 mr-2" />}
                      {user.isBlocked ? 'Débloquer' : 'Bloquer'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Basic Pagination */}
        {customersData && customersData.totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between bg-muted/10">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Précédent</Button>
            <span className="text-sm font-medium text-muted-foreground">Page {page} sur {customersData.totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(customersData.totalPages, p + 1))} disabled={page === customersData.totalPages}>Suivant</Button>
          </div>
        )}
      </Card>
    </div>
  );
}