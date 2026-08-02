import { useState } from 'react';
import { useListCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Ticket, Percent } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

const couponSchema = z.object({
  code: z.string().min(3, "Code requis (min 3 car.)"),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().min(0, "Valeur invalide"),
  minOrderAmount: z.coerce.number().nullable().optional(),
  maxUses: z.coerce.number().nullable().optional(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

type CouponFormValues = z.infer<typeof couponSchema>;

export default function AdminCoupons() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  
  const queryClient = useQueryClient();
  const { data: coupons, isLoading } = useListCoupons();

  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '',
      discountType: 'percentage',
      discountValue: 0,
      isActive: true,
    },
  });

  const handleCreate = async (data: CouponFormValues) => {
    try {
      await createCoupon.mutateAsync({ data: data as any });
      toast.success('Coupon créé');
      setIsCreateOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    } catch (err: any) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleUpdate = async (data: CouponFormValues) => {
    if (!editingCoupon) return;
    try {
      await updateCoupon.mutateAsync({ id: editingCoupon.id, data: data as any });
      toast.success('Coupon mis à jour');
      setEditingCoupon(null);
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    } catch (err: any) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce coupon ?')) return;
    try {
      await deleteCoupon.mutateAsync({ id });
      toast.success('Coupon supprimé');
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    } catch (err: any) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const openEdit = (coupon: any) => {
    form.reset({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxUses: coupon.maxUses,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.substring(0, 16) : null,
      isActive: coupon.isActive,
    });
    setEditingCoupon(coupon);
  };

  const FormContent = ({ isSubmitting }: { isSubmitting: boolean }) => (
    <div className="space-y-4">
      <FormField control={form.control} name="code" render={({ field }) => (
        <FormItem><FormLabel>Code Promo (ex: REDUC20)</FormLabel><FormControl><Input className="uppercase" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} /></FormControl><FormMessage /></FormItem>
      )} />
      
      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="discountType" render={({ field }) => (
          <FormItem><FormLabel>Type de remise</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                <SelectItem value="fixed">Montant fixe (DA)</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="discountValue" render={({ field }) => (
          <FormItem><FormLabel>Valeur</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="minOrderAmount" render={({ field }) => (
          <FormItem><FormLabel>Montant min. (Optionnel)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="maxUses" render={({ field }) => (
          <FormItem><FormLabel>Max. utilisations (Optionnel)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>

      <FormField control={form.control} name="expiresAt" render={({ field }) => (
        <FormItem><FormLabel>Date d'expiration (Optionnelle)</FormLabel><FormControl><Input type="datetime-local" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
      )} />

      <FormField control={form.control} name="isActive" render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
          <div className="space-y-0.5"><FormLabel>Actif</FormLabel></div>
          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
        </FormItem>
      )} />

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Enregistrement...' : 'Enregistrer'}</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Coupons & Promos</h2>
        
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if(!open) form.reset(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" /> Nouveau Coupon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Créer un coupon</DialogTitle></DialogHeader>
            <Form {...form}><form onSubmit={form.handleSubmit(handleCreate)}><FormContent isSubmitting={createCoupon.isPending} /></form></Form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingCoupon} onOpenChange={(open) => !open && setEditingCoupon(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Modifier le coupon</DialogTitle></DialogHeader>
            <Form {...form}><form onSubmit={form.handleSubmit(handleUpdate)}><FormContent isSubmitting={updateCoupon.isPending} /></form></Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Remise</th>
                <th className="px-4 py-3 font-semibold">Utilisations</th>
                <th className="px-4 py-3 font-semibold">Expiration</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-6 bg-muted rounded animate-pulse w-full"></div></td></tr>
                ))
              ) : coupons?.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                        <Ticket className="h-4 w-4" />
                      </div>
                      <span className="font-extrabold text-foreground tracking-widest">{coupon.code}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString('fr-DZ')} DA`}
                    </span>
                    {coupon.minOrderAmount && (
                      <div className="text-[10px] text-muted-foreground">Dès {coupon.minOrderAmount.toLocaleString('fr-DZ')} DA</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <span className="font-bold">{coupon.usageCount}</span>
                      {coupon.maxUses ? <span className="text-muted-foreground"> / {coupon.maxUses}</span> : <span className="text-muted-foreground"> (Illimité)</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {coupon.expiresAt ? format(new Date(coupon.expiresAt), 'dd/MM/yyyy HH:mm') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {coupon.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-200">Actif</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">Inactif</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(coupon)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(coupon.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}