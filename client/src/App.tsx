import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Tables from "./pages/Tables";
import Order from "./pages/Order";
import Waiter from "./pages/Waiter";
import Kitchen from "./pages/Kitchen";
import SelectCompany from "./pages/SelectCompany";
import Cashier from "./pages/Cashier";
import CashRegister from "./pages/CashRegister";
import Reports from "./pages/Reports";
import Products from "./pages/Products";
import BuscaZapOrders from "./pages/BuscaZapOrders";
import BuscaZapStats from "./pages/BuscaZapStats";
import OrderChat from "./pages/OrderChat";
import Ratings from "./pages/Ratings";
import DeliveryControl from "./pages/DeliveryControl";
import ManageDrivers from "./pages/ManageDrivers";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/tables" component={Tables} />
      <Route path="/order/:id" component={Order} />
      <Route path="/waiter" component={Waiter} />
      <Route path="/kitchen" component={Kitchen} />
      <Route path="/products" component={Products} />
      <Route path="/buscazap-orders" component={BuscaZapOrders} />
      <Route path="/buscazap-stats" component={BuscaZapStats} />
      <Route path="/chat/:orderId" component={OrderChat} />
      <Route path="/ratings" component={Ratings} />
      <Route path="/delivery-control" component={DeliveryControl} />
      <Route path="/manage-drivers" component={ManageDrivers} />
      <Route path="/select-company" component={SelectCompany} />
      <Route path={"/cashier"} component={Cashier} />
      <Route path={"/cash-register"} component={CashRegister} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
