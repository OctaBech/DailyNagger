import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/main.css";

function App() {
  return (
    <main className="app-shell">
      <p className="eyebrow">DailyNagger</p>
      <h1>Minimal scaffold</h1>
      <p>
        The project is ready for small, explained steps: API first, then data,
        then UI behavior.
      </p>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
