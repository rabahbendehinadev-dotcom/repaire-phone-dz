import { useGetSettings, useUpdateSettings } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Store, Globe, Truck, Building, Save } from 'lucide-react';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const settingsSchema = z.object({
  storeName: z.string().min(2, "Nom requis"),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal('')),
  address: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  whatsapp: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  shippingCost: z.coerce.number().min(0),
  freeShippingThreshold: z.coerce.number().nullable().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AdminSettings() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const queryClient = useQueryClient();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      storeName: '',
      shippingCost: 0,
    },
  });

  // Load data into form when available
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
      await updateSettings.mutateAsync({ data: data as any });
      toast.success('Paramètres enregistrés avec succès');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch (err: any) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse">Chargement des paramètres...</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Paramètres de la boutique</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <Card className="border-border shadow-sm">
            <CardHeader className="bg-muted/20 border-b border-border">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Store className="h-5 w-5 text-primary" /> Informations Générales
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <FormField control={form.control} name="storeName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la boutique</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="logoUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL du Logo</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="faviconUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL du Favicon</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="bg-muted/20 border-b border-border">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="h-5 w-5 text-secondary" /> Contact & Adresse
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de contact</FormLabel>
                    <FormControl><Input type="email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de téléphone</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse physique de la boutique</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={form.control} name="facebook" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook (URL)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="instagram" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram (URL)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="whatsapp" render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp (Numéro)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="bg-muted/20 border-b border-border">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5 text-navy" /> Livraison
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="shippingCost" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frais de livraison par défaut (DA)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="freeShippingThreshold" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seuil de livraison gratuite (DA)</FormLabel>
                    <FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl>
                    <FormDescription>Laissez vide pour ne pas offrir de livraison gratuite.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="bg-muted/20 border-b border-border">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-indigo-500" /> SEO (Référencement)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <FormField control={form.control} name="metaTitle" render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Title</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormDescription>Le titre qui apparaîtra dans les résultats Google.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="metaDescription" render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Description</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormDescription>La description qui apparaîtra sous le titre dans les résultats Google.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4 pb-10">
            <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 px-8 h-12 shadow-lg" disabled={updateSettings.isPending}>
              <Save className="mr-2 h-5 w-5" />
              {updateSettings.isPending ? 'Enregistrement...' : 'Enregistrer les paramètres'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}