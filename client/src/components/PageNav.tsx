import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut } from "lucide-react";
import { useLocation } from "wouter";

type PageNavProps = {
  /** Título exibido ao lado do botão voltar */
  title?: string;
  /** Mostrar botão Voltar (default true) */
  showBack?: boolean;
  /** Rota ao clicar em Voltar (default "/") */
  backPath?: string;
  /** Conteúdo extra à direita (ex.: botões de ação) */
  children?: React.ReactNode;
};

/**
 * Barra de navegação para páginas do PDV: Voltar + título opcional + Sair.
 * Use no topo das páginas internas para manter consistência.
 */
export function PageNav({
  title,
  showBack = true,
  backPath = "/",
  children,
}: PageNavProps) {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();

  return (
    <div className="bg-white border-b sticky top-0 z-10">
      <div className="container py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation(backPath)}
              aria-label="Voltar"
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          {title && (
            <h1 className="text-xl font-bold truncate">{title}</h1>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {children}
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
