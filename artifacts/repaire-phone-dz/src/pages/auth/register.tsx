import { Link, useLocation } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import logoImg from "@assets/ChatGPT_Image_2_août_2026,_13_45_41_1785675043454.png";

const registerSchema = z.object({
  name: z.string().min(3, "Nom complet requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(9, "Téléphone requis"),
  password: z.string().min(6, "Mot de passe trop court (min 6)"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { login: setAuthToken } = useAuth();
  const registerMutation = useRegister();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    }
  });

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ 
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password
      }
    }, {
      onSuccess: (res) => {
        setAuthToken(res.token);
        toast({ title: "Compte créé", description: `Bienvenue chez Repaire Phone DZ, ${res.user.name}` });
        setLocation("/");
      },
      onError: () => {
        toast({ title: "Erreur", description: "L'email est peut-être déjà utilisé.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-border overflow-hidden">
        <div className="bg-primary p-8 text-center flex flex-col items-center">
          <Link href="/">
            <img src={logoImg} alt="Repaire Phone DZ" className="h-10 object-contain brightness-0 invert mb-4" />
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Rejoindre les Pros</h1>
          <p className="text-primary-foreground/80 text-sm">Créez votre compte pour commander votre équipement</p>
        </div>
        
        <div className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom Complet / Raison sociale</FormLabel>
                    <FormControl>
                      <Input placeholder="Votre nom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="pro@repaire.com" type="email" {...field} />
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold mt-4" 
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Création en cours..." : "Créer mon compte"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            Vous avez déjà un compte ?{" "}
            <Link href="/auth/login" className="text-primary font-bold hover:underline">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
