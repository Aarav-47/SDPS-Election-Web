import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { VoteProvider } from "./context/VoteContext";
import AuthPage from "./pages/AuthPage";
import ConfirmPage from "./pages/ConfirmPage";
import VotePage from "./pages/VotePage";
import ThankYouPage from "./pages/ThankYouPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <VoteProvider>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/confirm" element={<ConfirmPage />} />
          <Route path="/vote" element={<VotePage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
        <Toaster position="top-center" richColors closeButton />
      </VoteProvider>
    </BrowserRouter>
  );
}
