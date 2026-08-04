import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'wouter';
import { useCart } from '@/hooks/use-cart-store';
import { useAuth } from '@/hooks/use-auth';
import { useCreateOrder } from '@workspace/api-client-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle2, Package, MapPin, CreditCard, Truck, Banknote, AlertCircle, Upload, Copy, Home, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseWilayaCode } from '@/lib/algeria-wilayas';

const WILAYAS = [
  "01 - Adrar", "02 - Chlef", "03 - Laghouat", "04 - Oum El Bouaghi", "05 - Batna",
  "06 - Béjaïa", "07 - Biskra", "08 - Béchar", "09 - Blida", "10 - Bouira",
  "11 - Tamanrasset", "12 - Tébessa", "13 - Tlemcen", "14 - Tiaret", "15 - Tizi Ouzou",
  "16 - Alger", "17 - Djelfa", "18 - Jijel", "19 - Sétif", "20 - Saïda",
  "21 - Skikda", "22 - Sidi Bel Abbès", "23 - Annaba", "24 - Guelma", "25 - Constantine",
  "26 - Médéa", "27 - Mostaganem", "28 - M'Sila", "29 - Mascara", "30 - Ouargla",
  "31 - Oran", "32 - El Bayadh", "33 - Illizi", "34 - Bordj Bou Arreridj", "35 - Boumerdès",
  "36 - El Tarf", "37 - Tindouf", "38 - Tissemsilt", "39 - El Oued", "40 - Khenchela",
  "41 - Souk Ahras", "42 - Tipaza", "43 - Mila", "44 - Aïn Defla", "45 - Naâma",
  "46 - Aïn Témouchent", "47 - Ghardaïa", "48 - Relizane", "49 - Timimoun", "50 - Bordj Badji Mokhtar",
  "51 - Ouled Djellal", "52 - Béni Abbès", "53 - In Salah", "54 - In Guezzam", "55 - Touggourt",
  "56 - Djanet", "57 - El M'Ghair", "58 - El Meniaa",
];

const BANK_DETAILS = {
  bankName: "BNA - Banque Nationale d'Algérie",
  accountName: "Repaire Phone DZ SARL",
  rib: "002 00100 4000120050 92",
  ccp: "1234567 Clé 89",
};

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Nom complet requis"),
  phone: z.string().min(9, "Numéro de téléphone invalide"),
  wilaya: z.string().min(1, "Veuillez sélectionner une wilaya"),
  commune: z.string().min(2, "Commune requise"),
  address: z.string().min(5, "Adresse détaillée requise"),
  notes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;
type PaymentMethod = 'cash_on_delivery' | 'bank_transfer' | 'cib_edahabia';

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; description: string; icon: React.ReactNode; badge?: string }[] = [
  {
    value: 'cash_on_delivery',
    label: 'Paiement à la livraison',
    description: 'Payez en espèces lors de la réception de votre commande.',
    icon: <Truck className="h-5 w-5" />,
  },
  {
    value: 'bank_transfer',
    label: 'Virement bancaire',
    description: 'Effectuez un virement sur notre compte et envoyez la preuve.',
    icon: <Banknote className="h-5 w-5" />,
  },
  {
    value: 'cib_edahabia',
    label: 'CIB / Edahabia',
    description: 'Paiement par carte bancaire algérienne (CIB ou Edahabia).',
    icon: <CreditCard className="h-5 w-5" />,
    badge: 'Bientôt disponible',
  },
];

export default function Checkout() {
  const { cart, isLoading, clearCart, isGuest } = useCart();
  const { isAuthenticated } = useAuth();
  const createOrder = useCreateOrder();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [, setLocation] = useLocation();
  const [orderComplete, setOrderComplete] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [proofUrl, setProofUrl] = useState('');
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());
  // Shipping rate state — loaded dynamically when wilaya is selected
  const [wilayaRate, setWilayaRate] = useState<any>(null);
  const [isRateLoading, setIsRateLoading] = useState(false);
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<'domicile' | 'stop_desk' | null>(null);
  const [availableOffices, setAvailableOffices] = useState<any[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<any>(null);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { fullName: '', phone: '', wilaya: '', commune: '', address: '', notes: '' },
  });

  // Fetch active wilaya codes once on mount to disable inactive ones in the dropdown
  const [activeWilayaCodes, setActiveWilayaCodes] = useState<Set<string> | null>(null);
  useEffect(() => {
    fetch('/api/shipping/wilayas')
      .then(r => r.json())
      .then(d => setActiveWilayaCodes(new Set((d.wilayas as any[]).map(w => w.wilayaCode))))
      .catch(() => setActiveWilayaCodes(null)); // on error, treat all as available
  }, []);

  // Watch wilaya to fetch shipping rate when it changes
  const watchedWilaya = form.watch('wilaya');
  useEffect(() => {
    if (!watchedWilaya) { setWilayaRate(null); setSelectedDeliveryType(null); setSelectedOffice(null); return; }
    const code = parseWilayaCode(watchedWilaya);
    if (!code) return;
    setIsRateLoading(true); setWilayaRate(null); setSelectedDeliveryType(null); setSelectedOffice(null);
    fetch(`/api/shipping/wilayas/${code}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(rate => {
        if (!rate.isActive) return; // leave wilayaRate null → shows "unavailable" message
        setWilayaRate(rate);
        // Auto-select when only one delivery method is enabled
        if (rate.homeDeliveryEnabled && !rate.stopDeskEnabled) setSelectedDeliveryType('domicile');
        else if (!rate.homeDeliveryEnabled && rate.stopDeskEnabled) setSelectedDeliveryType('stop_desk');
      })
      .catch(() => {}) // rate stays null → "unavailable" message shown
      .finally(() => setIsRateLoading(false));
  }, [watchedWilaya]);

  useEffect(() => {
    if (selectedDeliveryType !== 'stop_desk' || !watchedWilaya) {
      setAvailableOffices([]); setSelectedOffice(null); return;
    }
    const code = parseWilayaCode(watchedWilaya);
    if (!code) return;
    setSelectedOffice(null);
    fetch(`/api/shipping/offices?wilayaCode=${code}`)
      .then(r => r.json())
      .then(d => setAvailableOffices(d.offices || []))
      .catch(() => setAvailableOffices([]));
  }, [selectedDeliveryType, watchedWilaya]);

  const computedShipping = useMemo(() => {
    if (!wilayaRate || !selectedDeliveryType) return Number(cart?.shipping ?? 500);
    return selectedDeliveryType === 'domicile' ? wilayaRate.homeDeliveryPrice : wilayaRate.stopDeskPrice;
  }, [wilayaRate, selectedDeliveryType, cart]);

  const displayTotal = useMemo(() => {
    if (!cart) return 0;
    return (Number(cart.subtotal) || 0)
      - (Number(cart.discount) || 0)
      - (Number(cart.couponDiscount) || 0)
      + computedShipping;
  }, [cart, computedShipping]);

  const onSubmit = async (data: CheckoutFormValues) => {
    if (!cart || cart.items.length === 0) return;
    // Validate stop desk office selection
    if (selectedDeliveryType === 'stop_desk' && availableOffices.length > 0 && !selectedOffice) {
      toast.error('Veuillez sélectionner un bureau de livraison Stop Desk'); return;
    }
    setIsSubmitting(true);
    const wilayaCode = parseWilayaCode(data.wilaya) ?? undefined;
    const deliveryPayload = {
      deliveryType: selectedDeliveryType ?? 'domicile',
      wilayaCode,
      officeId: selectedOffice?.id,
    };
    try {
      const shippingAddress = {
        fullName: data.fullName,
        phone: data.phone,
        wilaya: data.wilaya,
        commune: data.commune,
        address: data.address,
      };

      let order: any;

      if (isAuthenticated) {
        // Authenticated: use server cart (existing flow)
        order = await createOrder.mutateAsync({
          data: {
            shippingAddress,
            notes: data.notes,
            paymentMethod,
            idempotencyKey: idempotencyKeyRef.current,
            ...deliveryPayload,
          } as any,
        });
      } else {
        // Guest: send cart items directly to the guest endpoint
        const res = await fetch('/api/orders/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.items,
            shippingAddress,
            notes: data.notes,
            paymentMethod,
            idempotencyKey: idempotencyKeyRef.current,
            ...deliveryPayload,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Erreur serveur');
        }
        order = await res.json();
      }

      clearCart();
      setOrderComplete(order);
      toast.success('Commande validée avec succès');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la validation de la commande');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!proofUrl.trim() || !orderComplete) return;
    setIsSubmittingProof(true);
    try {
      // Use the guest endpoint if no userId on order, otherwise the authenticated one
      const endpoint = orderComplete.userId
        ? `/api/orders/${orderComplete.id}/payment-proof`
        : `/api/orders/guest/${orderComplete.id}/payment-proof`;

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paymentProofUrl: proofUrl.trim() }),
      });
      if (!res.ok) throw new Error();
      setProofSubmitted(true);
      toast.success('Preuve de paiement envoyée. Nous vérifierons votre virement.');
    } catch {
      toast.error("Erreur lors de l'envoi de la preuve");
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié !');
  };

  if (isLoading) return <div className="p-20 text-center">Chargement...</div>;

  // ── Order confirmation screen ───────────────────────────────────────────────
  if (orderComplete) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-extrabold mb-3 tracking-tight">Commande Confirmée !</h2>
          <p className="text-muted-foreground text-lg mb-2">
            Commande <span className="font-bold text-foreground">#{orderComplete.id}</span> enregistrée avec succès.
          </p>
          {isGuest && (
            <p className="text-sm text-muted-foreground mt-1">
              Commande passée en tant que visiteur — pas besoin de compte.
            </p>
          )}
        </div>

        {/* Bank transfer instructions */}
        {orderComplete.paymentMethod === 'bank_transfer' && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <h3 className="font-bold text-amber-800 dark:text-amber-400">Action requise — Virement bancaire</h3>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                Effectuez votre virement sur le compte suivant, puis envoyez-nous la preuve ci-dessous.
              </p>
              <div className="space-y-3 mb-5">
                {Object.entries({
                  Banque: BANK_DETAILS.bankName,
                  'Nom du compte': BANK_DETAILS.accountName,
                  RIB: BANK_DETAILS.rib,
                  CCP: BANK_DETAILS.ccp,
                }).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between bg-white/70 dark:bg-black/20 rounded-lg p-3">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{label}</p>
                      <p className="font-mono font-bold text-sm text-foreground">{value}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyToClipboard(value)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              {!proofSubmitted ? (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Envoyer la preuve de paiement
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Uploadez une photo de votre reçu sur Imgbb, Cloudinary ou tout hébergeur d'images, puis collez le lien ici.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://i.ibb.co/... (lien de votre reçu)"
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      className="bg-white/80 dark:bg-black/20"
                    />
                    <Button
                      onClick={handleSubmitProof}
                      disabled={!proofUrl.trim() || isSubmittingProof}
                      className="shrink-0"
                    >
                      {isSubmittingProof ? '...' : 'Envoyer'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Preuve envoyée — nous traiterons votre paiement sous 24h.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {orderComplete.paymentMethod === 'cib_edahabia' && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-blue-800 dark:text-blue-400">Paiement en ligne bientôt disponible</h3>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Le paiement par CIB/Edahabia sera disponible prochainement. Notre équipe vous contactera pour finaliser le règlement.
              </p>
            </CardContent>
          </Card>
        )}

        {orderComplete.paymentMethod === 'cash_on_delivery' && (
          <p className="text-center text-muted-foreground mb-6">
            Notre équipe vous contactera pour confirmer la livraison.
          </p>
        )}

        <div className="flex gap-4 justify-center">
          {isAuthenticated && (
            <Button asChild variant="outline">
              <Link href="/orders">Voir mes commandes</Link>
            </Button>
          )}
          <Button asChild className="bg-primary">
            <Link href="/products">Continuer les achats</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    setLocation('/cart');
    return null;
  }

  // ── Checkout form ──────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">Validation de la commande</h1>
      {isGuest && (
        <p className="text-sm text-muted-foreground mb-8">
          Vous achetez en tant que visiteur — aucun compte requis.
        </p>
      )}
      {!isGuest && <div className="mb-8" />}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Checkout Form */}
        <div className="flex-1 w-full space-y-6">
          {/* Delivery Info */}
          <Card className="border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Informations de livraison</h2>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id="checkout-form">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom et Prénom</FormLabel>
                        <FormControl><Input placeholder="Votre nom complet" {...field} className="bg-muted/30 h-11" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro de téléphone</FormLabel>
                        <FormControl><Input placeholder="05xx xx xx xx" {...field} className="bg-muted/30 h-11" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="wilaya" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wilaya</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-muted/30 h-11">
                              <SelectValue placeholder="Sélectionnez votre wilaya" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-60">
                            {WILAYAS.map(w => {
                              const code = w.split(' - ')[0].trim();
                              const unavailable = activeWilayaCodes !== null && !activeWilayaCodes.has(code);
                              return (
                                <SelectItem key={w} value={w} disabled={unavailable}>
                                  {w}{unavailable ? ' — Indisponible' : ''}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="commune" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commune</FormLabel>
                        <FormControl><Input placeholder="Votre commune" {...field} className="bg-muted/30 h-11" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse détaillée</FormLabel>
                      <FormControl><Textarea placeholder="Nom de rue, numéro de bâtiment, etc." {...field} className="bg-muted/30 resize-none" rows={3} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optionnel)</FormLabel>
                      <FormControl><Textarea placeholder="Indications pour le livreur..." {...field} className="bg-muted/30 resize-none" rows={2} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* ── Delivery Type Selection ── */}
          {watchedWilaya && (
            <Card className="border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <div className="h-10 w-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Truck className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold">Mode de livraison</h2>
                </div>

                {isRateLoading ? (
                  <div className="space-y-3">
                    <div className="h-16 rounded-xl bg-muted/40 animate-pulse" />
                    <div className="h-16 rounded-xl bg-muted/40 animate-pulse" />
                  </div>
                ) : !wilayaRate ? (
                  <div className="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-destructive text-sm">Livraison non disponible</p>
                      <p className="text-sm text-muted-foreground mt-0.5">La livraison n'est pas encore configurée pour cette wilaya. Contactez-nous au 0550 123 456.</p>
                    </div>
                  </div>
                ) : wilayaRate ? (
                  <div className="space-y-3">
                    {wilayaRate.homeDeliveryEnabled && (
                      <button type="button" onClick={() => setSelectedDeliveryType('domicile')}
                        className={cn("w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                          selectedDeliveryType === 'domicile' ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:border-muted-foreground/30")}>
                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                          selectedDeliveryType === 'domicile' ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                          <Home className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold">Livraison à domicile</div>
                          <div className="text-sm text-muted-foreground">{wilayaRate.minDeliveryDays}–{wilayaRate.maxDeliveryDays} jours ouvrables</div>
                        </div>
                        <div className="font-bold text-primary text-right">{wilayaRate.homeDeliveryPrice.toLocaleString('fr-DZ')} DA</div>
                        <div className={cn("h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center",
                          selectedDeliveryType === 'domicile' ? "border-primary" : "border-muted-foreground/30")}>
                          {selectedDeliveryType === 'domicile' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                        </div>
                      </button>
                    )}

                    {wilayaRate.stopDeskEnabled && (
                      <button type="button" onClick={() => setSelectedDeliveryType('stop_desk')}
                        className={cn("w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                          selectedDeliveryType === 'stop_desk' ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:border-muted-foreground/30")}>
                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                          selectedDeliveryType === 'stop_desk' ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold">Stop Desk — retrait en agence</div>
                          <div className="text-sm text-muted-foreground">{wilayaRate.minDeliveryDays}–{wilayaRate.maxDeliveryDays} jours ouvrables</div>
                        </div>
                        <div className="font-bold text-primary text-right">{wilayaRate.stopDeskPrice.toLocaleString('fr-DZ')} DA</div>
                        <div className={cn("h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center",
                          selectedDeliveryType === 'stop_desk' ? "border-primary" : "border-muted-foreground/30")}>
                          {selectedDeliveryType === 'stop_desk' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                        </div>
                      </button>
                    )}

                    {!wilayaRate.homeDeliveryEnabled && !wilayaRate.stopDeskEnabled && (
                      <p className="text-sm text-destructive p-3 bg-destructive/5 rounded-lg">
                        Livraison non disponible pour cette wilaya. Contactez-nous pour plus d'informations.
                      </p>
                    )}

                    {selectedDeliveryType === 'stop_desk' && (
                      <div className="pt-1 space-y-2">
                        <Label className="text-sm font-semibold">Bureau de livraison</Label>
                        {availableOffices.length === 0 ? (
                          <p className="text-sm text-muted-foreground p-3 bg-muted/20 rounded-lg">
                            Aucun bureau Stop Desk disponible pour cette wilaya. Veuillez choisir la livraison à domicile.
                          </p>
                        ) : (
                          <Select value={selectedOffice?.id?.toString() ?? ''}
                            onValueChange={val => setSelectedOffice(availableOffices.find(o => o.id.toString() === val) ?? null)}>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Choisir un bureau…" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableOffices.map(o => (
                                <SelectItem key={o.id} value={o.id.toString()}>
                                  {o.name}{o.commune ? ` — ${o.commune}` : ''}{o.address ? ` (${o.address})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Tarif calculé automatiquement selon votre wilaya de livraison.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          <Card className="border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div className="h-10 w-10 bg-secondary/10 rounded-full flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-secondary" />
                </div>
                <h2 className="text-xl font-bold">Mode de paiement</h2>
              </div>

              <div className="space-y-3">
                {PAYMENT_OPTIONS.map((option) => {
                  const isDisabled = option.value === 'cib_edahabia';
                  const isSelected = paymentMethod === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => !isDisabled && setPaymentMethod(option.value)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                        isSelected && !isDisabled ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:border-muted-foreground/30",
                        isDisabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                        isSelected && !isDisabled ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {option.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground">{option.label}</span>
                          {option.badge && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium border border-border">
                              {option.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{option.description}</p>
                      </div>
                      <div className={cn(
                        "h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center",
                        isSelected && !isDisabled ? "border-primary" : "border-muted-foreground/30"
                      )}>
                        {isSelected && !isDisabled && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {paymentMethod === 'bank_transfer' && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-xl">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Instructions de virement
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                    Après avoir passé votre commande, vous verrez les coordonnées bancaires et pourrez envoyer votre preuve de virement.
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Banque :</span>
                      <span className="font-medium">{BANK_DETAILS.bankName}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Compte :</span>
                      <span className="font-mono font-medium">{BANK_DETAILS.accountName}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-[400px] shrink-0">
          <Card className="border-border shadow-md sticky top-24">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div className="h-10 w-10 bg-navy/10 rounded-full flex items-center justify-center">
                  <Package className="h-5 w-5 text-navy" />
                </div>
                <h2 className="text-xl font-bold">Votre Commande</h2>
              </div>

              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 mb-6 scrollbar-hide">
                {cart.items.map((item: any) => (
                  <div key={item.productId} className="flex gap-4 text-sm">
                    <div className="relative w-16 h-16 bg-muted/30 rounded-lg p-1 border border-border/50 shrink-0">
                      <img src={item.images?.[0]} alt="" className="max-h-full object-contain" />
                      <span className="absolute -top-2 -right-2 bg-muted text-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border border-border">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="font-bold text-foreground line-clamp-2 leading-tight mb-1">{item.name}</div>
                      <div className="text-primary font-bold">{Number(item.price).toLocaleString('fr-DZ')} DA</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 text-sm pt-4 border-t border-border mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-bold">{Number(cart.subtotal).toLocaleString('fr-DZ')} DA</span>
                </div>
                {((cart.discount > 0) || (cart.couponDiscount > 0)) && (
                  <div className="flex justify-between text-secondary font-bold">
                    <span>Remises</span>
                    <span>-{((cart.discount || 0) + (cart.couponDiscount || 0)).toLocaleString('fr-DZ')} DA</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livraison</span>
                  <span className="font-bold">
                    {computedShipping === 0 ? 'Gratuite' : `${computedShipping.toLocaleString('fr-DZ')} DA`}
                  </span>
                </div>
                {wilayaRate && selectedDeliveryType && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Délai estimé</span>
                    <span>{wilayaRate.minDeliveryDays}–{wilayaRate.maxDeliveryDays} jours ouvrables</span>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-foreground text-lg">Total</span>
                  <span className="font-extrabold text-2xl text-primary tracking-tight">{displayTotal.toLocaleString('fr-DZ')} DA</span>
                </div>
              </div>

              <Button
                type="submit"
                form="checkout-form"
                className="w-full h-14 text-base font-bold bg-secondary hover:bg-secondary/90 text-white shadow-lg shadow-secondary/20"
                disabled={isSubmitting || createOrder.isPending}
              >
                {(isSubmitting || createOrder.isPending) ? 'Validation en cours...' : 'Confirmer la commande'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
