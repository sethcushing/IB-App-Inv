import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./context/ThemeContext";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import ApplicationDetailPage from "./pages/ApplicationDetailPage";
import RequestsPage from "./pages/RequestsPage";
import ImportPage from "./pages/ImportPage";
import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><DashboardPage /></Layout>} />
          <Route path="/inventory" element={<Layout><InventoryPage /></Layout>} />
          <Route path="/applications/:appId" element={<Layout><ApplicationDetailPage /></Layout>} />
          <Route path="/requests" element={<Layout><RequestsPage /></Layout>} />
          <Route path="/import" element={<Layout><ImportPage /></Layout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
