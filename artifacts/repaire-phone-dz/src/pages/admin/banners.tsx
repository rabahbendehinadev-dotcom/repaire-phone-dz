import { useState } from 'react';
import { useListBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from '@workspace/api-client-react';
import { ImageUpload } from '@/components/admin/image-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Image as ImageIcon, MoreHorizontal, PowerOff, Power } from 'lucide-react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { getListBannersQueryKey } from '@workspace/api-client-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

const bannerSchema = z.object({
  title: z.string().min(2, "Le titre est requis"),
  subtitle: z.string().optional(),
  imageUrl: z.string().optional(),
  linkUrl: z.string().optional(),
  buttonText: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().min(0).default(0),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

export default function AdminBanners() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  
  // The generated useListBanners only returns active banners.
  // We need to fetch the admin endpoint that returns all banners.
  const { data: banners, isLoading } = useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: async () => {
      const res = await fetch('/api/admin/banners', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch banners');
      return res.json();
    }
  });

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
      buttonText: '',
      isActive: true,
      sortOrder: 0,
    },
  });

  const onSubmit = async (data: BannerFormValues) => {
    try {
      const payload = {
        ...data,
        subtitle: data.subtitle || undefined,
        imageUrl: data.imageUrl || undefined,
        linkUrl: data.linkUrl || undefined,
        buttonText: data.buttonText || undefined,
      };

      if (editingBanner) {
        await updateBanner.mutateAsync({ id: editingBanner.id, data: payload as any });
        toast.success('Bannière mise à jour');
      } else {
        await createBanner.mutateAsync({ data: payload as any });
        toast.success('Bannière créée');
      }
      setIsDialogOpen(false);
      setEditingBanner(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() });
    } catch (err: any) {
      toast.error(editingBanner ? 'Erreur lors de la mise à jour' : 'Erreur lors de la création');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteBanner.mutateAsync({ id: deleteConfirmId });
      toast.success('Bannière supprimée');
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() });
    } catch (err: any) {
      toast.error('Erreur lors de la suppression.');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const toggleStatus = async (banner: any) => {
    try {
      await updateBanner.mutateAsync({ 
        id: banner.id, 
        data: { isActive: !banner.isActive } 
      });
      toast.success(banner.isActive ? 'Bannière désactivée' : 'Bannière activée');
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() });
    } catch(err) {
      toast.error('Erreur lors de la modification du statut');
    }
  };

  const openCreate = () => {
    setEditingBanner(null);
    form.reset({
      title: '',
      subtitle: '',
      imageUrl: '',
      linkUrl: '',
      buttonText: '',
      isActive: true,
      sortOrder: 0,
    });
    setIsDialogOpen(true);
  };

  const openEdit = (banner: any) => {
    setEditingBanner(banner);
    form.reset({
      title: banner.title,
      subtitle: banner.subtitle || '',
      imageUrl: banner.imageUrl || '',
      linkUrl: banner.linkUrl || '',
      buttonText: banner.buttonText || '',
      isActive: banner.isActive,
      sortOrder: banner.sortOrder || 0,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Bannières</h2>
          <p className="text-muted-foreground text-sm">Gérez le carrousel de la page d'accueil.</p>
        </div>
        <Button onClick={openCreate} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Nouvelle bannière
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="border-border shadow-sm overflow-hidden">
              <Skeleton className="h-40 w-full rounded-none" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : banners?.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-card rounded-xl border border-dashed border-border flex flex-col items-center">
            <ImageIcon className="h-12 w-12 mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium text-foreground">Aucune bannière</p>
            <p className="text-sm text-muted-foreground mt-1">Créez votre première bannière pour la page d'accueil.</p>
            <Button variant="outline" className="mt-4" onClick={openCreate}>Créer une bannière</Button>
          </div>
        ) : banners?.sort((a: any, b: any) => a.sortOrder - b.sortOrder).map((banner: any) => (
          <Card key={banner.id} className={`border-border shadow-sm overflow-hidden transition-all hover:border-primary/50 ${!banner.isActive ? 'opacity-70 grayscale-[30%]' : ''}`}>
            <div className="h-40 w-full bg-muted flex items-center justify-center relative overflow-hidden group">
              {banner.imageUrl ? (
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                <Badge className="font-mono bg-black/50 backdrop-blur-sm text-white hover:bg-black/50 border-none shadow-sm">Ordre: {banner.sortOrder}</Badge>
                {!banner.isActive && <Badge variant="destructive" className="border-none shadow-sm">Inactif</Badge>}
              </div>
            </div>
            <CardContent className="p-4 flex flex-col h-auto">
              <div className="flex-1 min-h-16">
                <h3 className="font-bold text-foreground line-clamp-1">{banner.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{banner.subtitle || <span className="italic opacity-50">Sans sous-titre</span>}</p>
              </div>
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Switch checked={banner.isActive} onCheckedChange={() => toggleStatus(banner)} />
                  <span className="text-xs font-medium">{banner.isActive ? 'Visible' : 'Masquée'}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => openEdit(banner)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteConfirmId(banner.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setTimeout(() => form.reset(), 300); }}>
        <DialogContent className="max-w-xl p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/10 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingBanner ? 'Modifier la bannière' : 'Créer une bannière'}</DialogTitle>
              <DialogDescription>Cette bannière sera affichée dans le carrousel de la page d'accueil.</DialogDescription>
            </DialogHeader>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Nouveaux arrivages iPhone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sous-titre</FormLabel>
                      <FormControl>
                        <Input placeholder="Pièces 100% originales" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image de la bannière</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={(v) => field.onChange(v ?? '')}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">Dimensions recommandées : 1200x500px, format paysage.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="buttonText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texte du bouton</FormLabel>
                        <FormControl>
                          <Input placeholder="Acheter maintenant" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="linkUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lien de destination</FormLabel>
                        <FormControl>
                          <Input placeholder="/products?categoryId=1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ordre d'affichage</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">0 = premier slide</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-col justify-end pb-2">
                        <div className="flex items-center space-x-2">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="!m-0">Bannière Active</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-border bg-background flex justify-end gap-3 shrink-0">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createBanner.isPending || updateBanner.isPending}>
                  {(createBanner.isPending || updateBanner.isPending) ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette bannière ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteBanner.isPending ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
