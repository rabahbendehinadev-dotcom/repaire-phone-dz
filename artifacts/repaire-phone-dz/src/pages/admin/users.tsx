import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Construction } from 'lucide-react';

export default function AdminUsers() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-center items-center py-20 text-center">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Gestion des Administrateurs</h2>
        <p className="text-muted-foreground max-w-md">
          Cette fonctionnalité permet de créer d'autres comptes administrateurs avec des rôles spécifiques (gestionnaire de stock, service client).
        </p>
        <Card className="mt-8 border-dashed bg-muted/30">
          <CardContent className="p-6 flex items-center gap-4 text-muted-foreground">
            <Construction className="h-6 w-6 text-primary" />
            <span className="font-medium">Module en cours de développement par l'équipe backend.</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}