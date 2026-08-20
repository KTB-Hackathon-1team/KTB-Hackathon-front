import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SWRConfig } from "swr";
import App from "./App";
import { swrFetcher } from "@/api/apiClient";
import "@/styles/variables.css";
import "@/styles/global.css";
import "@/styles/components.css";

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
