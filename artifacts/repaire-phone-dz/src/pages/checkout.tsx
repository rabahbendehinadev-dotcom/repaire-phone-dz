import { useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart-store";
import { useCreateOrder } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Truck, PackageCheck, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";

const wilayas = [
  "1. Adrar", "2. Chlef", "3. Laghouat", "4. Oum El Bouaghi", "5. Batna", "6. Béjaïa", "7. Biskra", "8. Béchar", 
  "9. Blida", "10. Bouira", "11. Tamanrasset", "12. Tébessa", "13. Tlemcen", "14. Tiaret", "15. Tizi Ouzou", 
  "16. Alger", "17. Djelfa", "18. Jijel", "19. Sétif", "20. Saïda", "21. Skikda", "22. Sidi Bel Abbès", 
  "23. Annaba", "24. Guelma", "25. Constantine", "26. Médéa", "27. Mostaganem", "28. M'Sila", "29. Mascara", 
  "30. Ouargla", "31. Oran", "32. El Bayadh", "33. Illizi", "34. Bordj Bou Arreridj", "35. Boumerdès", 
  "36. El Tarf", "37. Tindouf", "38. Tissemsilt", "39. El Oued", "40. Khenchela", "41. Souk Ahras", "42. Tipaza", 
  "43. Mila", "44. Aïn Defla", "45. Naâma", "46. Aïn Témouchent", "47. Ghardaïa", "48. Relizane"
];

const checkoutSchema = z.object({
  fullName: z.string().min(3, "Nom complet requis"),
  phone: z.string().min(9, "Numéro de téléphone invalide"),
  wilaya: z.string().min(1, "Wilaya requise"),
  commune: z.string().min(2, "Commune requise"),
  address: z.string().min(5, "Adresse détaillée requise"),
  notes: z.string().optional()
});

export default function Checkout() {
  const { cart, itemCount, clearCart } = useCart();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createOrder = useCreateOrder();
  
  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: user?.name || "",
      phone: user?.phone || "",
      wilaya: "",
      commune: "",
      address: "",
      notes: ""
    }
  });

  if (!cart || cart.items.length === 0) {
    setLocation('/cart');
    return null;
  }

  const onSubmit = (data: z.infer<typeof checkoutSchema>) => {
    createOrder.mutate({
      data: {
        shippingAddress: {
          fullName: data.fullName,
          phone: data.phone,
          wilaya: data.wilaya,
          commune: data.commune,
          address: data.address
        },
        notes: data.notes
      }
    }, {
      onSuccess: (order) => {
        toast({ title: "Commande confirmée", description: `Votre commande #${order.id} a été enregistrée avec succès.` });
        clearCart();
        setLocation(`/orders/${order.id}`);
      },
      onError: () => {
        toast({ title: "Erreur", description: "Une erreur est survenue lors de la création de la commande.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <button 
        onClick={() => window.history.back()} 
        className="flex items-center text-sm font-medium text-gray-500 hover:text-navy mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Retour
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Truck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-navy">Paiement & Livraison</h1>
          <p className="text-sm text-muted-foreground">Finalisez votre commande en toute sécurité</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column - Form */}
        <div className="bg-white p-6 rounded-xl border border-border">
          <h2 className="text-xl font-bold text-navy mb-6 border-b pb-4">Adresse de livraison</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom Complet</FormLabel>
                      <FormControl>
                        <Input placeholder="Votre nom et prénom" {...field} />
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
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="0555..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="wilaya"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wilaya</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          {...field}
                        >
                          <option value="">Sélectionnez une wilaya</option>
                          {wilayas.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="commune"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commune</FormLabel>
                      <FormControl>
                        <Input placeholder="Votre commune" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse détaillée</FormLabel>
                    <FormControl>
                      <Input placeholder="Rue, bâtiment, n° de porte..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optionnel)</FormLabel>
                    <FormControl>
                      <textarea 
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="Instructions spéciales pour la livraison..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mt-8 pt-6 border-t">
                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg font-bold rounded-md"
                  disabled={createOrder.isPending}
                >
                  {createOrder.isPending ? "Traitement en cours..." : "Confirmer la commande"}
                </Button>
                <p className="text-center text-sm text-gray-500 mt-4 flex items-center justify-center gap-1">
                  <AlertCircle className="w-4 h-4" /> En cliquant sur "Confirmer", vous acceptez de payer à la livraison.
                </p>
              </div>
            </form>
          </Form>
        </div>

        {/* Right Column - Summary */}
        <div className="bg-gray-50 p-6 rounded-xl border border-border lg:sticky lg:top-24">
          <h2 className="text-xl font-bold text-navy mb-6">Résumé de la commande</h2>
          
          <div className="flex flex-col gap-4 max-h-[40vh] overflow-y-auto pr-2 mb-6">
            {cart.items.map((item: any) => (
              <div key={item.productId} className="flex gap-4">
                <div className="w-16 h-16 bg-white rounded-md shrink-0 border border-border p-1 relative">
                  <span className="absolute -top-2 -right-2 bg-navy text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {item.quantity}
                  </span>
                  <img src={item.images?.[0]} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-navy line-clamp-2">{item.name}</div>
                  <div className="text-sm text-gray-500">{formatPrice(item.price)} x {item.quantity}</div>
                </div>
                <div className="font-bold text-sm">{formatPrice(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3 text-sm border-t border-border pt-4 mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Sous-total</span>
              <span className="font-medium text-navy">{formatPrice(cart.subtotal)}</span>
            </div>
            {(cart.discount > 0 || cart.couponDiscount > 0) && (
              <div className="flex justify-between text-green-600">
                <span>Remises</span>
                <span className="font-medium">-{formatPrice(cart.discount + (cart.couponDiscount || 0))}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Livraison</span>
              <span className="font-medium text-navy">Frais selon wilaya à la livraison</span>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border flex justify-between items-center mb-6">
            <span className="font-bold text-navy">Total (hors livraison)</span>
            <span className="font-black text-2xl text-primary">{formatPrice(cart.total)}</span>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-sm text-blue-800">
            <PackageCheck className="w-5 h-5 text-primary shrink-0" />
            <p>Paiement à la livraison. Le livreur vous contactera avant son passage.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
