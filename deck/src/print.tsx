import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SamePagePrint } from "./SamePagePrint";
import { pitchDeck } from "./slides";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SamePagePrint deck={pitchDeck} />
  </StrictMode>,
);
