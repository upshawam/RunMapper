import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Router } from "wouter";

const base = import.meta.env.MODE === 'production' ? '/RunMapper' : '/';

createRoot(document.getElementById("root")!).render(
  <Router base={base}>
    <App />
  </Router>
);
