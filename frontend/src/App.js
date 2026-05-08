import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { VoteProvider } from "./context/VoteContext";
import AuthPage from "./pages/AuthPage";
import ConfirmPage from "./pages/ConfirmPage";
import VotePage from "./pages/VotePage";
import ThankYouPage from "./pages/ThankYouPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import LiveResults from "./pages/LiveResults";
import Declaration from "./pages/Declaration";
import NoticeBoard from "./pages/NoticeBoard";

export default function App() {
  return (
    <BrowserRouter>
      <VoteProvider>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/confirm" element={<ConfirmPage />} />
          <Route path="/vote" element={<VotePage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/results" element={<LiveResults />} />
          <Route path="/board" element={<NoticeBoard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/declaration" element={<Declaration />} />
        </Routes>
        <Toaster position="top-center" richColors closeButton />
        <Analytics />
      </VoteProvider>
    </BrowserRouter>
  );
}
