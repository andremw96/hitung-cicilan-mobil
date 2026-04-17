import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { SimulationsProvider } from "./context/SimulationsContext.tsx";
import { inject } from '@vercel/analytics';

inject();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <SimulationsProvider>
        <App />
      </SimulationsProvider>
    </AuthProvider>
  </StrictMode>
);
