import { Card, CardContent } from '@/components/ui/card';
import { Activity as ActivityIcon, Construction } from 'lucide-react';

export default function AdminActivity() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-center items-center py-20 text-center">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <ActivityIcon className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Journal d'Activité</h2>
        <p className="text-muted-foreground max-w-md">
          Historique complet des actions effectuées sur le panel d'administration (modifications de produits, changements de statut de commandes, etc.).
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