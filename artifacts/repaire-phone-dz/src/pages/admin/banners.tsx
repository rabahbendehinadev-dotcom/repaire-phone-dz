import { useState } from 'react';
import { useListBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Image as ImageIcon, Badge } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

const bannerSchema = z.object({
  title: z.string().min(2, "Titre requis"),
  subtitle: z.string().optional(),
  imageUrl: z.string().url("URL invalide").optional().or(z.literal('')),
  linkUrl: z.string().optional(),
  buttonText: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

export default function AdminBanners() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  
  const queryClient = useQueryClient();
  const { data: banners, isLoading } = useListBanners();

  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      imageUrl: '',
      linkUrl: '',
      buttonText: 'Découvrir',
      sortOrder: 0,
      isActive: true,
    },
  });

  const handleCreate = async (data: BannerFormValues) => {
    try {
      await createBanner.mutateAsync({ data: data as any });
      toast.success('Bannière créée');
      setIsCreateOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    } catch (err: any) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleUpdate = async (data: BannerFormValues) => {
    if (!editingBanner) return;
    try {
      await updateBanner.mutateAsync({ id: editingBanner.id, data: data as any });
      toast.success('Bannière mise à jour');
      setEditingBanner(null);
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    } catch (err: any) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette bannière ?')) return;
    try {
      await deleteBanner.mutateAsync({ id });
      toast.success('Bannière supprimée');
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    } catch (err: any) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const openEdit = (banner: any) => {
    form.reset({
      title: banner.title,
      subtitle: banner.subtitle || '',
      imageUrl: banner.imageUrl || '',
      linkUrl: banner.linkUrl || '',
      buttonText: banner.buttonText || '',
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
    });
    setEditingBanner(banner);
  };

  const FormContent = ({ isSubmitting }: { isSubmitting: boolean }) => (
    <div className="space-y-4">
      <FormField control={form.control} name="title" render={({ field }) => (
        <FormItem><FormLabel>Titre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="subtitle" render={({ field }) => (
        <FormItem><FormLabel>Sous-titre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="imageUrl" render={({ field }) => (
        <FormItem><FormLabel>URL Image de fond</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      
      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="buttonText" render={({ field }) => (
          <FormItem><FormLabel>Texte du bouton</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="linkUrl" render={({ field }) => (
          <FormItem><FormLabel>Lien du bouton</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="sortOrder" render={({ field }) => (
          <FormItem><FormLabel>Ordre d'affichage</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="isActive" render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-8">
            <div className="space-y-0.5"><FormLabel>Actif</FormLabel></div>
            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
          </FormItem>
        )} />
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Enregistrement...' : 'Enregistrer'}</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Bannières Accueil</h2>
        
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if(!open) form.reset(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" /> Nouvelle Bannière
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Créer une bannière</DialogTitle></DialogHeader>
            <Form {...form}><form onSubmit={form.handleSubmit(handleCreate)}><FormContent isSubmitting={createBanner.isPending} /></form></Form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingBanner} onOpenChange={(open) => !open && setEditingBanner(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Modifier la bannière</DialogTitle></DialogHeader>
            <Form {...form}><form onSubmit={form.handleSubmit(handleUpdate)}><FormContent isSubmitting={updateBanner.isPending} /></form></Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)
        ) : banners?.map((banner) => (
          <Card key={banner.id} className={`overflow-hidden border-border transition-colors ${banner.isActive ? '' : 'opacity-60'}`}>
            <div className="relative h-48 md:h-64 w-full bg-navy/90 flex items-center p-8">
              {banner.imageUrl && (
                <div className="absolute inset-0 z-0">
                  <img src={banner.imageUrl} alt="" className="w-full h-full object-cover mix-blend-overlay opacity-50" />
                </div>
              )}
              <div className="relative z-10 w-full flex justify-between items-center">
                <div className="max-w-xl">
                  <Badge variant="outline" className="mb-4 bg-background/10 text-white border-white/20">
                    Ordre: {banner.sortOrder} {banner.isActive ? '' : '(Inactif)'}
                  </Badge>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2">{banner.title}</h3>
                  {banner.subtitle && <p className="text-white/80">{banner.subtitle}</p>}
                  {banner.buttonText && (
                    <Button size="sm" variant="secondary" className="mt-4 pointer-events-none">
                      {banner.buttonText}
                    </Button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="icon" variant="outline" className="bg-background/80 hover:bg-background border-border" onClick={() => openEdit(banner)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" className="bg-background/80 hover:bg-destructive hover:text-white border-border hover:border-destructive" onClick={() => handleDelete(banner.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {banners?.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground border-dashed">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Aucune bannière configurée.</p>
          </Card>
        )}
      </div>
    </div>
  );
}