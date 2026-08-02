import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-9xl font-black text-gray-200 mb-4">404</h1>
      <h2 className="text-3xl font-bold text-navy mb-4">Page introuvable</h2>
      <p className="text-gray-500 mb-8 max-w-md">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Link 
        href="/" 
        className="bg-primary text-white hover:bg-primary/90 px-8 py-3 rounded-full font-bold transition-colors"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
