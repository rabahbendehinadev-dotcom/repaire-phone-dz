import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import logoImg from "@assets/ChatGPT_Image_2_août_2026,_13_45_41_1785675043454.png";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe requis (min 6 caractères)"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login: setAuthToken } = useAuth();
  const loginMutation = useLogin();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    }
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        setAuthToken(res.token);
        toast({ title: "Connexion réussie", description: `Bienvenue, ${res.user.name}` });
        setLocation("/");
      },
      onError: () => {
        toast({ title: "Erreur de connexion", description: "Email ou mot de passe incorrect.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-border overflow-hidden">
        <div className="bg-navy p-8 text-center flex flex-col items-center">
          <Link href="/">
            <img src={logoImg} alt="Repaire Phone DZ" className="h-10 object-contain brightness-0 invert mb-4" />
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Espace Pro</h1>
          <p className="text-gray-300 text-sm">Connectez-vous pour accéder à vos tarifs</p>
        </div>
        
        <div className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Mot de passe</FormLabel>
                      <a href="#" className="text-xs text-primary font-medium hover:underline">Mot de passe oublié?</a>
                    </div>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold mt-2" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            Nouveau chez nous ?{" "}
            <Link href="/auth/register" className="text-primary font-bold hover:underline">
              Créer un compte professionnel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
