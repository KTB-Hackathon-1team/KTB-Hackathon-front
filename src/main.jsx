import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SWRConfig } from "swr";
import "@/styles/variables.css";
import "@/styles/global.css";
import "@/styles/components.css";
import App from "./App";
import { swrFetcher } from "@/api/apiClient";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SWRConfig value={{
      fetcher: swrFetcher,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }}>
      <App />
    </SWRConfig>
  </StrictMode>,
);
