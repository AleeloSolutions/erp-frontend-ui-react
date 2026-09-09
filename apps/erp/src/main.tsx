import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "@/app/AppProviders";
import { App } from "@/app/App";
import { installRuntime } from "@/lib/runtime";
import "@/styles/globals.css";

// Before anything renders: the runtime a packaged module's bundle links against.
installRuntime();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>
);
