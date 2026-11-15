import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClassDeck } from "./ClassDeck";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClassDeck />
  </StrictMode>,
);
