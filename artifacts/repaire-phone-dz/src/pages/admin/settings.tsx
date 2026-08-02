import { useState, useEffect } from 'react';
import { useGetSettings, useUpdateSettings } from '@workspace/api-client-react';
import { ImageUpload } from '@/components/admin/image-upload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Store, Phone, Mail, MapPin, Share2, Search, Truck, Lock, CreditCard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQueryClient } from '@tanstack/react-query';
import { getGetSettingsQueryKey } from '@workspace/api-client-react';

const settingsSchema = z.object({
  storeName: z.string().min(2, "Le nom est requis"),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal('')),
  address: z.string().optional(),
  facebook: z.string().url("URL invalide").optional().or(z.literal('')),
  instagram: z.string().url("URL invalide").optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  shippingCost: z.coerce.number().min(0).default(0),
  freeShippingThreshold: z.coerce.number().min(0).optional().nullable(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
  const updateSettings = useUpdateSettings();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      storeName: '',
      logoUrl: '',
      faviconUrl: '',
      phone: '',
      email: '',
      address: '',
      facebook: '',
      instagram: '',
      whatsapp: '',
      metaTitle: '',
      metaDescription: '',
      shippingCost: 500,
      freeShippingThreshold: null,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        storeName: settings.storeName,
        logoUrl: settings.logoUrl || '',
        faviconUrl: settings.faviconUrl || '',
        phone: settings.phone || '',
        email: settings.email || '',
        address: settings.address || '',
        facebook: settings.facebook || '',
        instagram: settings.instagram || '',
        whatsapp: settings.whatsapp || '',
        metaTitle: settings.metaTitle || '',
        metaDescription: settings.metaDescription || '',
        shippingCost: settings.shippingCost || 0,
        freeShippingThreshold: settings.freeShippingThreshold,
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      const payload = {
        ...data,
        logoUrl: data.logoUrl || undefined,
        faviconUrl: data.faviconUrl || undefined,
        email: data.email || undefined,
        facebook: data.facebook || undefined,
        instagram: data.instagram || undefined,
        freeShippingThreshold: data.freeShippingThreshold || null,
      };
      
      await updateSettings.mutateAsync({ data: payload as any });
      toast.success('Paramètres mis à jour avec succès');
      queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
    } catch (err: any) {
      toast.error('Erreur lors de la mise à jour des paramètres');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Mot de passe changé avec succès. Veuillez vous reconnecter.');
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du changement de mot de passe');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[40px] w-full max-w-2xl" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Paramètres</h2>
        <p className="text-muted-foreground text-sm">Gérez les informations globales de votre boutique.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b border-border overflow-x-auto pb-px">
          <TabsList className="bg-transparent h-12 w-full justify-start rounded-none p-0 flex-nowrap min-w-max">
            <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full px-6">
              <Store className="h-4 w-4 mr-2" /> Général
            </TabsTrigger>
            <TabsTrigger value="contact" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full px-6">
              <Phone className="h-4 w-4 mr-2" /> Contact & Réseaux
            </TabsTrigger>
            <TabsTrigger value="shipping" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full px-6">
              <Truck className="h-4 w-4 mr-2" /> Livraison & Paiement
            </TabsTrigger>
            <TabsTrigger value="seo" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full px-6">
              <Search className="h-4 w-4 mr-2" /> SEO
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full px-6">
              <Lock className="h-4 w-4 mr-2" /> Sécurité
            </TabsTrigger>
          </TabsList>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <TabsContent value="general" className="mt-0 outline-none">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Informations de la boutique</CardTitle>
                  <CardDescription>Informations de base affichées sur le site public.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem className="max-w-xl">
                        <FormLabel>Nom de la boutique *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem className="max-w-xl">
                        <FormLabel>Logo du magasin</FormLabel>
                        <FormControl>
                          <ImageUpload
                            folder="settings"
                            value={field.value}
                            onChange={(v) => field.onChange(v ?? '')}
                            spec={{ width: 400, height: 120, ratio: '10:3', formats: ['SVG', 'PNG', 'WebP'], note: 'Fond transparent recommandé' }}
                          />
                        </FormControl>
                        <FormDescription>Logo principal de la boutique.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="faviconUrl"
                    render={({ field }) => (
                      <FormItem className="max-w-xl">
                        <FormLabel>Favicon</FormLabel>
                        <FormControl>
                          <ImageUpload
                            folder="settings"
                            value={field.value}
                            onChange={(v) => field.onChange(v ?? '')}
                            spec={{ width: 64, height: 64, ratio: '1:1', formats: ['PNG', 'ICO'], note: 'Icône du navigateur, carré obligatoire' }}
                          />
                        </FormControl>
                        <FormDescription>Icône de l'onglet du navigateur (recommandé: 32x32px).</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="pt-4 flex justify-end max-w-xl">
                    <Button type="submit" disabled={updateSettings.isPending}>
                      {updateSettings.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="mt-0 outline-none">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Contact & Réseaux Sociaux</CardTitle>
                  <CardDescription>Comment vos clients peuvent vous contacter.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4 max-w-xl">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Coordonnées</h3>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email de contact</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contact@repaire-phone-dz.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><Phone className="h-4 w-4" /> Numéro de téléphone</FormLabel>
                          <FormControl>
                            <Input placeholder="+213..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Adresse physique</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Adresse du magasin..." className="resize-none" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4 max-w-xl pt-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Réseaux Sociaux</h3>
                    <FormField
                      control={form.control}
                      name="facebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><Share2 className="h-4 w-4" /> Page Facebook</FormLabel>
                          <FormControl>
                            <Input placeholder="https://facebook.com/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><Share2 className="h-4 w-4" /> Compte Instagram</FormLabel>
                          <FormControl>
                            <Input placeholder="https://instagram.com/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><Share2 className="h-4 w-4" /> Numéro WhatsApp</FormLabel>
                          <FormControl>
                            <Input placeholder="+213..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="pt-4 flex justify-end max-w-xl">
                    <Button type="submit" disabled={updateSettings.isPending}>
                      {updateSettings.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shipping" className="mt-0 outline-none">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Livraison & Paiement</CardTitle>
                  <CardDescription>Configurez les tarifs d'expédition et options bancaires.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4 max-w-xl">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-2"><Truck className="h-4 w-4" /> Expédition</h3>
                    <FormField
                      control={form.control}
                      name="shippingCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frais de livraison standard (DA)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="freeShippingThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Montant pour livraison gratuite (DA)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" value={field.value || ''} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} placeholder="Laissez vide pour désactiver" />
                          </FormControl>
                          <FormDescription>Les commandes au-dessus de ce montant auront la livraison offerte.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4 max-w-xl pt-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Paiement Bancaire (CCP / BaridiMob)</h3>
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 space-y-4">
                      <p className="text-sm text-muted-foreground">Ces informations seront affichées aux clients lors de la sélection du paiement par virement.</p>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nom du compte</label>
                        <Input defaultValue="BEN FLEN Foulen" />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Numéro de compte (RIP)</label>
                        <Input defaultValue="00799999000000000000" />
                      </div>
                      
                      <Button type="button" variant="outline" className="w-full">Enregistrer les infos bancaires</Button>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end max-w-xl">
                    <Button type="submit" disabled={updateSettings.isPending}>
                      {updateSettings.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="mt-0 outline-none">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Référencement (SEO)</CardTitle>
                  <CardDescription>Optimisez la visibilité de votre boutique sur les moteurs de recherche.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-w-xl">
                  <FormField
                    control={form.control}
                    name="metaTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre du site (Meta Title)</FormLabel>
                        <FormControl>
                          <Input placeholder="Repaire Phone DZ - Équipements de réparation" {...field} />
                        </FormControl>
                        <FormDescription>Le titre principal qui apparaît dans les résultats de recherche.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="metaDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description du site (Meta Description)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Le spécialiste des pièces détachées et équipements..." className="resize-none h-24" {...field} />
                        </FormControl>
                        <FormDescription>Un court résumé (150-160 caractères) affiché sous le titre dans les résultats.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="pt-4 flex justify-end">
                    <Button type="submit" disabled={updateSettings.isPending}>
                      {updateSettings.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </form>
        </Form>
        
        <TabsContent value="security" className="mt-0 outline-none">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-destructive flex items-center gap-2"><Lock className="h-5 w-5" /> Changer mon mot de passe</CardTitle>
              <CardDescription>Mettez à jour votre mot de passe administrateur actuel.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 max-w-xl">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mot de passe actuel</label>
                  <Input type="password" name="currentPassword" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nouveau mot de passe</label>
                  <Input type="password" name="newPassword" required minLength={6} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirmer le nouveau mot de passe</label>
                  <Input type="password" name="confirmPassword" required minLength={6} />
                </div>
                <div className="pt-4">
                  <Button type="submit" variant="destructive">Mettre à jour le mot de passe</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
