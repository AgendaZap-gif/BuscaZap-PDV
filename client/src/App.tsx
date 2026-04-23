import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { BusinessTypeProvider, useBusinessType } from "./contexts/BusinessTypeContext";
import MainLayout from "./components/MainLayout";
import Home from "./pages/Home";
import BusinessTypeSelection from "./pages/BusinessTypeSelection";
import Products from "./pages/Products";
import ProductNew from "./pages/ProductNew";
import Customers from "./pages/Customers";
import CustomerDetails from "./pages/CustomerDetails";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import Stock from "./pages/Stock";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import POS from "./pages/POS";
import Notifications from "./pages/Notifications";

function Router() {
  const { businessType, isLoading } = useBusinessType();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // If no business type is selected, show selection screen
  if (!businessType) {
    return <BusinessTypeSelection />;
  }

  // make sure to consider if you need authentication for certain routes
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/select-business-type" component={BusinessTypeSelection} />
        <Route path="/products" component={Products} />
        <Route path="/products/new" component={ProductNew} />
        <Route path="/products/:id/edit" component={ProductNew} />
        <Route path="/customers" component={Customers} />
        <Route path="/customer/:id" component={CustomerDetails} />
        <Route path="/orders" component={Orders} />
        <Route path="/order/:id" component={OrderDetails} />
        <Route path="/stock" component={Stock} />
        <Route path="/reports" component={Reports} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/settings" component={Settings} />
        <Route path="/pos" component={POS} />
        <Route path="/404" component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <BusinessTypeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </BusinessTypeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
