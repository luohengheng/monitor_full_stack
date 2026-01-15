import "./index.css";

import { init } from "@monitor_full_stack/react_monitor";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
const monitorOptions = {
  dsn: import.meta.env.VITE_MONITOR_DSN || "",
  apikey: import.meta.env.VITE_MONITOR_API_KEY || "",
  userId: import.meta.env.VITE_MONITOR_USER_ID || "",
  silentXhr: false,
  silentFetch: false,
  silentClick: false,
  silentError: false,
  silentUnhandledrejection: false,
  silentHashchange: false,
  silentHistory: false,
  silentPerformance: false,
  silentWhiteScreen: false,
  silentRecordScreen: false,
  recordScreentime: 10,
  maxBreadcrumbs: 50,
  xhrTimeoutThreshold: 5000,
};

init(monitorOptions);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App monitorConfig={monitorOptions} />
  </StrictMode>,
);
