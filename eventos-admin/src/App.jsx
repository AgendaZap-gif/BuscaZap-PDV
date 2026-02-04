import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Eventos from "./pages/Eventos";
import EventoForm from "./pages/EventoForm";
import Expositores from "./pages/Expositores";
import ExpositorForm from "./pages/ExpositorForm";
import MapaEditor from "./pages/MapaEditor";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container" style={{ padding: "2rem", textAlign: "center" }}>Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="eventos" element={<Eventos />} />
          <Route path="eventos/novo" element={<EventoForm />} />
          <Route path="eventos/:id/editar" element={<EventoForm />} />
          <Route path="eventos/:id/expositores" element={<Expositores />} />
          <Route path="eventos/:eventoId/expositores/novo" element={<ExpositorForm />} />
          <Route path="eventos/:eventoId/expositores/:id/editar" element={<ExpositorForm />} />
          <Route path="eventos/:id/mapa" element={<MapaEditor />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
