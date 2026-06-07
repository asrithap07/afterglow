import "@/index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import AuthPage from "./components/AuthPage";
import Home from "./components/Home";
import ScrapbookPage from "./components/ScrapbookPage";
import { Toaster } from "sonner";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center scrapbook-bg"><div className="font-vt text-2xl bg-white px-4 py-2 border-2 border-black">loading afterglow...</div></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

function Gate({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Gate><AuthPage /></Gate>} />
          <Route path="/" element={<Protected><Home /></Protected>} />
          <Route path="/scrapbook/:id" element={<Protected><ScrapbookPage /></Protected>} />
        </Routes>
        <Toaster position="bottom-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}
