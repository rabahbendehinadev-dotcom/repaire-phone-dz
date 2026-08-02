import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { CartProvider } from '@/hooks/use-cart-store';
import { WishlistProvider } from '@/hooks/use-wishlist';
import { MainLayout } from '@/components/layout/main-layout';
import { AdminLayout } from '@/components/layout/admin-layout';
import NotFound from '@/pages/not-found';

import Home from '@/pages/home';
import Products from '@/pages/products';
import ProductDetail from '@/pages/product-detail';
import Categories from '@/pages/categories';
import Cart from '@/pages/cart';
import Checkout from '@/pages/checkout';
import Wishlist from '@/pages/wishlist';
import Orders from '@/pages/orders';
import OrderDetail from '@/pages/order-detail';
import AdminDashboard from '@/pages/admin/dashboard';
import AdminProducts from '@/pages/admin/products';
import AdminOrders from '@/pages/admin/orders';
import Profile from '@/pages/profile';
import Login from '@/pages/auth/login';
import Register from '@/pages/auth/register';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;

  if (!user || user.role !== 'admin') {
    setLocation('/auth/login');
    return null;
  }

  return <Component />;
}

function MainRoutes() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/products" component={Products} />
        <Route path="/products/:id" component={ProductDetail} />
        <Route path="/categories" component={Categories} />
        <Route path="/cart" component={Cart} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/wishlist" component={Wishlist} />
        <Route path="/orders" component={Orders} />
        <Route path="/orders/:id" component={OrderDetail} />
        <Route path="/profile" component={Profile} />
        <Route path="/auth/login" component={Login} />
        <Route path="/auth/register" component={Register} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function AdminRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/products" component={AdminProducts} />
        <Route path="/admin/orders" component={AdminOrders} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function AppRouter() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith('/admin');

  return (
    <Switch>
      {isAdminRoute ? (
        <Route path="/admin/*?">
          <AdminRoutes />
        </Route>
      ) : (
        <Route path="/*">
          <MainRoutes />
        </Route>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AppRouter />
              <Toaster />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
