import { useState } from 'react';
import { useListBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Box } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const brandSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  description: z.string().optional(),
  logoUrl: z.string().url("URL invalide").optional().or(z.literal('')),
  sortOrder: z.coerce.number().default(0),
});

type BrandFormValues = z.infer<typeof brandSchema>;

export default function AdminBrands() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  
  const queryClient = useQueryClient();
  const { data: brands, isLoading } = useListBrands();

  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: '',
      description: '',
      logoUrl: '',
      sortOrder: 0,
    },
  });

  const handleCreate = async (data: BrandFormValues) => {
    try {
      await createBrand.mutateAsync({ data: data as any });
      toast.success('Marque créée');
      setIsCreateOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    } catch (err: any) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleUpdate = async (data: BrandFormValues) => {
    if (!editingBrand) return;
    try {
      await updateBrand.mutateAsync({ id: editingBrand.id, data: data as any });
      toast.success('Marque mise à jour');
      setEditingBrand(null);
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    } catch (err: any) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette marque ?')) return;
    try {
      await deleteBrand.mutateAsync({ id });
      toast.success('Marque supprimée');
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    } catch (err: any) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const openEdit = (brand: any) => {
    form.reset({
      name: brand.name,
      description: brand.description || '',
      logoUrl: brand.logoUrl || '',
      sortOrder: brand.sortOrder,
    });
    setEditingBrand(brand);
  };

  const FormContent = ({ isSubmitting }: { isSubmitting: boolean }) => (
    <div className="space-y-4">
      <FormField control={form.control} name="name" render={({ field }) => (
        <FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="description" render={({ field }) => (
        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="logoUrl" render={({ field }) => (
        <FormItem><FormLabel>URL Logo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="sortOrder" render={({ field }) => (
        <FormItem><FormLabel>Ordre d'affichage</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Enregistrement...' : 'Enregistrer'}</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Marques</h2>
        
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if(!open) form.reset(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" /> Nouvelle Marque
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Créer une marque</DialogTitle></DialogHeader>
            <Form {...form}><form onSubmit={form.handleSubmit(handleCreate)}><FormContent isSubmitting={createBrand.isPending} /></form></Form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingBrand} onOpenChange={(open) => !open && setEditingBrand(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Modifier la marque</DialogTitle></DialogHeader>
            <Form {...form}><form onSubmit={form.handleSubmit(handleUpdate)}><FormContent isSubmitting={updateBrand.isPending} /></form></Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold w-16">Ordre</th>
                <th className="px-4 py-3 font-semibold">Marque</th>
                <th className="px-4 py-3 font-semibold text-center">Produits</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={4} className="px-4 py-4"><div className="h-6 bg-muted rounded animate-pulse w-full"></div></td></tr>
                ))
              ) : brands?.map((brand) => (
                <tr key={brand.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground font-mono">{brand.sortOrder}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-10 rounded bg-muted/50 p-1 flex items-center justify-center shrink-0 border border-border">
                        {brand.logoUrl ? <img src={brand.logoUrl} alt="" className="max-h-full object-contain mix-blend-multiply" /> : <Box className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{brand.name}</div>
                        <div className="text-xs text-muted-foreground">{brand.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs">
                      {brand.productCount || 0}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(brand)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(brand.id)}>
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