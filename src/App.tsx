import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { ThemeProvider } from "@/components/ThemeProvider";
import DashboardPage from "./pages/DashboardPage";
// ... (rest of imports omitted for brevity in replace_file_content, but I will include them in the actual replacement chunk)
import { ProfessoresPage } from "./pages/ProfessoresPage";
import ParametrosPage from "./pages/ParametrosPage";
import LancamentosPage from "./pages/LancamentosPage";
import FechamentoPage from "./pages/FechamentoPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="calculo-folha-theme">
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
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
