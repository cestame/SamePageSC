import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SamePageDeck } from "./SamePageDeck";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SamePageDeck />
  </StrictMode>,
);
