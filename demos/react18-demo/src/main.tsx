import "./index.css";

import { init } from "@monitor_full_stack/react_monitor";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
const monitorOptions = {
  dsn: "https://example.com/api/monitor",
  apikey: "test-api-key",
  userId: "test-user-123",
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
