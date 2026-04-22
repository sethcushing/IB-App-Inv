import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./context/ThemeContext";
import PasswordGate from "./components/PasswordGate";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import ApplicationDetailPage from "./pages/ApplicationDetailPage";
import RequestsPage from "./pages/RequestsPage";
import ImportPage from "./pages/ImportPage";
import HeatmapPage from "./pages/HeatmapPage";
import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <PasswordGate>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout><DashboardPage /></Layout>} />
            <Route path="/inventory" element={<Layout><InventoryPage /></Layout>} />
            <Route path="/applications/:appId" element={<Layout><ApplicationDetailPage /></Layout>} />
            <Route path="/requests" element={<Layout><RequestsPage /></Layout>} />
            <Route path="/heatmap" element={<Layout><HeatmapPage /></Layout>} />
            <Route path="/import" element={<Layout><ImportPage /></Layout>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </BrowserRouter>
      </PasswordGate>
    </ThemeProvider>
  );
}

export default App;
