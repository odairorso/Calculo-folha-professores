import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import { ProfessoresPage } from "./pages/ProfessoresPage";
import ParametrosPage from "./pages/ParametrosPage";
import LancamentosPage from "./pages/LancamentosPage";
import FechamentoPage from "./pages/FechamentoPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/professores" element={<ProfessoresPage />} />
            <Route path="/parametros" element={<ParametrosPage />} />
            <Route path="/lancamentos" element={<LancamentosPage />} />
            <Route path="/fechamento" element={<FechamentoPage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
