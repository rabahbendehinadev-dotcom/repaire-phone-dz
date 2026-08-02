import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useUpdateMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { User, LogOut } from "lucide-react";
import { generateFallbackAvatar } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().min(3, "Nom complet requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional()
});

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const updateMe = useUpdateMe();
  const { toast } = useToast();

  if (!isAuthenticated) {
    setLocation('/auth/login');
    return null;
  }

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || ""
    }
  });

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    updateMe.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées." });
      },
      onError: () => {
        toast({ title: "Erreur", description: "Impossible de mettre à jour le profil.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-navy">Mon Profil</h1>
            <p className="text-sm text-muted-foreground mt-1">Gérez vos informations personnelles</p>
          </div>
        </div>
        <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={logout}>
          <LogOut className="w-4 h-4 mr-2" /> Déconnexion
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="p-6 md:p-8 bg-gray-50 border-b border-border flex items-center gap-6">
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-sm overflow-hidden shrink-0">
            <img src={generateFallbackAvatar(user?.name || "User")} alt={user?.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <div className="mt-2 inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-primary/10 text-primary">
              Compte Professionnel
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <h3 className="text-lg font-bold text-navy mb-6">Informations du compte</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom Complet / Raison sociale</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
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

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={updateMe.isPending}
                >
                  {updateMe.isPending ? "Sauvegarde..." : "Enregistrer les modifications"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
