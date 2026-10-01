import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { PRODUCT } from "./lib/product";

document.title = `${PRODUCT.name} · Espace pro`;

createRoot(document.getElementById("root")!).render(<App />);
