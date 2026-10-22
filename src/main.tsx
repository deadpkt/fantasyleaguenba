import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// აპად დაყენება (PWA): ლოკალურად არა, რომ dev-ში ქეში არ შეგვეშალოს
if ("serviceWorker" in navigator && !/^(localhost|127.0.0.1)$/.test(location.hostname)) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
