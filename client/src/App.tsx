import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import SelectCompany from "./pages/SelectCompany";
import Tables from "./pages/Tables";
import Order from "./pages/Order";
import Waiter from "./pages/Waiter";
import Kitchen from "./pages/Kitchen";
import Cashier from "./pages/Cashier";
import CashRegister from "./pages/CashRegister";
import Reports from "./pages/Reports";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/select-company"} component={SelectCompany} />
      <Route path={"/tables"} component={Tables} />
      <Route path={"/order/:id"} component={Order} />
      <Route path={"/waiter"} component={Waiter} />
      <Route path={"/kitchen"} component={Kitchen} />
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
