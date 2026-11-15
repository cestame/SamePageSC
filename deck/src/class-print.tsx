import { MotionGlobalConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SamePagePrint } from "./SamePagePrint";
import { classDeck } from "./classSlides";
import "./styles.css";

MotionGlobalConfig.skipAnimations = true;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SamePagePrint deck={classDeck} />
  </StrictMode>,
);
