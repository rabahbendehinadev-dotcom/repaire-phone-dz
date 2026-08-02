import { useState } from 'react';
import { useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@workspace/api-client-react';
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
import { Plus, Edit, Trash2, Image as ImageIcon, FolderTree } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const categorySchema = z.object({
  name: z.string().min(2, "Nom requis"),
  description: z.string().optional(),
  imageUrl: z.string().url("URL invalide").optional().or(z.literal('')),
  iconName: z.string().optional(),
  parentId: z.coerce.number().nullable().optional(),
  sortOrder: z.coerce.number().default(0),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function AdminCategories() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useListCategories();

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      imageUrl: '',
      iconName: '',
      parentId: null,
      sortOrder: 0,
    },
  });

  const handleCreate = async (data: CategoryFormValues) => {
    try {
      await createCategory.mutateAsync({ data: data as any });
      toast.success('Catégorie créée');
      setIsCreateOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (err: any) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleUpdate = async (data: CategoryFormValues) => {
    if (!editingCategory) return;
    try {
      await updateCategory.mutateAsync({ id: editingCategory.id, data: data as any });
      toast.success('Catégorie mise à jour');
      setEditingCategory(null);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (err: any) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return;
    try {
      await deleteCategory.mutateAsync({ id });
      toast.success('Catégorie supprimée');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (err: any) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const openEdit = (category: any) => {
    form.reset({
      name: category.name,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      iconName: category.iconName || '',
      parentId: category.parentId,
      sortOrder: category.sortOrder,
    });
    setEditingCategory(category);
  };

  const FormContent = ({ isSubmitting }: { isSubmitting: boolean }) => (
    <div className="space-y-4">
      <FormField control={form.control} name="name" render={({ field }) => (
        <FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="description" render={({ field }) => (
        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="imageUrl" render={({ field }) => (
        <FormItem><FormLabel>URL Image</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
        <h2 className="text-2xl font-bold tracking-tight">Catégories</h2>
        
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if(!open) form.reset(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" /> Nouvelle Catégorie
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Créer une catégorie</DialogTitle></DialogHeader>
            <Form {...form}><form onSubmit={form.handleSubmit(handleCreate)}><FormContent isSubmitting={createCategory.isPending} /></form></Form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Modifier la catégorie</DialogTitle></DialogHeader>
            <Form {...form}><form onSubmit={form.handleSubmit(handleUpdate)}><FormContent isSubmitting={updateCategory.isPending} /></form></Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold w-16">Ordre</th>
                <th className="px-4 py-3 font-semibold">Catégorie</th>
                <th className="px-4 py-3 font-semibold text-center">Produits</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={4} className="px-4 py-4"><div className="h-6 bg-muted rounded animate-pulse w-full"></div></td></tr>
                ))
              ) : categories?.map((cat) => (
                <tr key={cat.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground font-mono">{cat.sortOrder}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-muted/50 p-2 flex items-center justify-center shrink-0 border border-border">
                        {cat.imageUrl ? <img src={cat.imageUrl} alt="" className="max-h-full object-contain" /> : <FolderTree className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{cat.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-md">{cat.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs">
                      {cat.productCount || 0}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(cat)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(cat.id)}>
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